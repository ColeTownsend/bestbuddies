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

const DASH_COLOR = '#cccccc';
const DASH_WIDTH = 8;
const DASH_GAP = 16;

export function Indicator({
  x,
  // distance,
  // mouseY
}: {
  x: MotionValue<number>;
  // distance: MotionValue<number>;
  // mouseY: MotionValue<number>
}) {
  // Add spring smoothing to the x position
  const smoothX = useSpring(x, {
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  });

  return (
    <>
      <motion.div
        className="flex flex-col w-[1px] border-l border-neutral-400 items-center absolute z-[100] pointer-events-none"
        style={{
          x: smoothX,
          top: '20px', // Give space for the SVG marker
          height: 'calc(100% - 20px)', // Adjust height to account for top offset and bottom spacing
          transform: 'translateX(-1px)', // Center the line on the cursor
          borderLeftStyle: 'dashed',
          borderImageSource: 'repeating-linear-gradient(to bottom, #cccccc 0px, #cccccc 8px, transparent 8px, transparent 16px)',
          borderImageSlice: 1
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="absolute -top-2"
        >
          <circle
            cx="6"
            cy="6"
            r="5"
            fill="var(--color-pink11)"
          />
        </svg>
      </motion.div>
      {/* <MileMarkerTooltip distance={distance} x={x} mouseY={mouseY} /> */}
    </>
  );
}
