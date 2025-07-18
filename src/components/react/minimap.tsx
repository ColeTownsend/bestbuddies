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

// Course profile constants - matches the actual SVG width
const COURSE_PROFILE_SVG_WIDTH = 3072; // From course-profile.svg viewBox
const TOTAL_DISTANCE = 108.21;

function MileMarkerTooltip({ x, mouseY, scrollX, fundraised }: { x: MotionValue<number>; mouseY: MotionValue<number>; scrollX: MotionValue<number>; fundraised: number }) {
  console.log('MileMarkerTooltip', mouseY.get())

  // Debug: Listen to mouseY changes
  useMotionValueEvent(mouseY, "change", (latest) => {
    console.log('MouseY changed to:', latest);
  });

  // Use mouseY directly for close tracking
  const smoothY = useSpring(mouseY, {
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  });

  // Debug: Listen to smoothY changes
  useMotionValueEvent(smoothY, "change", (latest) => {
    console.log('SmoothY changed to:', latest);
  });

  // Calculate miles based on indicator's x position + scroll position relative to course profile SVG width
  const miles = useTransform([x, scrollX], ([mouseX, scrollXValue]: [number, number]) => {
    // Calculate the actual position on the page (mouse position + scroll)
    const pageX = mouseX + scrollXValue;
    // Use the actual course profile SVG width (3072px) to calculate ratio
    const ratio = Math.max(0, Math.min(1, pageX / COURSE_PROFILE_SVG_WIDTH));
    // Convert to miles (rounded to nearest tenth)
    const milesValue = (ratio * TOTAL_DISTANCE).toFixed(1);
    // Debug logging
    console.log('Miles calc:', { mouseX, scrollXValue, pageX, ratio, milesValue });
    return milesValue;
  });

  // Add smoothing to the miles value to match scroll smoothing
  const smoothMiles = useSpring(miles, {
    stiffness: 400 * 0.25, // Match the SCROLL_SMOOTHING value from page.tsx
    damping: 40,
    mass: 0.8 / 0.25,
  });

  // Format the smoothed miles to one decimal place
  const formattedMiles = useTransform(smoothMiles, (value) => parseFloat(value).toFixed(1));

  // Create a template for the miles display
  const milesDisplay = useMotionTemplate`${formattedMiles} MI`;

  return (
    <motion.div
      className="absolute z-[101] pointer-events-none"
      style={{
        left: '50%',
        top: smoothY,
        transform: 'translateX(-50%)',
      }}
    >
      <motion.div className="whitespace-nowrap text-neutral-500 bg-neutral-100 px-2 py-1 rounded-xs font-mono">
        <div className="text-right">
          <motion.div className="text-xs">${fundraised}</motion.div>
          <motion.div className="text-xs">{milesDisplay}</motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Indicator({
  x,
  mouseY,
  scrollX,
  fundraised
}: {
  x: MotionValue<number>;
  mouseY: MotionValue<number>;
  scrollX: MotionValue<number>;
  fundraised: number;
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
        <MileMarkerTooltip x={x} mouseY={mouseY} scrollX={scrollX} fundraised={fundraised} />

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
    </>
  );
}
