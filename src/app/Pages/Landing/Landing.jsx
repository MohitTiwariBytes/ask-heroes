"use client";

import React, { useEffect } from "react";
import "./Landing.css";
import DitherImage from "@/app/Components/DitherImage/DitherImage";
import Image from "next/image";
import Button from "@/app/Components/Button/Button";
import gsap from "gsap";

export default function Landing() {
  useEffect(() => {
    gsap.fromTo(
      "#marvelLogo",
      {
        opacity: 0,
        y: "50px",
      },
      {
        opacity: 1,
        y: 0,
        ease: "power2.inOut",
        duration: 0.3,
        delay: 0.4,
      },
    );
    gsap.fromTo(
      "#wordmarkLogo",
      {
        opacity: 0,
        y: "50px",
      },
      {
        opacity: 1,
        y: 0,
        ease: "power2.inOut",
        duration: 0.3,
        delay: 0.5,
      },
    );
    gsap.fromTo(
      "#description-txt-landing",
      {
        opacity: 0,
        y: "50px",
      },
      {
        opacity: 1,
        y: 0,
        ease: "power2.inOut",
        duration: 0.3,
        delay: 0.6,
      },
    );
    gsap.fromTo(
      ".button-landing",
      {
        opacity: 0,
        y: "50px",
      },
      {
        opacity: 1,
        y: 0,
        ease: "power2.inOut",
        duration: 0.3,
        delay: 0.7,
      },
    );
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
          className={"button-landing"}
          style={{ fontFamily: "Inter", letterSpacing: "-0.02em" }}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
