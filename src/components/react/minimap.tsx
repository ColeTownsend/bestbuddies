"use client";

import {
  motion,
  useSpring,
  useMotionValueEvent,
  useScroll,
  MotionValue,
  useMotionValue,
  useTransform,
} from "motion/react";
import * as React from "react";
import { useSound } from "./use-sound";
import { CourseProfileSVG } from "./course-profile";

export const CURSOR_SIZE = 40;
export const CURSOR_CENTER = CURSOR_SIZE / 2;
export const CURSOR_WIDTH = 2;
export const CURSOR_LARGE_HEIGHT = 400;
export const POINTER_SPRING = { stiffness: 500, damping: 40 };
const SOUND_OPTIONS = { volume: 0.1 };

export const LINE_GAP = 8;
export const LINE_WIDTH = 1;
export const LINE_COUNT = 40;
export const LINE_HEIGHT = 24;
export const LINE_HEIGHT_ACTIVE = 32;

export const LINE_STEP = LINE_WIDTH + LINE_GAP;
export const MIN = 0;
export const MAX = LINE_STEP * (LINE_COUNT - 1);

// Controls scroll smoothing (lower = more smooth, higher = more responsive)
export const SCROLL_SMOOTHING = 0.2;

// Transformer constants
export const DEFAULT_INTENSITY = 7;
export const DISTANCE_LIMIT = 48;

export default function LineMinimap() {
  const tick = useSound("/sounds/tick.mp3", SOUND_OPTIONS);
  const popClick = useSound("/sounds/pop-click.wav", SOUND_OPTIONS);

  // Use Motion's useScroll for scroll tracking
  const { scrollY, scrollYProgress } = useScroll();

  // Transform scroll progress to horizontal position using useTransform
  const scrollX = useTransform(scrollYProgress, [0, 1], [0, MAX]);

  // Use useSpring for smooth animations with configurable smoothing
  const smoothScrollX = useSpring(scrollX, {
    stiffness: 500 * SCROLL_SMOOTHING,
    damping: 40,
    mass: 0.8 / SCROLL_SMOOTHING,
  });

  // Transform for content movement (inverted)
  const contentX = useTransform(smoothScrollX, (val: number) => -val);

  const { mouseX, onMouseMove, onMouseLeave } = useMouseX();
  const lastTickPosition = React.useRef(0);
  const tickThreshold = LINE_STEP;

  // Handle tick sound on scroll
  useMotionValueEvent(smoothScrollX, "change", (latest) => {
    const positionDifference = Math.abs(latest - lastTickPosition.current);
    if (positionDifference >= tickThreshold) {
      tick();
      lastTickPosition.current = latest;
    }
  });

  // Handle horizontal scroll conversion
  React.useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Convert vertical scroll to page scroll
      window.scrollBy(0, e.deltaY);
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    document.body.style.overflowX = 'hidden';

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.body.style.overflowX = 'auto';
    };
  }, []);

  function onPointerDown() {
    popClick();
  }

  return (
    <div className="relative" style={{ height: `calc(100vh + ${MAX}px)` }}>
      {/* Main content that scrolls horizontally */}
      <motion.div
        className="fixed inset-0 w-full h-full overflow-hidden"
        style={{ x: contentX }}
      >
        <div className="w-full h-full bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-center">
          <div className="text-4xl font-bold text-gray-800">
            Horizontal Scrolling Content
          </div>
        </div>
      </motion.div>

      <motion.div
        className="fixed translate-center z-20"
        onPointerMove={onMouseMove}
        onPointerLeave={onMouseLeave}
        onPointerDown={onPointerDown}
      >
        <div className="flex items-end" style={{ gap: LINE_GAP }}>
          {[...Array(LINE_COUNT)].map((_, i) => (
            <Line
              key={i}
              index={i}
              scrollX={smoothScrollX}
              mouseX={mouseX}
              active={isActive(i, LINE_COUNT)}
            />
          ))}
        </div>
        <Indicator x={smoothScrollX} />
      </motion.div>

      {/* Fixed bottom div that sticks to viewport */}
      <div className="fixed bottom-0 left-0 right-0 w-full z-10">
        <CourseProfileSVG />
      </div>
    </div>
  );
}

