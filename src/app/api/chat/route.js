import { after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

const AI_URL = "https://ai.hackclub.com/proxy/v1/chat/completions";
const MODEL = process.env.HACKCLUB_AI_MODEL || "qwen/qwen3-32b";

// Only the most recent messages are sent back to the model as context
const HISTORY_LIMIT = 30;
const MAX_MESSAGE_LENGTH = 8000;

const SYSTEM_PROMPT =
  "You are Ask Heroes, a friendly and helpful assistant. Answer clearly and concisely.";

const TITLE_PROMPT =
  "Write a short title (at most 6 words) for a conversation that starts with the user's message below. Reply with the title only, no quotes.";

// Firestore auto ids are 20 alphanumeric chars; this also blocks "/" path tricks
const CHAT_ID_PATTERN = /^[A-Za-z0-9]{1,64}$/;

function errorResponse(message, status, extra = {}) {
  return Response.json({ error: message, ...extra }, { status });
}

function callAI(messages, stream) {
  return fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HACKCLUB_AI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, messages, stream }),
  });
}

function aiErrorMessage(status) {
  if (status === 429) return "Too many requests, try again in a moment.";
  if (status === 402) return "The daily AI limit has been reached.";
  return "The AI couldn't respond, please try again.";
}

// Turns the AI's server-sent events into plain chunks of reply text
async function* readReplyDeltas(body) {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) return;

    buffer += value;
    const lines = buffer.split("\n");
    // the last line may be cut off mid-event, keep it for the next read
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      // skips blank lines and ": keep-alive" comments
      if (!trimmed.startsWith("data:")) continue;

      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;

      try {
        const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // ignore malformed events
      }
    }
  }
}

async function generateTitle(chatRef, message) {
  try {
    const res = await callAI(
      [
        { role: "system", content: TITLE_PROMPT },
        { role: "user", content: message.slice(0, 1000) },
      ],
      false,
    );
    if (!res.ok) return;

    const data = await res.json();
    const title = (data.choices?.[0]?.message?.content ?? "")
      .replace(/<think>[\s\S]*?<\/think>/g, "") // reasoning models may think out loud
      .trim()
      .replace(/^["'\s]+|["'\s.]+$/g, "")
      .slice(0, 60);

    if (title) await chatRef.update({ title });
  } catch (error) {
    console.error("Title generation failed:", error);
  }
}

export async function POST(request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!idToken) return errorResponse("You need to be signed in.", 401);

  // outside the try so a missing env var shows up as a real error, not a 401
  const adminAuth = getAdminAuth();
  let uid;
  try {
    ({ uid } = await adminAuth.verifyIdToken(idToken));
  } catch {
    return errorResponse("Your session expired, please sign in again.", 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request.", 400);
  }

  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) return errorResponse("Message can't be empty.", 400);
  if (message.length > MAX_MESSAGE_LENGTH) {
    return errorResponse("That message is too long.", 400);
  }

  // Chats live under the user's own doc, so ownership comes from the path
  const chatsRef = getAdminDb()
    .collection("users")
    .doc(uid)
    .collection("chats");
  let chatRef;
  let history = [];
  const isNewChat = !body.chatId;

  if (isNewChat) {
    chatRef = chatsRef.doc();
    await chatRef.set({
      title: "New chat",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    if (typeof body.chatId !== "string" || !CHAT_ID_PATTERN.test(body.chatId)) {
      return errorResponse("Chat not found.", 404);
    }
    chatRef = chatsRef.doc(body.chatId);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) return errorResponse("Chat not found.", 404);

    const historySnap = await chatRef
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(HISTORY_LIMIT)
      .get();
    history = historySnap.docs
      .reverse()
      .map((d) => ({ role: d.data().role, content: d.data().content }));
  }

  const messagesRef = chatRef.collection("messages");
  await messagesRef.add({
    role: "user",
    content: message,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Runs once the response is done, so the reply isn't held up waiting on it
  if (isNewChat) after(() => generateTitle(chatRef, message));

  const aiRes = await callAI(
    [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message },
    ],
    true,
  ).catch(() => null);

  if (!aiRes?.ok || !aiRes.body) {
    // the chat (and the user's message) still exist, so send the id back
    return errorResponse(aiErrorMessage(aiRes?.status), 502, {
      chatId: chatRef.id,
    });
  }

  let clientGone = false;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let reply = "";

      try {
        for await (const delta of readReplyDeltas(aiRes.body)) {
          reply += delta;
          // keep reading even if the tab closed, so the full reply still gets saved
          if (clientGone) continue;
          try {
            controller.enqueue(encoder.encode(delta));
          } catch {
            clientGone = true;
          }
        }
      } catch (error) {
        console.error("AI stream failed:", error);
      }

      // Save before closing, serverless hosts can stop the function once the response ends
      try {
        if (reply) {
          await messagesRef.add({
            role: "assistant",
            content: reply,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
        await chatRef.update({ updatedAt: FieldValue.serverTimestamp() });
      } catch (error) {
        console.error("Saving reply failed:", error);
      }

      try {
        controller.close();
      } catch {
        // already closed by the client disconnecting
      }
    },
    cancel() {
      clientGone = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Chat-Id": chatRef.id,
    },
  });
}
