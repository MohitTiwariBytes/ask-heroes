"use client";

import React, { useRef, useState, useEffect } from "react";
import "./ChatView.css";
import { getUserProfile } from "@/backend/User/main";
import { db } from "@/lib/firebase";
import { watchAuthState } from "@/backend/Auth/main";

import { auth } from "@/lib/firebase";

const INPUT_BOX_BUTTONS =
  ".attach-btn-newchat, .voice-btn-newchat, .send-message-button-newchat";

function NewChatView() {
  const textareaRef = useRef(null);
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

  return (
    <div className="main-new-chat-page">
      <div className="title-new-chat">
        <h1>Welcome Back, {userFirstName}!</h1>
      </div>
      <div className="input-box-new-chat" onMouseDown={focusTextarea}>
        <textarea
          ref={textareaRef}
          placeholder="What questions do you have today?"
          onInput={autoResize}
        />

        <div className="toolbar-inputbox-new-chat">
          <div className="attach-btn-newchat">
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
                stroke="white"
              />
            </svg>
          </div>
          <div className="btn-grp-right-newchat">
            <div className="voice-btn-newchat">
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
                  stroke="#8E8E96"
                />
                <path
                  d="M14.25 7.5V9C14.25 10.3924 13.6969 11.7277 12.7123 12.7123C11.7277 13.6969 10.3924 14.25 9 14.25M9 14.25C7.60761 14.25 6.27226 13.6969 5.28769 12.7123C4.30312 11.7277 3.75 10.3924 3.75 9V7.5M9 14.25V16.5"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  stroke="#8E8E96"
                />
              </svg>
            </div>
            <div className="send-message-button-newchat">
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
                  stroke="#1A0A00"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatView({ chatId }) {
  if (chatId) {
    return (
      <div className="chat-view">
        <h1>Hlo frends</h1>
      </div>
    );
  }

  return <NewChatView />;
}
