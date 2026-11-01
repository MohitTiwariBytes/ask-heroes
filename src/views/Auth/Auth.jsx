"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Image from "next/image";
import "./Auth.css";
import { signUpEmail, watchAuthState } from "@/backend/Auth/main";
import { signInEmail } from "@/backend/Auth/main";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider } from "firebase/auth";
import { googleSignIn } from "@/backend/Auth/main";
import { getUserProfile, saveUserProfile } from "@/backend/User/main";
import { useToast } from "@/components/toast/ToastProvider";

export default function AuthPage() {
  const googleLoginButton = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const continueButtonRef = useRef(null);
  const loginStepRef = useRef(null);
  const profileStepRef = useRef(null);
  const nameInputRef = useRef(null);
  const ageInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  // While a sign-in is in flight, the success toast handles the redirect
  const signingInRef = useRef(false);
  const router = useRouter();
  const provider = new GoogleAuthProvider();

  const { showToast } = useToast();

  const onAuthSuccess = () =>
    showToast("Success!", true, () => router.push("/dashboard"));

  const onAuthFailure = (message) => {
    signingInRef.current = false;
    setLoading(false);
    showToast(message);
  };

  // Slide the login form off to the left and bring the profile form in from the right
  const showProfileStep = (signedInUser) => {
    signingInRef.current = true;
    setLoading(false);

    // Google gives us a display name, so only the age is left to fill in
    if (signedInUser.displayName && !nameInputRef.current.value) {
      nameInputRef.current.value = signedInUser.displayName;
    }

    gsap
      .timeline()
      .to(loginStepRef.current, {
        xPercent: -100,
        autoAlpha: 0,
        duration: 0.6,
        ease: "power3.inOut",
      })
      .fromTo(
        profileStepRef.current,
        { xPercent: 100, autoAlpha: 0 },
        {
          xPercent: 0,
          autoAlpha: 1,
          duration: 0.6,
          ease: "power3.out",
          onComplete: () =>
            (nameInputRef.current.value
              ? ageInputRef.current
              : nameInputRef.current
            ).focus(),
        },
        "-=0.35",
      );
  };

  // Returning users go straight in; anyone without a profile yet fills it in first
  const continueWithProfile = (signedInUser) =>
    getUserProfile(db, signedInUser.uid).then((profile) => {
      if (profile) {
        onAuthSuccess();
      } else {
        showProfileStep(signedInUser);
      }
    });

  // Restore the persisted session on page load
  useEffect(() => watchAuthState(auth, setUser), []);

  useEffect(() => {
    if (user && !signingInRef.current) {
      signingInRef.current = true;
      getUserProfile(db, user.uid)
        .then((profile) => {
          if (profile) {
            router.push("/dashboard");
          } else {
            showProfileStep(user);
          }
        })
        .catch((error) => onAuthFailure(error.message));
    }
  }, [user, router]);

  const initiateSignUp = () => {
    if (loading) return;

    const email = emailInputRef.current.value.trim();
    const password = passwordInputRef.current.value;

    // Don't hit Firebase with empty fields
    if (!email || !password) {
      showToast("Please enter both your email and password.");
      return;
    }

    signingInRef.current = true;
    setLoading(true);

    signUpEmail(auth, email, password)
      .then((newUser) => {
        setUser(newUser);
        showProfileStep(newUser);
      })
      .catch((error) => {
        if (error.code === "auth/email-already-in-use") {
          // Existing account: fall back to signing in
          return signInEmail(auth, email, password)
            .then((credential) => continueWithProfile(credential.user))
            .catch((error) => {
              if (error.code === "auth/invalid-credential") {
                onAuthFailure(
                  "Email sign-in failed. This email may already be registered through Google Sign-In, or the provided credentials are invalid or have expired.",
                );
              } else {
                onAuthFailure(error.message);
              }
            });
        } else {
          onAuthFailure(error.message);
        }
      });
  };

  const initiateGoogleSignUp = () => {
    if (loading) return;
    signingInRef.current = true;
    setLoading(true);

    googleSignIn(auth, provider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;
        setUser(user);
        return continueWithProfile(user);
      })
      .catch((error) => {
        // errorrs
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData?.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        onAuthFailure(errorMessage);
      });
  };

  const submitProfile = () => {
    if (loading) return;

    const name = nameInputRef.current.value.trim();
    const age = Number(ageInputRef.current.value);

    if (!name) {
      showToast("Please tell us your name.");
      return;
    }
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      showToast("Please enter a valid age.");
      return;
    }

    setLoading(true);

    saveUserProfile(db, auth.currentUser, { name, age })
      .then(onAuthSuccess)
      .catch((error) => {
        // Still signed in, so stay on this step and let them retry
        setLoading(false);
        showToast(error.message);
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
      <div className="auth-steps">
        <div className="login-content" ref={loginStepRef}>
          <div className="title-login">
            <h1>SUIT UP</h1>
            <span>Log in to pick your hero and start asking.</span>
          </div>
          <div className="social-login-buttons">
            <button
              onClick={initiateGoogleSignUp}
              disabled={loading}
              id="googleLoginButton"
              ref={googleLoginButton}
            >
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
              disabled={loading}
              ref={continueButtonRef}
            >
              {loading ? "Loading..." : "Continue"}
            </button>
          </div>
          <span id="info-new-account-login">
            New here? We'll create your account automatically.
          </span>
        </div>
        <div className="login-content profile-step" ref={profileStepRef}>
          <div className="title-login">
            <h1>ORIGIN STORY</h1>
            <span>Every hero needs one. Tell us a bit about yourself.</span>
          </div>
          <div className="email-login">
            <div className="input-grp-email-login">
              <span>Name</span>
              <input
                ref={nameInputRef}
                type="text"
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </div>
            <div className="input-grp-email-login">
              <span>Age</span>
              <input
                ref={ageInputRef}
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                placeholder="Your age"
                required
              />
            </div>
          </div>
          <div className="continue-button-login">
            <button onClick={submitProfile} disabled={loading}>
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
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
