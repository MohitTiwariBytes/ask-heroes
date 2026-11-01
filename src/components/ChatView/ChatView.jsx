"use client";

import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import "./ChatView.css";
import { getUserProfile } from "@/backend/User/main";
import { db } from "@/lib/firebase";
import { watchAuthState } from "@/backend/Auth/main";
import { useToast } from "../toast/ToastProvider";
import { useChat } from "./ChatProvider";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { auth } from "@/lib/firebase";

const INPUT_BOX_BUTTONS =
  ".attach-btn-newchat, .voice-btn-newchat, .send-message-button-newchat";

function ChatInput({ placeholder, newChat }) {
  const { sendMessage, isStreaming } = useChat();
  const textareaRef = useRef(null);
  const [text, setText] = useState("");
  const canSend = text.trim().length > 0 && !isStreaming;

  const focusTextarea = (e) => {
    const el = textareaRef.current;
    if (!el || e.target === el || e.target.closest(INPUT_BOX_BUTTONS)) return;
    // stop the mousedown from blurring the textarea
    e.preventDefault();
    el.focus();
    const end = el.value.length;
    el.setSelectionRange(end, end);
  };

  const autoResize = (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    el.style.overflowY = el.scrollHeight > el.clientHeight ? "auto" : "hidden";
  };

  const submit = () => {
    if (!canSend) return;
    sendMessage(text);
    setText("");
    // back to the CSS min-height
    const el = textareaRef.current;
    el.style.height = "";
    el.style.overflowY = "hidden";
  };

  // Enter sends, Shift+Enter adds a new line
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  if (newChat) {
    return (
      <div className="shell prompt-shell-chat-view">
        <div className="input-box-new-chat panel" onMouseDown={focusTextarea}>
          <textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onInput={autoResize}
            onKeyDown={handleKeyDown}
          />

          <div className="toolbar-inputbox-new-chat">
            <div className="attach-btn-newchat ghost">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 3.75V9M9 9V14.25M9 9H3.75M9 9H14.25"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  stroke="currentColor"
                />
              </svg>
            </div>
            <div className="btn-grp-right-newchat">
              <div className="voice-btn-newchat ghost">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 1.5C10.2426 1.5 11.25 2.50736 11.25 3.75V8.25C11.25 9.49264 10.2426 10.5 9 10.5C7.75736 10.5 6.75 9.49264 6.75 8.25V3.75C6.75 2.50736 7.75736 1.5 9 1.5Z"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                  />
                  <path
                    d="M14.25 7.5V9C14.25 10.3924 13.6969 11.7277 12.7123 12.7123C11.7277 13.6969 10.3924 14.25 9 14.25M9 14.25C7.60761 14.25 6.27226 13.6969 5.28769 12.7123C4.30312 11.7277 3.75 10.3924 3.75 9V7.5M9 14.25V16.5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                  />
                </svg>
              </div>
              <div
                className="send-message-button-newchat glass glass-ink"
                aria-disabled={!canSend}
                onClick={submit}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 14.25V3.75M14.25 9L9 3.75L3.75 9"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell prompt-shell-chat-view">
      <div
        className="input-box-new-chat panel compact"
        onMouseDown={focusTextarea}
      >
        <textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onInput={autoResize}
          onKeyDown={handleKeyDown}
        />

        <div className="toolbar-inputbox-new-chat">
          <div className="attach-btn-newchat ghost">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 3.75V9M9 9V14.25M9 9H3.75M9 9H14.25"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="currentColor"
              />
            </svg>
          </div>
          <div className="btn-grp-right-newchat">
            <div className="voice-btn-newchat ghost">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 1.5C10.2426 1.5 11.25 2.50736 11.25 3.75V8.25C11.25 9.49264 10.2426 10.5 9 10.5C7.75736 10.5 6.75 9.49264 6.75 8.25V3.75C6.75 2.50736 7.75736 1.5 9 1.5Z"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  stroke="currentColor"
                />
                <path
                  d="M14.25 7.5V9C14.25 10.3924 13.6969 11.7277 12.7123 12.7123C11.7277 13.6969 10.3924 14.25 9 14.25M9 14.25C7.60761 14.25 6.27226 13.6969 5.28769 12.7123C4.30312 11.7277 3.75 10.3924 3.75 9V7.5M9 14.25V16.5"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  stroke="currentColor"
                />
              </svg>
            </div>
            <div
              className="send-message-button-newchat glass glass-ink"
              aria-disabled={!canSend}
              onClick={submit}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 14.25V3.75M14.25 9L9 3.75L3.75 9"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  stroke="currentColor"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewChatView() {
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [userFirstName, setUserFirstName] = useState(null);
  useEffect(
    () =>
      watchAuthState(auth, (u) => {
        setUser(u);
        setUserId(u ? u.uid : null);
      }),
    [],
  );

  useEffect(() => {
    if (!userId) return;

    getUserProfile(db, userId)
      .then((profile) => {
        setUsername(profile?.name ?? null);
      })
      .catch((error) => showToast(error.message));
  }, [userId]);

  useEffect(() => {
    if (!username) return;

    setUserFirstName(username.split(" ")[0]);
  }, [username]);

  return (
    <div className="main-new-chat-page">
      <div className="title-new-chat">
        <h1>Welcome Back, {userFirstName}!</h1>
      </div>
      <ChatInput placeholder="What questions do you have today?" newChat />
    </div>
  );
}

function ConversationView({ loading }) {
  const { messages } = useChat();
  const listRef = useRef(null);
  // only auto-scroll while the user is already near the bottom
  const stickToBottom = useRef(true);

  const handleScroll = () => {
    const el = listRef.current;
    stickToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    // the user just sent something, always jump down to it
    if (last?.pending && !last.content) stickToBottom.current = true;
    if (stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className="chat-view">
      <div className="messages-chat-view" ref={listRef} onScroll={handleScroll}>
        <div className="messages-inner-chat-view">
          {loading ? (
            <div className="loading-chat-view">Loading chat...</div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`message-chat-view ${m.role}`}>
                {m.pending && !m.content ? (
                  <span className="typing-chat-view">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : m.role === "user" ? (
                  m.content
                ) : (
                  <div className="markdown-chat-view">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <div className="input-area-chat-view">
        <ChatInput placeholder="Ask a follow-up..." />
      </div>
    </div>
  );
}

export default function ChatView({ chatId }) {
  const { activeChatId, messages, loadingChat, openChat } = useChat();

  // layout effect so a previous chat never flashes on screen before it's cleared
  useLayoutEffect(() => {
    openChat(chatId);
  }, [chatId, openChat]);

  if (!chatId && messages.length === 0) return <NewChatView />;

  return (
    <ConversationView
      loading={(chatId && chatId !== activeChatId) || loadingChat}
    />
  );
}
