import React from "react";
import "./Sidebar.css";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { watchAuthState } from "@/backend/Auth/main";
import { signUserOut } from "@/backend/Auth/main";
import { useToast } from "../toast/ToastProvider";
import { useState, useRef, useEffect } from "react";
import { usePopup } from "../popup/PopupProvider";
import { getUserProfile } from "@/backend/User/main";
import { setChatSaved, watchChats } from "@/backend/Chat/main";
import { useChat } from "../ChatView/ChatProvider";
import { db } from "@/lib/firebase";
import Image from "next/image";
import Link from "next/link";

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const signingOutRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const { showPopup } = usePopup();
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [userInitial, setUserInitial] = useState(null);
  const [chats, setChats] = useState([]);
  const { startNewChat } = useChat();

  useEffect(
    () =>
      watchAuthState(auth, (u) => {
        setUser(u);
        setUserId(u ? u.uid : null);
        setLoading(false);
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
    if (!userId) return;

    return watchChats(db, userId, setChats, (error) =>
      showToast(error.message),
    );
  }, [userId, showToast]);

  useEffect(() => {
    if (!username) return;

    setUserInitial(username[0]);
  }, [username]);

  useEffect(() => {
    if (!loading && !user && !signingOutRef.current) {
      router.push("/auth");
    }
  }, [loading, user, router]);

  if (signingOut) {
    return <div className="loader">Signing out...</div>;
  }

  if (loading || !user) {
    return <div className="loader">Loading...</div>;
  }

  // matches /dashboard/<section> and anything nested under it
  const isActive = (section) => {
    const base = `/dashboard/${section}`;
    return pathname === base || pathname.startsWith(`${base}/`);
  };

  const linkClass = (section) =>
    `link-sidebar${isActive(section) ? " active" : ""}`;

  const triggerSignOut = () => {
    signingOutRef.current = true;
    setSigningOut(true);

    signUserOut(auth)
      .then(() => {
        showToast("Signed Out!", true, () => router.push("/auth"));
      })
      .catch((error) => {
        const errorMessage = error.message;
        const errorCode = error.code;

        signingOutRef.current = false;
        setSigningOut(false);
        showToast(errorMessage);
      });
  };

  const toggleSaved = (chat) => {
    setChatSaved(db, userId, chat.id, !chat.saved).catch((error) =>
      showToast(error.message),
    );
  };

  const handleSignOutClick = async () => {
    const choice = await showPopup({
      title: "Confirm Logout",
      message: "Are you sure you want to logout?",
      options: [
        { label: "Cancel", value: "cancel" },
        { label: "Logout", value: "logout", destructive: true },
      ],
    });

    if (choice === "logout") {
      triggerSignOut();
    }
  };

  return (
    <div className="main-sidebar">
      <div className="sidebar-top">
        <div className="top-bar-sidebar">
          <Image
            id="wordmarkLogo-nav-auth"
            src="/askYourHeroes-wordmark.svg"
            alt="Logo"
            width={164}
            height={29}
          />
        </div>
        <div className="new-chat-button-sidebar">
          <button className="flat" onClick={startNewChat}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.00016 3.33334V8.00001M8.00016 8.00001V12.6667M8.00016 8.00001H3.3335M8.00016 8.00001H12.6668"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="currentColor"
              />
            </svg>
            New Chat
          </button>
        </div>
        <div className="navigation-sidebar">
          <Link href="/dashboard/chat" className={linkClass("chat")}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.75 11.25C15.75 11.6478 15.592 12.0294 15.3107 12.3107C15.0294 12.592 14.6478 12.75 14.25 12.75H5.25L2.25 15.75V3.75C2.25 3.35218 2.40804 2.97064 2.68934 2.68934C2.97064 2.40804 3.35218 2.25 3.75 2.25H14.25C14.6478 2.25 15.0294 2.40804 15.3107 2.68934C15.592 2.97064 15.75 3.35218 15.75 3.75V11.25Z"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="currentColor"
              />
            </svg>
            <span>Chat</span>
          </Link>
          <Link href="/dashboard/saved" className={linkClass("saved")}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
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
            <span>Saved</span>
          </Link>
        </div>
        {chats.length > 0 && (
          <div className="recent-chats-sidebar">
            <span className="recent-chats-title-sidebar">Recents</span>
            <div className="recent-chats-list-sidebar">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`recent-chat-row-sidebar${
                    chat.saved ? " saved" : ""
                  }`}
                >
                  <Link
                    href={`/dashboard/chat/${chat.id}`}
                    className={`recent-chat-sidebar${
                      pathname === `/dashboard/chat/${chat.id}` ? " active" : ""
                    }`}
                  >
                    {chat.title}
                  </Link>
                  <button
                    type="button"
                    className="save-chat-btn-sidebar"
                    aria-label={chat.saved ? "Unsave chat" : "Save chat"}
                    aria-pressed={!!chat.saved}
                    onClick={() => toggleSaved(chat)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 18 18"
                      fill={chat.saved ? "currentColor" : "none"}
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
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="sidebar-bottom">
        <div className="user-info-sidebar">
          <div className="user-name-grp-sidebar">
            <div className="user-pfp-sidebar">
              <span>{userInitial}</span>
            </div>
            <div className="user-name-sidebar">
              <span>{username}</span>
            </div>
          </div>
          <div className="logout-btn-sidebar" onClick={handleSignOutClick}>
            <div className="background-btn-sidebar-logout"></div>
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.75 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V3.75C2.25 3.35218 2.40804 2.97064 2.68934 2.68934C2.97064 2.40804 3.35218 2.25 3.75 2.25H6.75"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="currentColor"
              />
              <path
                d="M12 12.75L15.75 9L12 5.25"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="currentColor"
              />
              <path
                d="M15.75 9H6.75"
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
  );
}