function Line({
  active,
  mouseX,
  scrollX,
  index,
}: {
  active?: boolean;
  hovered?: boolean;
  mouseX: MotionValue<number>;
  scrollX: MotionValue<number>;
  index: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const scaleY = useSpring(1, { damping: 45, stiffness: 600 });
  const centerX = index * LINE_STEP + LINE_WIDTH / 2;

  useProximity(scaleY, {
    ref,
    baseValue: 1,
    mouseX,
    scrollX,
    centerX,
  });

  return (
    <motion.div
      ref={ref}
      className={active ? "bg-gray12" : "bg-gray9"}
      style={{
        width: LINE_WIDTH,
        height: active ? LINE_HEIGHT_ACTIVE : LINE_HEIGHT,
        scaleY,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
    />
  );
}

/////////////////////////////////////////////////////////////////////////////////////////////

export function transformScale(
  distance: number,
  initialValue: number,
  baseValue: number,
  intensity: number
) {
  if (Math.abs(distance) > DISTANCE_LIMIT) {
    return initialValue;
  }
  const normalizedDistance = initialValue - Math.abs(distance) / DISTANCE_LIMIT;
  const scaleFactor = normalizedDistance * normalizedDistance;
  return baseValue + intensity * scaleFactor;
}

export interface ProximityOptions {
  ref: React.RefObject<HTMLElement | null>;
  baseValue: number;
  mouseX: MotionValue<number>;
  scrollX: MotionValue<number>;
  centerX: number;
  intensity?: number;
  reset?: boolean;
  transformer?: (
    distance: number,
    initialValue: number,
    baseValue: number,
    intensity: number
  ) => number;
}

export function useProximity(
  value: MotionValue<number>,
  {
    ref,
    baseValue,
    mouseX,
    scrollX,
    centerX,
    intensity = DEFAULT_INTENSITY,
    reset = true,
    transformer = transformScale,
  }: ProximityOptions
) {
  const initialValueRef = React.useRef<number>(null);

  React.useEffect(() => {
    if (!initialValueRef.current) {
      initialValueRef.current = value.get();
    }
  }, []);

  useMotionValueEvent(mouseX, "change", (latest) => {
    const rect = ref.current!.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const distance = latest - centerX;
    value.set(
      transformer(distance, initialValueRef.current!, baseValue, intensity)
    );
  });

  useMotionValueEvent(scrollX, "change", (latest) => {
    const initialValue = initialValueRef.current!;
    const distance = latest - centerX;
    const targetScale = transformer(
      distance,
      initialValue,
      baseValue,
      intensity
    );

    if (reset) {
      const currentVelocity = Math.abs(scrollX.getVelocity());
      const velocityThreshold = 300;
      const velocityFactor = Math.min(1, currentVelocity / velocityThreshold);
      const lerped = initialValue + (targetScale - initialValue) * velocityFactor;
      value.set(lerped);
    } else {
      value.set(targetScale);
    }
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////

export function useMouseX() {
  const mouseX = useMotionValue<number>(0);

  function onPointerMove(e: React.PointerEvent) {
    mouseX.set(e.clientX);
  }

  function onPointerLeave() {
    mouseX.set(0);
  }

  return { mouseX, onMouseMove: onPointerMove, onMouseLeave: onPointerLeave };
}

/////////////////////////////////////////////////////////////////////////////////////////////

export function isActive(index: number, count: number): boolean {
  // First and last ticks are always active
  if (index === 0 || index === count - 1) return true;
  // Calculate the step size between active ticks
  const step = count / (Math.floor(count / LINE_GAP) + 1);
  // Check if this index is close to a multiple of the step
  return Math.abs(index % step) < 0.5 || Math.abs((index % step) - step) < 0.5;
}

/////////////////////////////////////////////////////////////////////////////////////////////

export function Indicator({ x }: { x: MotionValue<number> }) {
  return (
    <motion.div
      className="flex flex-col bg-orange w-[1px] items-center absolute h-[100vh]! -top-8"
      style={{ x }}
    >
      <svg
        width="7"
        height="6"
        viewBox="0 0 7 6"
        fill="none"
        className="-translate-y-3"
      >
        <path
          d="M3.54688 6L0.515786 0.75L6.57796 0.75L3.54688 6Z"
          fill="var(--color-orange)"
        />
      </svg>
    </motion.div>
  );
}
