import {
  motion,
  useSpring,
  useMotionValueEvent,
  useScroll,
  MotionValue,
  useMotionValue,
  useTransform,
  useMotionTemplate,
  AnimatePresence,
} from "motion/react";
import * as React from "react";

const DASH_COLOR = '#cccccc';
const DASH_WIDTH = 8;
const DASH_GAP = 16;
const TOOLTIP_OFFSET = 40;

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

  // Offset the tooltip above the cursor
  const offsetY = useTransform(smoothY, (y) => y - TOOLTIP_OFFSET);

  // Debug: Listen to smoothY changes
  useMotionValueEvent(smoothY, "change", (latest) => {
    console.log('SmoothY changed to:', latest);
  });

  // Calculate miles based on indicator's x position + scroll position relative to course profile SVG width
  const miles = useTransform([x, scrollX], (values: number[]) => {
    const [mouseX, scrollXValue] = values;
    // Calculate the actual position on the page (mouse position + scroll)
    const pageX = mouseX + scrollXValue;
    // Use the actual course profile SVG width (3072px) to calculate ratio
    const ratio = Math.max(0, Math.min(1, pageX / COURSE_PROFILE_SVG_WIDTH));
    // Convert to miles (rounded to nearest tenth)
    const milesValue = (ratio * TOTAL_DISTANCE);
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
  const formattedMiles = useTransform(smoothMiles, (value) => value.toFixed(1));

  // Create a template for the miles display
  const milesDisplay = useMotionTemplate`${formattedMiles} MI`;

  return (
    <motion.div
      className="absolute z-[101] pointer-events-none"
      style={{
        left: '50%',
        top: offsetY,
        transform: 'translateX(-50%)',
      }}
    >
      <motion.div className="pointer-events-none whitespace-nowrap text-neutral-500 bg-neutral-100 px-2 py-1 rounded-xs font-mono">
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
  fundraised,
  isVisible = true
}: {
  x: MotionValue<number>;
  mouseY: MotionValue<number>;
  scrollX: MotionValue<number>;
  fundraised: number;
  isVisible?: boolean;
}) {
  // Add spring smoothing to the x position
  const smoothX = useSpring(x, {
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  });

  return (
    <motion.div
      className="absolute z-[100] pointer-events-none"
      style={{
        x: smoothX,
        top: '66px',
        transform: 'translateX(-1px)', // Center on the cursor
      }}
    >
      {/* Indicator Line */}
      <motion.div
        className="flex flex-col w-[1px] border-l border-neutral-400 items-center overflow-visible"
        style={{
          borderLeftStyle: 'dashed',
          borderImageSource: 'repeating-linear-gradient(to bottom, #cccccc 0px, #cccccc 8px, transparent 8px, transparent 16px)',
          borderImageSlice: 1
        }}
        initial={{ height: 'calc(100vh - 66px)' }}
        animate={{
          height: isVisible ? 'calc(100vh - 66px)' : '0px'
        }}
        transition={{ duration: 0.2 }}
      >
        <MileMarkerTooltip x={x} mouseY={mouseY} scrollX={scrollX} fundraised={fundraised} />
      </motion.div>

      {/* Marker - positioned separately for layout animation */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            layoutId="minimap-marker"
            className="absolute -top-2 block"
            style={{
              width: "10px",
              height: "10px",
              transform: 'translateX(-50%)',
              borderRadius: "50%",
              background: "var(--color-pink11)",
            }}
            transition={{ duration: 0.2, type: "spring", stiffness: 200, damping: 30 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
