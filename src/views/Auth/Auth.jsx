"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Image from "next/image";
import "./Auth.css";
import { signUpEmail, watchAuthState } from "@/backend/Auth/main";
import { signInEmail } from "@/backend/Auth/main";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const googleLoginButton = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const continueButtonRef = useRef(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Restore the persisted session on page load
  useEffect(() => watchAuthState(auth, setUser), []);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const initiateSignUp = () => {
    const email = emailInputRef.current.value;
    const password = passwordInputRef.current.value;

    signUpEmail(auth, email, password)
      .then((newUser) => {
        setUser(newUser);
        alert("Success!");
      })
      .catch((error) => {
        if (error.code === "auth/email-already-in-use") {
          signInEmail(auth, email, password)
            .then(() => {
              alert("Success!");
            })
            .catch((error) => {
              alert(error.message);
            });
        } else {
          alert(error.message);
        }
      });
  };

  return (
    <div className="main-auth-page">
      <div className="logoTopLeft">
        <Image
          id="wordmarkLogo-nav-auth"
          src="/askYourHeroes-wordmark.svg"
          alt="Logo"
          width={231}
          height={44.49}
        />
      </div>
      <div className="login-content">
        <div className="title-login">
          <h1>SUIT UP</h1>
          <span>Log in to pick your hero and start asking.</span>
        </div>
        <div className="social-login-buttons">
          <button id="googleLoginButton" ref={googleLoginButton}>
            {" "}
            <svg viewBox="0 0 48 48">
              <title>Google Logo</title>
              <clipPath id="g">
                <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" />
              </clipPath>
              <g className="colors" clipPath="url(#g)">
                <path fill="#FBBC05" d="M0 37V11l17 13z" />
                <path fill="#EA4335" d="M0 11l17 13 7-6.1L48 14V0H0z" />
                <path fill="#34A853" d="M0 37l30-23 7.9 1L48 0v48H0z" />
                <path fill="#4285F4" d="M48 48L17 24l-4-3 35-10z" />
              </g>
            </svg>
            Continue with Google
          </button>
        </div>
        <div className="seperator-login">
          <div className="line-login"></div>
          <span>OR</span>
        </div>
        <div className="email-login">
          <div className="input-grp-email-login">
            <span>Email</span>
            <input
              ref={emailInputRef}
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="input-grp-password-login">
            <span>Password</span>
            <input
              ref={passwordInputRef}
              type="text"
              placeholder="Password"
              required
            />
          </div>
        </div>
        <div className="continue-button-login">
          <button
            onClick={() => {
              initiateSignUp();
            }}
            ref={continueButtonRef}
          >
            Continue
          </button>
        </div>
        <span id="info-new-account-login">
          New here? We'll create your account automatically.
        </span>
      </div>
      <div className="right-image">
        <Image
          src={
            "https://cdn.hackclub.com/01a18c78-b9a6-7ed9-abf3-fde5008d748f/loginHeroImage.png"
          }
          alt="Hero Image"
          height={1085}
          width={880}
        ></Image>
      </div>
    </div>
  );
}
