import {
  motion,
  useSpring,
  useMotionValueEvent,
  useScroll,
  MotionValue,
  useMotionValue,
  useTransform,
  useMotionTemplate,
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

export const COURSE_LENGTH = 108.21;
export const LINE_WIDTH = 1;
export const LINE_COUNT = Math.round(COURSE_LENGTH * 10); // 1082 lines for 108.21 miles at 0.1 mile intervals
export const LINE_STEP = 0.1;

// Course profile width to match page.tsx
export const COURSE_PROFILE_WIDTH = 3072;
// Calculate spacing between lines to cover the full course profile width
export const LINE_GAP = COURSE_PROFILE_WIDTH / LINE_COUNT; // ~2.84px spacing

export const LINE_HEIGHT = 20;
export const LINE_HEIGHT_ACTIVE = 40;

export const MIN = 0;
export const MAX = COURSE_PROFILE_WIDTH; // Use course profile width instead of COURSE_LENGTH * 10

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

  // Calculate distance along the 108.21-mile course based on minimap position
  // The course profile SVG is 3072px wide, so we map the minimap indicator position to miles
  const distance = useTransform(smoothScrollX, [0, MAX], [0, COURSE_LENGTH]);

  const { mouseX, mouseY, onMouseMove, onMouseLeave } = useMousePosition();
  const lastTickPosition = React.useRef(0);
  const tickThreshold = LINE_GAP; // Use LINE_GAP for pixel-based threshold

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
        </div>
      </motion.div>

      <motion.div
        className="fixed translate-center z-20"
        style={{ width: `${COURSE_PROFILE_WIDTH}px` }}
        onPointerMove={onMouseMove}
        onPointerLeave={onMouseLeave}
        onPointerDown={onPointerDown}
      >
        <div className="flex items-end justify-between" style={{ width: '100%' }}>
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
        <Indicator x={smoothScrollX} distance={distance} mouseY={mouseY} />
      </motion.div>
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
  // Calculate centerX based on position within the course profile width
  const centerX = (index / (LINE_COUNT - 1)) * COURSE_PROFILE_WIDTH;

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

export function useMousePosition() {
  const mouseX = useMotionValue<number>(0);
  const mouseY = useMotionValue<number>(0);

  function onPointerMove(e: React.PointerEvent) {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }

  function onPointerLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return { mouseX, mouseY, onMouseMove: onPointerMove, onMouseLeave: onPointerLeave };
}

/////////////////////////////////////////////////////////////////////////////////////////////

export function isActive(index: number, count: number): boolean {
  // First and last ticks are always active
  if (index === 0 || index === count - 1) return true;

  // Show active ticks every 10 units (every 1 mile since we have 10 lines per mile)
  const mileInterval = 10;
  return index % mileInterval === 0;
}

/////////////////////////////////////////////////////////////////////////////////////////////

function MileMarkerTooltip({
  distance,
  x,
  mouseY
}: {
  distance: MotionValue<number>;
  x: MotionValue<number>;
  mouseY: MotionValue<number>
}) {
  const distanceText = useTransform(distance, (value) => `${value.toFixed(1)} mi`);
  const isVisible = useTransform(mouseY, (value) => value > 0);

  return (
    <motion.div
      className="absolute pointer-events-none z-30 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg"
      style={{
        x: x,
        y: mouseY,
        transform: "translateX(-50%)",
        opacity: isVisible,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.span>{distanceText}</motion.span>
    </motion.div>
  );
}

export function Indicator({
  x,
  distance,
  mouseY
}: {
  x: MotionValue<number>;
  distance: MotionValue<number>;
  mouseY: MotionValue<number>
}) {
  return (
    <>
      <motion.div
        className="flex flex-col bg-pink11 w-[1px] items-center absolute h-[100vh]! -top-8"
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
            fill="var(--color-pink11)"
          />
        </svg>
      </motion.div>
      <MileMarkerTooltip distance={distance} x={x} mouseY={mouseY} />
    </>
  );
}
