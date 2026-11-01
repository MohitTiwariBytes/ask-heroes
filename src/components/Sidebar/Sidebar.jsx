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
          <div className="sidebar-close-btn">
            <div className="background-btn-sidebar-close"></div>
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.75 2.25H14.25C15.0784 2.25 15.75 2.92157 15.75 3.75V14.25C15.75 15.0784 15.0784 15.75 14.25 15.75H3.75C2.92157 15.75 2.25 15.0784 2.25 14.25V3.75C2.25 2.92157 2.92157 2.25 3.75 2.25Z"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="#8E8E96"
              />
              <path
                d="M6.75 2.25V15.75"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="#8E8E96"
              />
            </svg>
          </div>
        </div>
        <div className="new-chat-button-sidebar">
          <button>
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
                stroke="white"
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
                stroke="#8E8E96"
              />
            </svg>
            <span>Chat</span>
          </Link>
          <Link href="/dashboard/heroes" className={linkClass("heroes")}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.75 5.25C9.75 6.90685 8.40685 8.25 6.75 8.25C5.09315 8.25 3.75 6.90685 3.75 5.25C3.75 3.59315 5.09315 2.25 6.75 2.25C8.40685 2.25 9.75 3.59315 9.75 5.25Z"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="#8E8E96"
              />
              <path
                d="M2.25 15.75V14.25C2.25 13.4544 2.56607 12.6913 3.12868 12.1287C3.69129 11.5661 4.45435 11.25 5.25 11.25H8.25C9.04565 11.25 9.80871 11.5661 10.3713 12.1287C10.9339 12.6913 11.25 13.4544 11.25 14.25V15.75"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="#8E8E96"
              />
              <path
                d="M12 2.32501C12.6628 2.47607 13.2546 2.84775 13.6786 3.37916C14.1025 3.91058 14.3334 4.57022 14.3334 5.25001C14.3334 5.92981 14.1025 6.58945 13.6786 7.12086C13.2546 7.65228 12.6628 8.02396 12 8.17501M15.75 15.75V14.25C15.7545 13.5815 15.5356 12.9306 15.1279 12.4006C14.7203 11.8707 14.1473 11.4921 13.5 11.325"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="#8E8E96"
              />
            </svg>

            <span>Heroes</span>
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
                stroke="#8E8E96"
              />
            </svg>
            <span>Saved</span>
          </Link>
        </div>
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
                stroke="#8E8E96"
              />
              <path
                d="M12 12.75L15.75 9L12 5.25"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="#8E8E96"
              />
              <path
                d="M15.75 9H6.75"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="#8E8E96"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
