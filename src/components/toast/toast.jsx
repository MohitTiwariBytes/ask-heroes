"use client";

import React, { useEffect, useRef } from "react";
import "./toast.css";
import gsap from "gsap";

export default function Toast({ message, success, duration = 1.5, onClose }) {
  const toastRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ onComplete: () => onClose?.() });

    tl.fromTo(
      toastRef.current,
      { y: -40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" },
    ).to(toastRef.current, {
      y: -40,
      opacity: 0,
      duration: 0.3,
      ease: "power3.in",
      delay: duration,
    });

    return () => tl.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={toastRef}
      className={`toast-popup ${success ? "success" : "failed"}`}
    >
      <span>{message}</span>
    </div>
  );
}
