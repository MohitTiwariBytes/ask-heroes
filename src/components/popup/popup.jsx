"use client";

import React, { useEffect, useRef } from "react";
import "./popup.css";
import gsap from "gsap";

export default function Popup({
  title,
  message,
  options,
  dismissible,
  onClose,
}) {
  const overlayRef = useRef(null);
  const cardRef = useRef(null);
  const closingRef = useRef(false);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.25 },
    ).fromTo(
      cardRef.current,
      { y: 20, scale: 0.96, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: "power3.out" },
      "<",
    );
    return () => tl.kill();
  }, []);

  const close = (option = null) => {
    if (closingRef.current) return;
    closingRef.current = true;

    gsap
      .timeline({ onComplete: () => onClose?.(option) })
      .to(cardRef.current, {
        y: 10,
        scale: 0.96,
        opacity: 0,
        duration: 0.2,
        ease: "power3.in",
      })
      .to(overlayRef.current, { opacity: 0, duration: 0.2 }, "<");
  };

  useEffect(() => {
    if (!dismissible) return;
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissible]);

  return (
    <div
      ref={overlayRef}
      className="popup-overlay"
      onClick={(e) => dismissible && e.target === e.currentTarget && close()}
    >
      <div
        ref={cardRef}
        className="popup-card overlay"
        role="dialog"
        aria-modal="true"
      >
        {title && <h3 className="popup-title">{title}</h3>}
        {message && <p className="popup-message">{message}</p>}
        {options.length > 0 && (
          <div className="popup-options">
            {options.map((option, i) => (
              <button
                key={option.value ?? option.label}
                autoFocus={i === options.length - 1}
                className={`popup-btn ${
                  option.destructive
                    ? "glass glass-coral"
                    : option.primary
                      ? "glass glass-ink"
                      : "flat"
                }`}
                onClick={() => close(option)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
