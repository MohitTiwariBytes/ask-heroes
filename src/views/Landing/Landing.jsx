"use client";

import { useEffect } from "react";
import "./Landing.css";
import DitherImage from "@/components/DitherImage/DitherImage";
import Image from "next/image";
import Button from "@/components/Button/Button";
import gsap from "gsap";

// Elements that shrink back when the button is hovered.
const HOVER_TARGETS = [
  "#marvelLogo",
  "#wordmarkLogo",
  "#description-txt-landing",
];
// Elements that slide in on load, in this order.
const INTRO_TARGETS = [...HOVER_TARGETS, ".button-landing"];

const INTRO = {
  from: { opacity: 0, y: 50 },
  to: {
    opacity: 1,
    y: 0,
    ease: "power2.inOut",
    duration: 0.3,
    delay: 0.4,
    stagger: 0.1,
  },
};

const HOVER = {
  ease: "back(1.2, 1.1)",
  duration: 0.2,
  in: { y: -20, scale: 0.9, opacity: 0.4 },
  out: { y: 0, scale: 1, opacity: 1 },
};

const animateHover = (state) =>
  gsap.to(HOVER_TARGETS, {
    ...state,
    ease: HOVER.ease,
    duration: HOVER.duration,
    overwrite: "auto",
  });

export default function Landing() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(INTRO_TARGETS, INTRO.from, INTRO.to);
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="main-landing-page">
      <DitherImage
        id="backgroundImage-landing"
        src="https://cdn.hackclub.com/01a1867e-dc49-7762-a4e7-8ac5b0b7a52f/Background.png"
        alt="Marvel Background"
      />

      <div className="logo-landing">
        <img
          id="marvelLogo"
          height={50}
          src="https://cdn.hackclub.com/01a1869a-ca18-73ff-9c48-0b428add6e34/marvelLogo.png"
          alt="Marvel Logo"
        />
        <Image
          id="wordmarkLogo"
          src="/askYourHeroes-wordmark.svg"
          alt="Logo"
          width={810}
          height={156}
        />
        <span id="description-txt-landing">
          Ask your favourite Marvel® character any question you want, receive an
          answer in their exact talking style!
        </span>
        <Button
          href={"/auth"}
          onMouseEnter={() => animateHover(HOVER.in)}
          onMouseLeave={() => animateHover(HOVER.out)}
          className="button-landing"
          style={{
            fontFamily: "var(--font-sans)",
            letterSpacing: "var(--tracking-label)",
          }}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
