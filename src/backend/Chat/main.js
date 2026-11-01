import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

export function watchChats(db, uid, callback, onError) {
  const chatsQuery = query(
    collection(db, "users", uid, "chats"),
    orderBy("updatedAt", "desc"),
  );
  return onSnapshot(
    chatsQuery,
    (snapshot) =>
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  );
}

export async function getChatMessages(db, uid, chatId) {
  const chatSnap = await getDoc(doc(db, "users", uid, "chats", chatId));
  if (!chatSnap.exists()) throw new Error("Chat not found.");

  const snapshot = await getDocs(
    query(
      collection(db, "users", uid, "chats", chatId, "messages"),
      orderBy("createdAt"),
    ),
  );
  return snapshot.docs.map((d) => ({
    id: d.id,
    role: d.data().role,
    content: d.data().content,
  }));
}

// Sends a message and streams the reply back.
// `onChatId` fires as soon as the server knows which chat this is (new chats get one here),
// `onDelta` fires for every chunk of reply text. Resolves with the full reply.
export async function sendChatMessage(
  auth,
  { chatId, message },
  { onChatId, onDelta, signal } = {},
) {
  const idToken = await auth.currentUser.getIdToken();
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ chatId, message }),
    signal,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (data.chatId) onChatId?.(data.chatId);
    throw new Error(data.error ?? "Something went wrong, please try again.");
  }

  onChatId?.(res.headers.get("X-Chat-Id"));

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let reply = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) return reply;
    reply += value;
    onDelta?.(value);
  }
}
