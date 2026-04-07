"use client";

import { CountdownLoadingOverlay } from "@/components/countdown-loading-overlay";
import { useEffect, useRef, useState } from "react";

const HIT_SIZE = 80;
const DEFAULT_APPROACH_DURATION_MS = 1000;
const MIN_APPROACH_DURATION_MS = 200;
const MAX_APPROACH_DURATION_MS = 5000;
const NEXT_CIRCLE_MIN_DISTANCE = 10;
const SUCCESS_CLICK_SOUND_SRC = "/success-click.wav";
const FAIL_CLICK_SOUND_SRC = "/fail-click.mp3";

type Position = {
  x: number;
  y: number;
};

export default function Rhythm() {
  const playfieldRef = useRef<HTMLDivElement | null>(null);
  const roundTimeoutRef = useRef<number | null>(null);
  const successClickAudioRef = useRef<HTMLAudioElement | null>(null);
  const failClickAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hitCount, setHitCount] = useState(0);
  const [circleNumber, setCircleNumber] = useState(1);
  const [approachKey, setApproachKey] = useState(0);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [lineFrom, setLineFrom] = useState<Position | null>(null);
  const [approachDurationMs, setApproachDurationMs] = useState(
    DEFAULT_APPROACH_DURATION_MS,
  );
  const [showCountdown, setShowCountdown] = useState(false);

  const clearRoundTimer = () => {
    if (roundTimeoutRef.current) {
      window.clearTimeout(roundTimeoutRef.current);
      roundTimeoutRef.current = null;
    }
  };

  const randomizePosition = (previousPosition?: Position) => {
    const playfield = playfieldRef.current;
    if (!playfield) return;

    const maxX = Math.max(0, playfield.clientWidth - HIT_SIZE);
    const maxY = Math.max(0, playfield.clientHeight - HIT_SIZE);
    let nextPosition: Position | null = null;

    for (let i = 0; i < 20; i += 1) {
      const candidate: Position = {
        x: Math.floor(Math.random() * (maxX + 1)),
        y: Math.floor(Math.random() * (maxY + 1)),
      };

      if (!previousPosition) {
        nextPosition = candidate;
        break;
      }

      const dx = candidate.x - previousPosition.x;
      const dy = candidate.y - previousPosition.y;
      const distance = Math.hypot(dx, dy);

      if (distance >= NEXT_CIRCLE_MIN_DISTANCE) {
        nextPosition = candidate;
        break;
      }
    }

    if (!nextPosition) {
      nextPosition = {
        x: Math.floor(Math.random() * (maxX + 1)),
        y: Math.floor(Math.random() * (maxY + 1)),
      };
    }

    setPosition(nextPosition);
  };

  const startRound = (number: number, fromPosition?: Position) => {
    setCircleNumber(number);
    if (number > 1 && fromPosition) {
      setLineFrom(fromPosition);
    } else {
      setLineFrom(null);
    }
    randomizePosition(number === 1 ? undefined : fromPosition);
    setApproachKey((prev) => prev + 1);
  };

  const beginPlay = () => {
    clearRoundTimer();
    setHitCount(0);
    setIsGameOver(false);
    setIsPlaying(true);
    startRound(1);
  };

  const handlePlayClick = () => {
    if (isPlaying || showCountdown) return;
    setShowCountdown(true);
  };

  const handleCountdownComplete = () => {
    setShowCountdown(false);
    beginPlay();
  };

  const playFailClickSound = () => {
    const audio = failClickAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  };

  const finishGame = () => {
    playFailClickSound();
    clearRoundTimer();
    setIsPlaying(false);
    setIsGameOver(true);
  };

  const playSuccessClickSound = () => {
    const audio = successClickAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  };

  const handleHitCircleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (!isPlaying) return;

    playSuccessClickSound();
    clearRoundTimer();
    setHitCount((prev) => prev + 1);
    startRound(circleNumber + 1, position);
  };

  const handleOutsideClick = () => {
    if (!isPlaying) return;
    finishGame();
  };

  useEffect(() => {
    if (!isPlaying) return;

    clearRoundTimer();
    roundTimeoutRef.current = window.setTimeout(() => {
      finishGame();
    }, approachDurationMs);

    return clearRoundTimer;
  }, [isPlaying, approachKey, approachDurationMs]);

  useEffect(() => {
    successClickAudioRef.current = new Audio(SUCCESS_CLICK_SOUND_SRC);
    failClickAudioRef.current = new Audio(FAIL_CLICK_SOUND_SRC);
    return () => {
      successClickAudioRef.current = null;
      failClickAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    return clearRoundTimer;
  }, []);

  const activeBorder = isGameOver ? "border-red-500" : "border-[#5BA3F5]";
  const playfieldBorder = isGameOver ? "border-red-500" : "border-blue-500";
  const lineStroke = isGameOver ? "#ef4444" : "rgba(255, 255, 255, 0.7)";
  const cx = (p: Position) => p.x + HIT_SIZE / 2;
  const cy = (p: Position) => p.y + HIT_SIZE / 2;
  const linePoints = (() => {
    if (!lineFrom) return null;

    const x1Center = cx(lineFrom);
    const y1Center = cy(lineFrom);
    const x2Center = cx(position);
    const y2Center = cy(position);
    const dx = x2Center - x1Center;
    const dy = y2Center - y1Center;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) return null;

    const ux = dx / distance;
    const uy = dy / distance;
    const offset = HIT_SIZE / 2;

    return {
      x1: x1Center + ux * offset,
      y1: y1Center + uy * offset,
      x2: x2Center - ux * offset,
      y2: y2Center - uy * offset,
    };
  })();

  const speedMultiplier =
    DEFAULT_APPROACH_DURATION_MS / Math.max(approachDurationMs, 1);

  return (
    <div className="flex justify-end items-end h-screen w-screen gap-40 p-10">
      {showCountdown ? (
        <CountdownLoadingOverlay onComplete={handleCountdownComplete} />
      ) : null}
      {!isPlaying ? (
        <div className="flex flex-col items-start gap-3">
          <button
            type="button"
            onClick={handlePlayClick}
            disabled={showCountdown || isPlaying}
            className="border border-white/30 px-4 py-2 rounded-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            Play
          </button>
          <label className="flex flex-col gap-1 text-sm">
            <span>Durasi approach (ms)</span>
            <input
              type="number"
              min={MIN_APPROACH_DURATION_MS}
              max={MAX_APPROACH_DURATION_MS}
              step={50}
              value={approachDurationMs}
              onChange={(e) => {
                const raw = Number(e.target.value);
                if (Number.isNaN(raw)) return;
                setApproachDurationMs(
                  Math.min(
                    MAX_APPROACH_DURATION_MS,
                    Math.max(MIN_APPROACH_DURATION_MS, raw),
                  ),
                );
              }}
              className="w-40 rounded border border-white/30 bg-transparent px-2 py-1"
            />
          </label>
          <p className="text-sm text-white/80">
            Saat ini: {approachDurationMs} ms · Kecepatan relatif:{" "}
            {speedMultiplier.toFixed(2)}× (baseline {DEFAULT_APPROACH_DURATION_MS}{" "}
            ms = 1×)
          </p>
          <p>Hit berhasil: {hitCount}</p>
          <p>Status: {isGameOver ? "Game Over" : isPlaying ? "Playing" : "Idle"}</p>
        </div>
      ) : null}

      <div
        ref={playfieldRef}
        onClick={handleOutsideClick}
        className={`relative   h-160 w-150 overflow-hidden p-10`}
      >
        {isPlaying || isGameOver ? (
          <>
            {linePoints ? (
              <svg
                className="pointer-events-none absolute inset-0 z-0 h-full w-full"
                aria-hidden
              >
                <line
                  x1={linePoints.x1}
                  y1={linePoints.y1}
                  x2={linePoints.x2}
                  y2={linePoints.y2}
                  stroke={lineStroke}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray="4 7"
                />
              </svg>
            ) : null}
            <div
              className="absolute z-10 h-20 w-20"
              style={{ left: `${position.x}px`, top: `${position.y}px` }}
            >
              <div
                key={approachKey}
                style={{ animationDuration: `${approachDurationMs}ms` }}
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 ${activeBorder} h-30 w-30 rounded-full ${
                  isPlaying ? "osu-approach" : ""
                }`}
              />
              <div
                onClick={handleHitCircleClick}
                className={`relative z-10 border-2 ${activeBorder} rounded-full h-20 w-20 flex items-center justify-center cursor-pointer select-none`}
              >
                <span>{circleNumber}</span>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
