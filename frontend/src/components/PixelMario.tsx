import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

// Size (in px) of a single sprite "pixel". Bump this up for a bigger sprite.
const PIXEL_SIZE = 3;

// Reuses the app's existing retro palette so Mario matches the theme.
const COLORS: Record<string, string> = {
  R: "#f83800", // cap & shirt — matches danger red
  B: "#0058f8", // overalls — matches primary-600
  S: "#f8b878", // skin
  H: "#1b1b1b", // hair, mustache, boots — matches ink
};

// 10 x 12 sprite grid, facing right. Rows 0-9 (head/torso) are shared
// between both walk frames; only the leg rows (10-11) change, which is
// enough to sell a simple two-frame walk cycle.
const BODY = [
  ".RRRRRRR..",
  "RRRRRRRRRR",
  "..HSSSSH..",
  ".HSSSSSSH.",
  ".HHSSSHH..",
  "..SSSSSS..",
  ".RRBBRRR..",
  "RRRBBRRRR.",
  "RRRBBBRRR.",
  "..BBBBBB..",
];

const LEGS_FRAME_A = ["..BB..BB..", ".HH....HH."];
const LEGS_FRAME_B = [".BB....BB.", "HH......HH"];

const FRAME_A = [...BODY, ...LEGS_FRAME_A];
const FRAME_B = [...BODY, ...LEGS_FRAME_B];

const SPRITE_WIDTH = 10 * PIXEL_SIZE;
const SPRITE_HEIGHT = 12 * PIXEL_SIZE;

// A small green cameo — reuses the theme's success green & gold rather than
// Mario's palette so the two read as distinct characters.
const YOSHI_COLORS: Record<string, string> = {
  G: "#00a800", // body & snout — matches success green
  W: "#ffffff", // belly/eye white
  O: "#f8b800", // saddle & shoes — matches gold
  K: "#1b1b1b", // eye pupil — matches ink
  R: "#f83800", // back fin — matches danger red
};

// Side view, facing right: forward snout (rows 2-5), back fin (row 0), eye
// (row 4), saddle + belly patch (rows 7-10), legs/shoes (rows 12-13), and a
// small tail nub (row 12, col 1).
const YOSHI_SPRITE = [
  ".....RR.....",
  "....GGGGG...",
  "...GGGGGGGG.",
  "..GGGGGGGGGG",
  "..GGGGWKGGGG",
  "..GGGGGGGGGG",
  ".GGGGGGGGGG.",
  "OGGGWWWWGGG.",
  "OOGGWWWWGG..",
  ".OGGWWWWGG..",
  "..GGGWWGG...",
  "..GGGGGGG...",
  ".G..GG.GG...",
  "....OO.OO...",
];

const YOSHI_WIDTH = 12 * PIXEL_SIZE;
const YOSHI_HEIGHT = 14 * PIXEL_SIZE;

// A gruffer cameo — greens/reds/gold shifted darker so he doesn't get
// mistaken for Yoshi at a glance.
const BOWSER_COLORS: Record<string, string> = {
  G: "#4d7c0f", // skin — dark olive green
  M: "#f83800", // mane & eyebrows — matches danger red
  W: "#ffffff", // horns, teeth, eye, belly patch
  K: "#1b1b1b", // pupil & nostril — matches ink
  O: "#f8b800", // shell spikes — matches gold
  D: "#8b4513", // shell base
};

// Side-view bust, facing right: horns + red mane (rows 0-3), eye (row 4),
// jagged teeth along the jaw (row 7), shell spikes and shell body poking up
// behind him (rows 8-13).
const BOWSER_SPRITE = [
  ".....W..W.....",
  "...MMW..W.....",
  "..MMGGGGGG....",
  ".MMGGGGGGMMG..",
  "..GGGGGGGGWKG.",
  "..GGGGGGGGGGG.",
  "..GGGGGGGGGKG.",
  ".GGWGWGWGWGG..",
  ".OGGGGGGGGG...",
  ".OGGGGGGGG....",
  ".ODDDDDGGG....",
  "..DDWWDDG.....",
  "..DDWWDD......",
  "...DDDD.......",
];

const BOWSER_WIDTH = 14 * PIXEL_SIZE;
const BOWSER_HEIGHT = 14 * PIXEL_SIZE;

// Cameos that occasionally wander in near Mario, say their line, then leave.
const CAMEOS = [
  {
    key: "yoshi",
    sprite: YOSHI_SPRITE,
    colors: YOSHI_COLORS,
    width: YOSHI_WIDTH,
    height: YOSHI_HEIGHT,
    line: "Whoopie!",
  },
  {
    key: "bowser",
    sprite: BOWSER_SPRITE,
    colors: BOWSER_COLORS,
    width: BOWSER_WIDTH,
    height: BOWSER_HEIGHT,
    line: "Rawrrrr",
  },
] as const;

const CAMEO_VISIBLE_MS = 1800;
const CAMEO_INTERVAL: [number, number] = [8000, 16000]; // ms, random range

// Movement/behavior tuning.
const WALK_SPEED = 12; // % of track width per second
const MIN_POSITION = 0;
const MAX_POSITION = 90; // leaves room so the sprite doesn't clip the edge
const JUMP_DURATION = 450; // ms
const JUMP_HEIGHT = 20; // px
const DECISION_INTERVAL: [number, number] = [1500, 3500]; // ms, random range

