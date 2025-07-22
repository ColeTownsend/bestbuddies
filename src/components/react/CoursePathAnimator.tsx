import {
  motion,
  useSpring,
  useMotionValueEvent,
  useTransform,
  useMotionTemplate,
  AnimatePresence,
  MotionValue,
} from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { COURSE_PROFILE_PATH } from "./path";

interface CoursePathAnimatorProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  scrollX: MotionValue<number>;
}

// Course profile constants - matches Indicator.tsx
const COURSE_PROFILE_SVG_WIDTH = 3072; // From course-profile.svg viewBox

export default function CoursePathAnimator({ mouseX, mouseY, scrollX }: CoursePathAnimatorProps) {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [debugInfo, setDebugInfo] = useState({ mouseX: 0, scrollX: 0, pageX: 0, offsetDistance: 0 });

  // Calculate actual page position combining mouse + scroll. This is the raw
  // horizontal position of the cursor relative to the entire page.
  const pageX = useTransform(
    [mouseX, scrollX],
    ([mouseXValue, scrollXValue]) => mouseXValue + scrollXValue
  );

  // Add spring smoothing to the combined page position. This ensures the pink
  // dot smoothly follows the cursor, even during scrolling.
  const smoothPageX = useSpring(pageX, {
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  });

  // Debug motion values
  useMotionValueEvent(mouseX, "change", (latest) => {
    setIsVisible(latest > 0);
  });

  useMotionValueEvent(smoothPageX, "change", (latest) => {
    // Use the course profile SVG width to calculate the progress ratio
    const ratio = Math.max(0, Math.min(1, latest / COURSE_PROFILE_SVG_WIDTH));
    setDebugInfo({
      mouseX: mouseX.get(),
      scrollX: scrollX.get(),
      pageX: pageX.get(),
      offsetDistance: ratio * 100,
    });
  });

  // Convert the smoothed pageX into a percentage for the CSS `offset-distance`
  // property. This value now correctly reflects the cursor's position along the
  // full width of the course path, including scroll offsets.
  const offsetDistance = useTransform(
    smoothPageX,
    (currentX) => {
      const ratio = Math.max(0, Math.min(1, currentX / COURSE_PROFILE_SVG_WIDTH));
      const progress = ratio * 100;
      return progress;
    }
  );


  // Create motion template for offset-distance CSS property
  const offsetDistanceTemplate = useMotionTemplate`${offsetDistance}%`;

  // Debug offset distance changes (after offsetDistance is defined)
  useMotionValueEvent(offsetDistance, "change", (latest) => {
    console.log('CoursePathAnimator OffsetDistance changed to:', latest.toFixed(1) + '%');
  });

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      {/* Debug overlay - visible when component is active */}
      {isVisible && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50 pointer-events-none">
          <div>Mouse X: {debugInfo.mouseX.toFixed(1)}px (Indicator position)</div>
          <div>Scroll X: {debugInfo.scrollX.toFixed(1)}px</div>
          <div>Page X: {debugInfo.pageX.toFixed(1)}px (Tooltip calc)</div>
          <div>Progress: {debugInfo.offsetDistance.toFixed(1)}%</div>
          <div>Circle: {isVisible ? 'Visible' : 'Hidden'}</div>
          <div className="mt-1 text-pink-400">🎯 Aligned with Indicator</div>
        </div>
      )}
      {/* Invisible SVG path for CSS offset-path reference */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 2807 188"
        preserveAspectRatio="none"
        width={3072}
        height="auto"
        className="absolute inset-0 w-full h-full -top-[1px]"
      >
        <path
          id="course-path"
          d={COURSE_PROFILE_PATH}
          stroke="red"
          strokeWidth="1"
          fill="none"
        />
      </svg>

      {/* Animated pink circle following the path */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="absolute top-0 left-0 w-2 h-2 bg-pink11 rounded-full pointer-events-none"
            style={{
              offsetPath: `path("${COURSE_PROFILE_PATH}")`,
              offsetDistance: offsetDistanceTemplate,
              // The y-position of the animated circle is determined by the path itself,
              // so we only need to control its horizontal progress via `offset-distance`.
            }}
            initial={{
              opacity: 0,
              scale: 0.5,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.5,
            }}
            transition={{
              duration: 0.2,
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}