"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useSyncExternalStore,
} from "react";
import "./ChatView.css";
import { getUserProfile } from "@/backend/User/main";
import { db } from "@/lib/firebase";
import { watchAuthState } from "@/backend/Auth/main";
import { useToast } from "../toast/ToastProvider";
import { useChat } from "./ChatProvider";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { auth } from "@/lib/firebase";
import { HEROES, getHero } from "@/lib/heroes";

const INPUT_BOX_BUTTONS =
  ".attach-btn-newchat, .voice-btn-newchat, .send-message-button-newchat";

export function HeroAvatar({ hero, className }) {
  return (
    <div className={className}>
      {hero.image ? (
        <img src={hero.image} alt="" />
      ) : (
        <span className="hero-initial-newchat">{hero.name[0]}</span>
      )}
    </div>
  );
}

function ChevronDown() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.5 5.25L7 8.75L10.5 5.25"
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#8E8E96"
      />
    </svg>
  );
}

// Picks the hero for a new chat, the choice is saved with the chat once it starts
function HeroSelector() {
  const { heroId, selectHero } = useChat();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const hero = getHero(heroId);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const pick = (id) => {
    selectHero(id);
    setOpen(false);
  };

  return (
    <div className="hero-selector-newchat" ref={rootRef}>
      <button
        type="button"
        className="selector-hero-input-box-new-chat"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <HeroAvatar hero={hero} className="hero-pfp-newchat" />
        <div className="grp-hs-1">
          <span>{hero.name}</span>
          <ChevronDown />
        </div>
      </button>

      {open && (
        <div className="hero-menu-newchat overlay" role="listbox">
          {HEROES.map((h) => (
            <button
              key={h.id}
              type="button"
              role="option"
              aria-selected={h.id === hero.id}
              className="hero-option-newchat"
              onClick={() => pick(h.id)}
            >
              <HeroAvatar hero={h} className="hero-option-pfp-newchat" />
              <div className="hero-option-text-newchat">
                <span className="hero-option-name-newchat">{h.name}</span>
                <span className="hero-option-tagline-newchat">{h.tagline}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Follow-ups stay with the chat's saved hero, so this one only shows who's answering
function CurrentHero() {
  const { heroId } = useChat();
  const hero = getHero(heroId);

  return (
    <div className="new-chat-input-box-bottom-toolbar">
      <div className="selector-hero-input-box-new-chat static">
        <HeroAvatar hero={hero} className="hero-pfp-newchat" />
        <span>{hero.name}</span>
      </div>
    </div>
  );
}

function getSpeechRecognition() {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

// false on the server, so the mic button only appears once we know the browser supports it
function useSpeechSupported() {
  return useSyncExternalStore(
    () => () => {},
    () => !!getSpeechRecognition(),
    () => false,
  );
}

function resizeTextarea(el) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
  el.style.overflowY = el.scrollHeight > el.clientHeight ? "auto" : "hidden";
}

function VoiceButton({ listening, onClick }) {
  return (
    <button
      type="button"
      className={`voice-btn-newchat ghost${listening ? " listening" : ""}`}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      aria-pressed={listening}
      onClick={onClick}
    >
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
    </button>
  );
}

function ChatInput({ placeholder, newChat }) {
  const { sendMessage, isStreaming } = useChat();
  const { showToast } = useToast();
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const speechSupported = useSpeechSupported();
  const canSend = text.trim().length > 0 && !isStreaming;

  // dictated text doesn't fire onInput, so grow the box here instead
  useLayoutEffect(() => {
    if (listening) resizeTextarea(textareaRef.current);
  }, [text, listening]);

  // stop the mic when leaving the page
  useEffect(() => () => recognitionRef.current?.abort(), []);

  const stopListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    // drop late results so they can't refill the box after sending
    recognition.onresult = null;
    recognition.abort();
  };

  const toggleVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = getSpeechRecognition();
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    // dictation is added after whatever was already typed
    const typed = text.trimEnd();
    const prefix = typed ? `${typed} ` : "";

    recognition.onresult = (e) => {
      let spoken = "";
      for (const result of e.results) spoken += result[0].transcript;
      setText(prefix + spoken.trimStart());
    };
    recognition.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        showToast("Microphone access is blocked, allow it to use voice input.");
      } else if (e.error !== "aborted" && e.error !== "no-speech") {
        showToast("Voice input stopped, please try again.");
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      showToast("Couldn't start voice input, please try again.");
    }
  };

  const focusTextarea = (e) => {
    const el = textareaRef.current;
    if (!el || e.target === el || e.target.closest(INPUT_BOX_BUTTONS)) return;
    // stop the mousedown from blurring the textarea
    e.preventDefault();
    el.focus();
    const end = el.value.length;
    el.setSelectionRange(end, end);
  };

  const autoResize = (e) => resizeTextarea(e.target);

  const submit = () => {
    if (!canSend) return;
    stopListening();
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
              {speechSupported && (
                <VoiceButton listening={listening} onClick={toggleVoice} />
              )}
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
        <div className="new-chat-input-box-bottom-toolbar">
          <HeroSelector />
          <div className="searchSelector-newchat"></div>
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
            {speechSupported && (
              <VoiceButton listening={listening} onClick={toggleVoice} />
            )}
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
      <CurrentHero />
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