function spriteToBoxShadow(
  rows: string[],
  colors: Record<string, string> = COLORS
): string {
  const shadows: string[] = [];
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      const color = colors[char];
      if (color) {
        shadows.push(`${x * PIXEL_SIZE}px ${y * PIXEL_SIZE}px 0 ${color}`);
      }
    });
  });
  return shadows.join(", ");
}

const frameStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: PIXEL_SIZE,
  height: PIXEL_SIZE,
  background: "transparent",
};

function randomBetween([min, max]: [number, number]) {
  return min + Math.random() * (max - min);
}

/**
 * A tiny animated pixel-art Mario that wanders back and forth across its
 * container, occasionally turning around or hopping in place. Purely
 * decorative — shown to authenticated users in place of the "Get Started
 * Free" sign-up CTA, since they've already signed up.
 */
export default function PixelMario() {
  const marioRef = useRef<HTMLDivElement>(null);
  const jumperRef = useRef<HTMLDivElement>(null);
  const legARef = useRef<HTMLDivElement>(null);
  const legBRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(10); // tracked so cameos can pop in near Mario
  const [cameo, setCameo] = useState<{
    key: (typeof CAMEOS)[number]["key"];
    left: number;
  } | null>(null);

  useEffect(() => {
    let raf = 0;
    let lastTime = performance.now();
    let position = 10; // % from left
    let direction: 1 | -1 = 1;
    let jumping = false;
    let jumpStart = 0;
    let nextDecisionAt = lastTime + randomBetween(DECISION_INTERVAL);

    const applyFacing = () => {
      if (marioRef.current) {
        marioRef.current.style.transform =
          direction === 1 ? "scaleX(1)" : "scaleX(-1)";
      }
    };

    applyFacing();

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Walk.
      position += direction * WALK_SPEED * dt;
      if (position > MAX_POSITION) {
        position = MAX_POSITION;
        direction = -1;
        applyFacing();
      } else if (position < MIN_POSITION) {
        position = MIN_POSITION;
        direction = 1;
        applyFacing();
      }

      // Randomly decide to turn around or jump.
      if (!jumping && now >= nextDecisionAt) {
        const roll = Math.random();
        if (roll < 0.4) {
          direction = direction === 1 ? -1 : 1;
          applyFacing();
        } else if (roll < 0.75) {
          jumping = true;
          jumpStart = now;
        }
        nextDecisionAt = now + randomBetween(DECISION_INTERVAL);
      }

      // Jump arc.
      let lift = 0;
      if (jumping) {
        const elapsed = now - jumpStart;
        if (elapsed >= JUMP_DURATION) {
          jumping = false;
        } else {
          lift = Math.sin((elapsed / JUMP_DURATION) * Math.PI) * JUMP_HEIGHT;
        }
      }

      positionRef.current = position;
      if (marioRef.current) {
        marioRef.current.style.left = `${position}%`;
      }
      if (jumperRef.current) {
        jumperRef.current.style.transform = `translateY(${-lift}px)`;
      }
      // Freeze the walk cycle mid-stride while airborne.
      const legPlayState = jumping ? "paused" : "running";
      if (legARef.current) legARef.current.style.animationPlayState = legPlayState;
      if (legBRef.current) legBRef.current.style.animationPlayState = legPlayState;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Cameos: every so often, pick one of Yoshi/Bowser at random, pop him in
  // near wherever Mario currently is, say his line, then disappear and
  // schedule the next appearance.
  useEffect(() => {
    let timeoutId = 0;

    const scheduleNext = () => {
      timeoutId = window.setTimeout(() => {
        const left = Math.min(
          95,
          Math.max(0, positionRef.current + randomBetween([-15, 15]))
        );
        const { key } = CAMEOS[Math.floor(Math.random() * CAMEOS.length)];
        setCameo({ key, left });

        timeoutId = window.setTimeout(() => {
          setCameo(null);
          scheduleNext();
        }, CAMEO_VISIBLE_MS);
      }, randomBetween(CAMEO_INTERVAL));
    };

    scheduleNext();
    return () => window.clearTimeout(timeoutId);
  }, []);

  const activeCameo = cameo && CAMEOS.find(c => c.key === cameo.key);

  return (
    <div className="relative w-full h-20 overflow-hidden" role="presentation" aria-hidden="true">
      <div
        ref={marioRef}
        className="absolute bottom-2"
        style={{ width: SPRITE_WIDTH, height: SPRITE_HEIGHT, left: "10%" }}
      >
        <div ref={jumperRef} className="relative w-full h-full">
          <div
            ref={legARef}
            className="animate-mario-legs-a"
            style={{ ...frameStyle, boxShadow: spriteToBoxShadow(FRAME_A) }}
          />
          <div
            ref={legBRef}
            className="animate-mario-legs-b"
            style={{ ...frameStyle, boxShadow: spriteToBoxShadow(FRAME_B) }}
          />
        </div>
      </div>

      {cameo && activeCameo && (
        <div
          key={cameo.key + cameo.left /* restart the pop-in animation each cameo */}
          className="animate-cameo-pop absolute bottom-2"
          style={{
            width: activeCameo.width,
            height: activeCameo.height,
            left: `${cameo.left}%`,
          }}
        >
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-ink border-2 border-ink shadow-pixel-sm px-2 py-1 font-display text-[8px] tracking-wide">
            {activeCameo.line}
          </div>
          <div
            style={{
              ...frameStyle,
              boxShadow: spriteToBoxShadow(activeCameo.sprite, activeCameo.colors),
            }}
          />
        </div>
      )}
    </div>
  );
}
