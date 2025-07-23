import {
  motion,
  useSpring,
  useTransform,
  MotionValue,
} from "motion/react";
import { useRef } from "react";
import { COURSE_PROFILE_PATH } from "./path";

interface CoursePathAnimatorProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  scrollX: MotionValue<number>;
  gridTop: number;
}

// Course profile constants - matches Indicator.tsx
const COURSE_PROFILE_SVG_WIDTH = 3072; // From course-profile.svg viewBox
const COURSE_PROFILE_SVG_HEIGHT = 188; // From course-profile.svg viewBox

// Function to get Y coordinate from SVG path at given distance percentage
function getPathPointAtDistance(pathElement: SVGPathElement, distanceRatio: number): { x: number; y: number } {
  const totalLength = pathElement.getTotalLength();
  const targetDistance = totalLength * distanceRatio;
  const point = pathElement.getPointAtLength(targetDistance);
  return { x: point.x, y: point.y };
}

export default function CoursePathAnimator({ mouseX, mouseY, scrollX, gridTop }: CoursePathAnimatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  // Calculate the combined X position (mouse + scroll) for path tracking
  const pageX = useTransform([mouseX, scrollX], ([mouse, scroll]: number[]) => mouse + scroll);

  // Use synchronized spring settings with Indicator for consistent motion
  const smoothPageX = useSpring(pageX, {
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  });

  // Calculate progress ratio using pageX for path tracking
  const progressRatio = useTransform(
    pageX,
    (x) => Math.max(0, Math.min(1, x / COURSE_PROFILE_SVG_WIDTH))
  );

  // Get SVG path Y coordinate and apply spring smoothing
  const pathY = useTransform(
    progressRatio,
    (ratio) => {
      if (!pathRef.current || !containerRef.current) return 0;
      const point = getPathPointAtDistance(pathRef.current, ratio);
      const containerHeight = containerRef.current.getBoundingClientRect().height;
      return (point.y / COURSE_PROFILE_SVG_HEIGHT) * containerHeight;
    }
  );

  // Apply spring smoothing to both X and Y for synchronized motion
  const smoothPathY = useSpring(pathY, {
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  });

  // Simple visibility logic based on pageX position
  const isVisible = useTransform(pageX, (x) => x > 0);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full pointer-events-none"
    >

      {/* SVG path for Y coordinate calculation */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 3072 188"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        style={{ width: `${COURSE_PROFILE_SVG_WIDTH}px`, height: `${COURSE_PROFILE_SVG_HEIGHT}px` }}
      >
        <path
          ref={pathRef}
          id="course-path"
          d={COURSE_PROFILE_PATH}
          stroke="red"
          strokeWidth="1"
          fill="none"
        />
      </svg>

      {/* Animated pink circle following the path with direct positioning */}
      <motion.div
        id="course-path-animator"
        className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full pointer-events-none border-2 border-white shadow-lg z-[99]"
        style={{
          background: "var(--color-pink11)",
          x: smoothPageX,
          y: smoothPathY,
          transform: 'translateX(-1px)',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          opacity: isVisible,
        }}
      />
    </div>
  );
}