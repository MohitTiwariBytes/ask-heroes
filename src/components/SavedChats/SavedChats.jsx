"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import "./SavedChats.css";
import { auth, db } from "@/lib/firebase";
import { watchAuthState } from "@/backend/Auth/main";
import { setChatSaved, watchSavedChats } from "@/backend/Chat/main";
import { getHero } from "@/lib/heroes";
import { useToast } from "../toast/ToastProvider";
import { HeroAvatar } from "../ChatView/ChatView";

function formatSavedDate(savedAt) {
  // serverTimestamp is null for a moment right after saving
  const date = savedAt?.toDate() ?? new Date();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SavedChats() {
  const { showToast } = useToast();
  const [userId, setUserId] = useState(null);
  const [chats, setChats] = useState(null);

  useEffect(() => watchAuthState(auth, (u) => setUserId(u ? u.uid : null)), []);

  useEffect(() => {
    if (!userId) return;

    return watchSavedChats(db, userId, setChats, (error) =>
      showToast(error.message),
    );
  }, [userId, showToast]);

  const unsave = (chatId) => {
    setChatSaved(db, userId, chatId, false).catch((error) =>
      showToast(error.message),
    );
  };

  return (
    <div className="main-saved-page">
      <div className="inner-saved-page">
        <div className="title-saved-page">
          <h1>Saved</h1>
          <span>
            Chats you&apos;ve saved, so they&apos;re easy to find again.
          </span>
        </div>

        {chats === null ? (
          <div className="empty-saved-page">Loading saved chats...</div>
        ) : chats.length === 0 ? (
          <div className="empty-saved-page">
            Nothing saved yet. Hover a chat in the sidebar and hit the bookmark
            to save it.
          </div>
        ) : (
          <div className="list-saved-page panel">
            {chats.map((chat) => {
              const hero = getHero(chat.heroId);
              return (
                <div key={chat.id} className="row-saved-page rule-row">
                  <Link
                    href={`/dashboard/chat/${chat.id}`}
                    className="link-saved-page"
                  >
                    <HeroAvatar hero={hero} className="hero-pfp-saved-page" />
                    <div className="text-saved-page">
                      <span className="chat-title-saved-page">
                        {chat.title}
                      </span>
                      <span className="meta-saved-page">
                        {hero.name} · Saved {formatSavedDate(chat.savedAt)}
                      </span>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className="unsave-btn-saved-page ghost"
                    aria-label="Unsave chat"
                    onClick={() => unsave(chat.id)}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14.25 15.75L9 12L3.75 15.75V3.75C3.75 3.35218 3.90804 2.97064 4.18934 2.68934C4.47064 2.40804 4.85218 2.25 5.25 2.25H12.75C13.1478 2.25 13.5294 2.40804 13.8107 2.68934C14.092 2.97064 14.25 3.35218 14.25 3.75V15.75Z"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
