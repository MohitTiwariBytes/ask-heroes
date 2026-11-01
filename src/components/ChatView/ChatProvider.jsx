"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { getChatMessages, sendChatMessage } from "@/backend/Chat/main";
import { useToast } from "../toast/ToastProvider";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const activeChatIdRef = useRef(null);
  const abortRef = useRef(null);

  const resetTo = useCallback((chatId) => {
    abortRef.current?.abort();
    abortRef.current = null;
    activeChatIdRef.current = chatId;
    setActiveChatId(chatId);
    setMessages([]);
    setIsStreaming(false);
    setLoadingChat(false);
  }, []);

  const openChat = useCallback(
    async (chatId) => {
      if (chatId === activeChatIdRef.current) return;

      resetTo(chatId);
      if (!chatId) return;

      setLoadingChat(true);
      try {
        await auth.authStateReady();
        if (!auth.currentUser) return;
        const loaded = await getChatMessages(db, auth.currentUser.uid, chatId);
        if (activeChatIdRef.current === chatId) setMessages(loaded);
      } catch (error) {
        if (activeChatIdRef.current === chatId) showToast(error.message);
      } finally {
        if (activeChatIdRef.current === chatId) setLoadingChat(false);
      }
    },
    [resetTo, showToast],
  );

  const startNewChat = useCallback(() => {
    resetTo(null);
    router.push("/dashboard/chat");
  }, [resetTo, router]);

  const sendMessage = useCallback(
    async (text) => {
      const message = text.trim();
      if (!message || abortRef.current) return;

      const controller = new AbortController();
      abortRef.current = controller;
      const startedInChatId = activeChatIdRef.current;
      const replyId = `local-reply-${Date.now()}`;

      const updateReply = (update) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === replyId ? { ...m, ...update(m) } : m)),
        );
      const removeReply = () =>
        setMessages((prev) => prev.filter((m) => m.id !== replyId));

      setMessages((prev) => [
        ...prev,
        { id: `local-user-${Date.now()}`, role: "user", content: message },
        { id: replyId, role: "assistant", content: "", pending: true },
      ]);
      setIsStreaming(true);

      try {
        const reply = await sendChatMessage(
          auth,
          { chatId: startedInChatId, message },
          {
            signal: controller.signal,
            onChatId: (id) => {
              if (startedInChatId || !id) return;
              activeChatIdRef.current = id;
              setActiveChatId(id);
              router.replace(`/dashboard/chat/${id}`);
            },
            onDelta: (delta) =>
              updateReply((m) => ({ content: m.content + delta })),
          },
        );

        if (reply) {
          updateReply(() => ({ pending: false }));
        } else {
          removeReply();
          showToast("The AI didn't respond, please try again.");
        }
      } catch (error) {
        // switched to another chat mid-reply, the server still saves it
        if (controller.signal.aborted) return;
        removeReply();
        showToast(error.message);
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setIsStreaming(false);
        }
      }
    },
    [router, showToast],
  );

  return (
    <ChatContext.Provider
      value={{
        activeChatId,
        messages,
        loadingChat,
        isStreaming,
        openChat,
        startNewChat,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used inside <ChatProvider>");
  }
  return context;
}
