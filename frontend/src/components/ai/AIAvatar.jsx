import React, { useEffect, useRef, useState } from "react";

const AIAvatar = ({
  isSpeaking: externalSpeaking = false,
  message = null,
  avatarEvent = null,
  autoSpeak = true,
}) => {
  const [internalSpeaking, setInternalSpeaking] = useState(false);
  const speechRef = useRef(null);
  const lastMessageRef = useRef("");

  const isSpeaking = externalSpeaking || internalSpeaking;

  // ============================================================
  // TASK 13 + TASK 14 — SPEECH ONLY
  // Does not change the avatar visual design, hologram, CSS,
  // animation, size, position, or existing external isSpeaking prop.
  // ============================================================
  useEffect(() => {
    if (!autoSpeak || !message || typeof window === "undefined") {
      return undefined;
    }

    if (!("speechSynthesis" in window)) {
      return undefined;
    }

    if (lastMessageRef.current === message) {
      return undefined;
    }

    lastMessageRef.current = message;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((voice) =>
      /Microsoft|Google|Samantha|Daniel|Alex/i.test(voice.name)
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setInternalSpeaking(true);
    };

    utterance.onend = () => {
      setInternalSpeaking(false);
    };

    utterance.onerror = () => {
      setInternalSpeaking(false);
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
      setInternalSpeaking(false);
    };
  }, [message, avatarEvent, autoSpeak]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  return (
    <div className="ai-avatar">

      {/* =====================================================
          HEAD HOLOGRAPHIC SURFACE
          Slightly larger and centered behind the head
      ====================================================== */}
      <div className="head-hologram">

        <div className="head-ring ring-one" />
        <div className="head-ring ring-two" />
        <div className="head-ring ring-three" />

        <div className="head-arc arc-left" />
        <div className="head-arc arc-right" />

        <span className="data-dot dot-one" />
        <span className="data-dot dot-two" />
        <span className="data-dot dot-three" />
        <span className="data-dot dot-four" />

        <div className="scan-line scan-one" />
        <div className="scan-line scan-two" />
        <div className="scan-line scan-three" />
      </div>


      {/* =====================================================
          ROBOT
      ====================================================== */}
      <div className="robot">

        {/* HEAD */}
        <div className="head">

          <div className="head-shell">

            <div className="face">

              <div className="face-shine" />

              <div className="eyes">

                <div className="eye">
                  <span />
                </div>

                <div className="eye">
                  <span />
                </div>

              </div>

              <div className={`mouth ${isSpeaking ? "talking" : ""}`}>
                <span />
              </div>

            </div>

          </div>


          {/* HEADPHONES */}
          <div className="ear ear-left">
            <div className="ear-light" />
          </div>

          <div className="ear ear-right">
            <div className="ear-light" />
          </div>


          {/* ANTENNA */}
          <div className="antenna">
            <div className="antenna-stick" />
            <div className="antenna-dot" />
          </div>

        </div>


        {/* SMALL CIRCLE UNDER HEAD */}
        <div className="head-under-ring">
          <div className="under-ring-inner" />
        </div>


        {/* NECK */}
        <div className="neck">
          <span />
          <span />
          <span />
        </div>


        {/* BODY */}
        <div className="body">

          <div className="body-shell">

            <div className="body-highlight" />

            <div className="core">
              <div className="core-inner">
                <div className="core-light" />
              </div>
            </div>

            <div className="body-glow" />

          </div>

        </div>

      </div>


      {/* =====================================================
          PLATFORM
      ====================================================== */}
      <div className="platform">

        <div className="platform-glow" />

        <div className="platform-ring platform-large" />
        <div className="platform-ring platform-medium" />
        <div className="platform-ring platform-small" />

        <div className="platform-center" />

      </div>


      <style>{`

        * {
          box-sizing: border-box;
        }


        /* =====================================================
           AVATAR CONTAINER
        ====================================================== */

        .ai-avatar {
          position: relative;

          width: 100%;
          height: 350px;

          overflow: hidden;

          display: flex;
          justify-content: center;
          align-items: flex-end;

          pointer-events: none;
          user-select: none;

          background:
            radial-gradient(
              ellipse at 50% 72%,
              rgba(8,145,178,.10),
              transparent 58%
            );
        }


        /* =====================================================
           HEAD HOLOGRAPHIC SURFACE
           LARGER THAN PREVIOUS VERSION
           CENTERED DIRECTLY BEHIND HEAD
        ====================================================== */

        .head-hologram {
          position: absolute;

          width: 258px;
          height: 222px;

          left: 50%;
          top: 31px;

          transform: translateX(-50%);

          z-index: 1;

          filter:
            drop-shadow(0 0 12px rgba(34,211,238,.95))
            drop-shadow(0 0 28px rgba(34,211,238,.62))
            drop-shadow(0 0 52px rgba(34,211,238,.30));
        }


        .head-ring {
          position: absolute;

          left: 50%;
          top: 50%;

          transform:
            translate(-50%, -50%);

          border-radius: 50%;

          border-style: solid;

          pointer-events: none;
        }


        /* MAIN BACK SURFACE */

        .ring-one {
          width: 246px;
          height: 205px;

          border-width: 1px;

          border-color:
            rgba(34,211,238,.78);

          box-shadow:
            0 0 10px rgba(34,211,238,.35),
            0 0 25px rgba(34,211,238,.18);

          animation:
            hologramRotate 18s linear infinite;
        }


        .ring-two {
          width: 215px;
          height: 178px;

          border-width: 2px;

          border-color:
            rgba(34,211,238,.92);

          border-left-color:
            transparent;

          border-bottom-color:
            transparent;

          filter:
            drop-shadow(0 0 7px #22d3ee)
            drop-shadow(0 0 14px rgba(34,211,238,.65));

          animation:
            hologramReverse 12s linear infinite;
        }


        .ring-three {
          width: 182px;
          height: 150px;

          border-width: 1px;

          border-color:
            rgba(103,232,249,.78);

          animation:
            hologramRotate 15s linear infinite;
        }


        /* =====================================================
           HOLOGRAPHIC ARCS
        ====================================================== */

        .head-arc {
          position: absolute;

          top: 39px;

          width: 56px;
          height: 142px;

          border-radius: 50%;

          border: 3px solid transparent;

          filter:
            drop-shadow(0 0 8px #22d3ee)
            drop-shadow(0 0 18px rgba(34,211,238,.80));
        }


        .arc-left {
          left: 5px;

          border-left-color:
            #22d3ee;

          border-top-color:
            #22d3ee;
        }


        .arc-right {
          right: 5px;

          border-right-color:
            #22d3ee;

          border-top-color:
            #22d3ee;
        }


        /* =====================================================
           DIGITAL PARTICLES
        ====================================================== */

        .data-dot {
          position: absolute;

          width: 4px;
          height: 4px;

          border-radius: 50%;

          background:
            #67e8f9;

          box-shadow:
            0 0 8px #22d3ee,
            0 0 18px #22d3ee;

          animation:
            dataFloat 2.8s ease-in-out infinite;
        }


        .dot-one {
          left: 22px;
          top: 47px;
        }


        .dot-two {
          right: 22px;
          top: 62px;

          animation-delay: .6s;
        }


        .dot-three {
          left: 32px;
          bottom: 34px;

          animation-delay: 1.1s;
        }


        .dot-four {
          right: 32px;
          bottom: 38px;

          animation-delay: 1.6s;
        }


        /* =====================================================
           HOLOGRAPHIC SCAN LINES
        ====================================================== */

        .scan-line {
          position: absolute;

          width: 1px;
          height: 145px;

          top: 40px;

          background:
            linear-gradient(
              transparent,
              rgba(34,211,238,.85),
              transparent
            );

          opacity: .46;
        }


        .scan-one {
          left: 21%;
        }


        .scan-two {
          left: 50%;
        }


        .scan-three {
          left: 79%;
        }


        /* =====================================================
           ROBOT
           SMALLER + LOWER
        ====================================================== */

        .robot {
          position: absolute;

          width: 158px;
          height: 244px;

          left: 50%;

          bottom: 7px;

          transform:
            translateX(-50%);

          z-index: 5;

          animation:
            robotFloat 4.8s ease-in-out infinite;
        }


        /* =====================================================
           HEAD
        ====================================================== */

        .head {
          position: absolute;

          width: 122px;
          height: 90px;

          left: 50%;
          top: 4px;

          transform:
            translateX(-50%);

          z-index: 10;
        }


        /* =====================================================
           SILVER HEAD SHELL
        ====================================================== */

        .head-shell {
          position: absolute;

          inset: 0;

          padding: 6px;

          border-radius: 33px;

          background:
            linear-gradient(
              145deg,
              #ffffff 0%,
              #f9fcff 20%,
              #e9f0f4 42%,
              #cbd5db 68%,
              #8996a0 100%
            );

          border:
            1px solid rgba(165,243,252,.98);

          box-shadow:

            0 0 17px rgba(34,211,238,.95),
            0 0 34px rgba(34,211,238,.58),
            0 0 58px rgba(34,211,238,.30),

            inset 0 5px 8px rgba(255,255,255,.98),
            inset 0 -8px 15px rgba(15,23,42,.20);
        }


        /* =====================================================
           DARK FACE
        ====================================================== */

        .face {
          position: relative;

          width: 100%;
          height: 100%;

          overflow: hidden;

          border-radius: 27px;

          background:
            radial-gradient(
              ellipse at 50% 8%,
              #3c5063 0%,
              #182536 25%,
              #050b14 63%,
              #000000 100%
            );

          border:
            1px solid rgba(103,232,249,.22);

          box-shadow:
            inset 0 0 25px rgba(0,0,0,.98),
            inset 0 0 10px rgba(34,211,238,.10);
        }


        .face-shine {
          position: absolute;

          width: 95px;
          height: 23px;

          left: 50%;
          top: 3px;

          transform:
            translateX(-50%);

          border-radius: 50%;

          background:
            rgba(255,255,255,.11);

          filter:
            blur(6px);
        }


        /* =====================================================
           EYES
        ====================================================== */

        .eyes {
          position: absolute;

          left: 50%;
          top: 37px;

          transform:
            translateX(-50%);

          display: flex;

          gap: 34px;
        }


        .eye {
          width: 14px;
          height: 14px;

          border-radius: 50%;

          background:
            #67e8f9;

          box-shadow:
            0 0 8px #67e8f9,
            0 0 18px #22d3ee,
            0 0 30px rgba(34,211,238,.90);

          animation:
            blink 5.5s infinite;
        }


        .eye span {
          display: block;

          width: 5px;
          height: 5px;

          margin: 3px;

          border-radius: 50%;

          background:
            white;
        }


        /* =====================================================
           MOUTH
           MOVES WHEN SPEAKING
        ====================================================== */

        .mouth {
          position: absolute;

          left: 50%;
          bottom: 16px;

          transform:
            translateX(-50%);

          width: 28px;
          height: 9px;
        }


        .mouth span {
          display: block;

          width: 23px;
          height: 6px;

          margin: auto;

          border-bottom:
            2px solid #67e8f9;

          border-radius:
            0 0 50% 50%;

          filter:
            drop-shadow(0 0 5px #22d3ee);
        }


        .mouth.talking span {
          width: 18px;
          height: 10px;

          border:
            2px solid #67e8f9;

          border-radius: 50%;

          animation:
            mouthTalk .16s
            ease-in-out infinite alternate;
        }


        /* =====================================================
           HEADPHONES
        ====================================================== */

        .ear {
          position: absolute;

          top: 32px;

          width: 23px;
          height: 44px;

          border-radius: 12px;

          background:
            linear-gradient(
              180deg,
              #ffffff,
              #e4ebef,
              #84919b
            );

          border:
            1px solid rgba(165,243,252,.95);

          box-shadow:
            0 0 13px rgba(34,211,238,.60),
            0 0 24px rgba(34,211,238,.25);
        }


        .ear-left {
          left: -10px;
        }


        .ear-right {
          right: -10px;
        }


        .ear-light {
          position: absolute;

          width: 6px;
          height: 26px;

          left: 50%;
          top: 9px;

          transform:
            translateX(-50%);

          border-radius: 6px;

          background:
            rgba(103,232,249,.98);

          box-shadow:
            0 0 9px #22d3ee,
            0 0 18px rgba(34,211,238,.90);
        }


        /* =====================================================
           ANTENNA
        ====================================================== */

        .antenna {
          position: absolute;

          left: 50%;
          top: -12px;

          transform:
            translateX(-50%);

          display: flex;

          flex-direction: column;

          align-items: center;
        }


        .antenna-stick {
          width: 2px;
          height: 8px;

          background:
            #67e8f9;

          box-shadow:
            0 0 8px #22d3ee;
        }


        .antenna-dot {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background:
            #67e8f9;

          box-shadow:
            0 0 10px #67e8f9,
            0 0 22px #22d3ee;

          animation:
            pulse 1.7s infinite;
        }


        /* =====================================================
           CIRCLE UNDER HEAD
        ====================================================== */

        .head-under-ring {
          position: absolute;

          width: 42px;
          height: 17px;

          left: 50%;
          top: 86px;

          transform:
            translateX(-50%);

          border-radius: 50%;

          border:
            2px solid rgba(34,211,238,.90);

          box-shadow:
            0 0 9px rgba(34,211,238,.90),
            0 0 20px rgba(34,211,238,.55);

          z-index: 7;
        }


        .under-ring-inner {
          position: absolute;

          width: 22px;
          height: 7px;

          left: 50%;
          top: 3px;

          transform:
            translateX(-50%);

          border-radius: 50%;

          border:
            1px solid #67e8f9;

          box-shadow:
            0 0 9px #22d3ee;
        }


        /* =====================================================
           NECK
        ====================================================== */

        .neck {
          position: absolute;

          width: 26px;
          height: 19px;

          left: 50%;
          top: 95px;

          transform:
            translateX(-50%);

          border-left:
            2px solid #64748b;

          border-right:
            2px solid #64748b;

          background:
            #111827;

          border-radius:
            0 0 8px 8px;

          padding:
            4px 5px;

          display:
            flex;

          flex-direction:
            column;

          gap: 3px;

          z-index: 4;
        }


        .neck span {
          height: 2px;

          border-radius: 3px;

          background:
            #64748b;
        }


        /* =====================================================
           BODY
           SMALLER + LOWER
        ====================================================== */

        .body {
          position: absolute;

          width: 110px;
          height: 103px;

          left: 50%;

          top: 119px;

          transform:
            translateX(-50%);

          z-index: 5;
        }


        .body-shell {
          position: absolute;

          inset: 0;

          border-radius:
            46px 46px
            22px 22px;

          background:
            linear-gradient(
              145deg,
              #ffffff 0%,
              #fbfdff 20%,
              #edf3f6 40%,
              #d2dbe0 65%,
              #8c99a3 100%
            );

          border:
            1px solid rgba(165,243,252,.95);

          box-shadow:

            0 0 18px rgba(34,211,238,.65),
            0 0 36px rgba(34,211,238,.38),
            0 0 54px rgba(34,211,238,.17),

            inset 0 5px 10px rgba(255,255,255,1),
            inset 0 -10px 17px rgba(15,23,42,.18);
        }


        .body-highlight {
          position: absolute;

          width: 75px;
          height: 25px;

          left: 50%;
          top: 5px;

          transform:
            translateX(-50%);

          border-radius: 50%;

          background:
            radial-gradient(
              ellipse,
              rgba(255,255,255,.90),
              transparent
            );

          filter:
            blur(2px);
        }


        /* =====================================================
           CHEST CORE
        ====================================================== */

        .core {
          position: absolute;

          width: 44px;
          height: 44px;

          left: 50%;
          top: 34px;

          transform:
            translateX(-50%);

          border-radius: 50%;

          background:
            #111827;

          border:
            3px solid #94a3b8;

          box-shadow:
            0 0 16px rgba(34,211,238,1),
            0 0 32px rgba(34,211,238,.60),
            0 0 46px rgba(34,211,238,.32),
            inset 0 0 12px #000;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;
        }


        .core-inner {
          width: 27px;
          height: 27px;

          border-radius: 50%;

          border:
            4px solid #22d3ee;

          box-shadow:
            0 0 10px #22d3ee,
            0 0 22px rgba(34,211,238,.90);

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;
        }


        .core-light {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background:
            #67e8f9;

          box-shadow:
            0 0 13px #22d3ee,
            0 0 24px #22d3ee;

          animation:
            pulse 1.8s infinite;
        }


        /* =====================================================
           BODY LOWER GLOW
        ====================================================== */

        .body-glow {
          position: absolute;

          width: 78px;
          height: 13px;

          left: 50%;
          bottom: 3px;

          transform:
            translateX(-50%);

          border-radius: 50%;

          background:
            rgba(34,211,238,.78);

          filter:
            blur(8px);

          box-shadow:
            0 0 22px rgba(34,211,238,.70),
            0 0 44px rgba(34,211,238,.42);

          animation:
            bodyGlow 2s infinite;
        }


        /* =====================================================
           PLATFORM
           EXTRA BRIGHT LOWER GLOW
        ====================================================== */

        .platform {
          position: absolute;

          width: 245px;
          height: 42px;

          left: 50%;

          bottom: 1px;

          transform:
            translateX(-50%);

          z-index: 3;
        }


        .platform-glow {
          position: absolute;

          width: 205px;
          height: 28px;

          left: 50%;
          top: 7px;

          transform:
            translateX(-50%);

          border-radius: 50%;

          background:
            rgba(34,211,238,.76);

          filter:
            blur(17px);

          box-shadow:
            0 0 28px rgba(34,211,238,.75),
            0 0 58px rgba(34,211,238,.45),
            0 0 85px rgba(34,211,238,.25);

          animation:
            platformGlow 2s ease-in-out infinite;
        }


        .platform-ring {
          position: absolute;

          left: 50%;

          transform:
            translateX(-50%);

          border-radius: 50%;

          border:
            2px solid rgba(34,211,238,.94);

          box-shadow:
            0 0 11px rgba(34,211,238,.85),
            0 0 24px rgba(34,211,238,.48);
        }


        .platform-large {
          width: 242px;
          height: 30px;

          top: 9px;
        }


        .platform-medium {
          width: 183px;
          height: 22px;

          top: 13px;
        }


        .platform-small {
          width: 118px;
          height: 14px;

          top: 17px;
        }


        .platform-center {
          position: absolute;

          width: 76px;
          height: 7px;

          left: 50%;
          top: 20px;

          transform:
            translateX(-50%);

          border-radius: 50%;

          background:
            #67e8f9;

          box-shadow:
            0 0 14px #22d3ee,
            0 0 30px #22d3ee,
            0 0 55px rgba(34,211,238,1),
            0 0 85px rgba(34,211,238,.65);

          animation:
            platformPulse 1.8s infinite;
        }


        /* =====================================================
           ANIMATIONS
        ====================================================== */

        @keyframes robotFloat {

          0%, 100% {
            transform:
              translateX(-50%)
              translateY(0);
          }

          50% {
            transform:
              translateX(-50%)
              translateY(-2px);
          }

        }


        @keyframes blink {

          0%, 44%, 48%, 100% {
            transform:
              scaleY(1);
          }

          45%, 47% {
            transform:
              scaleY(.08);
          }

        }


        @keyframes mouthTalk {

          from {
            transform:
              scaleY(.45);
          }

          to {
            transform:
              scaleY(1.2);
          }

        }


        @keyframes pulse {

          0%, 100% {
            transform:
              scale(.85);

            opacity:
              .7;
          }

          50% {
            transform:
              scale(1.1);

            opacity:
              1;
          }

        }


        @keyframes hologramRotate {

          from {
            transform:
              translate(-50%, -50%)
              rotate(0deg);
          }

          to {
            transform:
              translate(-50%, -50%)
              rotate(360deg);
          }

        }


        @keyframes hologramReverse {

          from {
            transform:
              translate(-50%, -50%)
              rotate(360deg);
          }

          to {
            transform:
              translate(-50%, -50%)
              rotate(0deg);
          }

        }


        @keyframes dataFloat {

          0%, 100% {
            opacity:
              .25;

            transform:
              translateY(5px);
          }

          50% {
            opacity:
              1;

            transform:
              translateY(-6px);
          }

        }


        @keyframes bodyGlow {

          0%, 100% {
            opacity:
              .45;
          }

          50% {
            opacity:
              1;
          }

        }


        @keyframes platformGlow {

          0%, 100% {
            opacity:
              .55;

            transform:
              translateX(-50%)
              scaleX(.92);
          }

          50% {
            opacity:
              1;

            transform:
              translateX(-50%)
              scaleX(1.08);
          }

        }


        @keyframes platformPulse {

          0%, 100% {
            opacity:
              .65;

            transform:
              translateX(-50%)
              scaleX(.9);
          }

          50% {
            opacity:
              1;

            transform:
              translateX(-50%)
              scaleX(1.12);
          }

        }


        /* =====================================================
           SHORT SIDEBAR / SMALL HEIGHT
        ====================================================== */

        @media (max-height: 750px) {

          .ai-avatar {
            height:
              325px;
          }


          .robot {
            transform:
              translateX(-50%)
              scale(.91);

            transform-origin:
              bottom center;
          }


          .head-hologram {
            transform:
              translateX(-50%)
              scale(.91);

            transform-origin:
              center;
          }


          .platform {
            transform:
              translateX(-50%)
              scale(.91);

            transform-origin:
              bottom center;
          }

        }


        /* =====================================================
           SMALL WIDTH
        ====================================================== */

        @media (max-width: 1100px) {

          .robot {
            transform:
              translateX(-50%)
              scale(.93);

            transform-origin:
              bottom center;
          }


          .head-hologram {
            transform:
              translateX(-50%)
              scale(.93);

            transform-origin:
              center;
          }


          .platform {
            transform:
              translateX(-50%)
              scale(.93);

            transform-origin:
              bottom center;
          }

        }

      `}</style>

    </div>
  );
};

export default AIAvatar;