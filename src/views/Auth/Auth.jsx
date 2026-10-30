"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import Image from "next/image";
import "./Auth.css";

export default function AuthPage() {
  const googleLoginButton = useRef(null);

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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <path d="M564 325.8C564 467.3 467.1 568 324 568C186.8 568 76 457.2 76 320C76 182.8 186.8 72 324 72C390.8 72 447 96.5 490.3 136.9L422.8 201.8C334.5 116.6 170.3 180.6 170.3 320C170.3 406.5 239.4 476.6 324 476.6C422.2 476.6 459 406.2 464.8 369.7L324 369.7L324 284.4L560.1 284.4C562.4 297.1 564 309.3 564 325.8z" />
            </svg>
            Continue with Google
          </button>
        </div>
        <div className="seperator-login">
          <div className="line-login"></div>
          <span>OR</span>
        </div>
      </div>
      <div className="right-image"></div>
    </div>
  );
}
