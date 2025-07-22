import {
  motion,
  useSpring,
  useMotionValueEvent,
  useTransform,
  AnimatePresence,
  MotionValue,
} from "motion/react";
import { useState, useRef } from "react";
import { COURSE_PROFILE_PATH } from "./path";

interface CoursePathAnimatorProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  scrollX: MotionValue<number>;
}

// Course profile constants - matches Indicator.tsx
const COURSE_PROFILE_SVG_WIDTH = 3072; // From course-profile.svg viewBox

// Function to get Y coordinate from SVG path at given distance percentage
function getPathPointAtDistance(pathElement: SVGPathElement, distanceRatio: number): { x: number; y: number } {
  const totalLength = pathElement.getTotalLength();
  const targetDistance = totalLength * distanceRatio;
  const point = pathElement.getPointAtLength(targetDistance);
  return { x: point.x, y: point.y };
}

export default function CoursePathAnimator({ mouseX, mouseY, scrollX }: CoursePathAnimatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [debugInfo, setDebugInfo] = useState({ 
    mouseX: 0, 
    scrollX: 0, 
    pageX: 0, 
    progress: 0, 
    actualX: 0, 
    pathY: 0 
  });

  // Add spring smoothing to mouse position - EXACT same config as Indicator
  const smoothMouseX = useSpring(mouseX, {
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  });

  // Calculate progress ratio for path position
  const progressRatio = useTransform(
    smoothMouseX,
    (x) => Math.max(0, Math.min(1, x / COURSE_PROFILE_SVG_WIDTH))
  );

  // Calculate Y position from SVG path, scaled to match the actual course profile position
  const pathY = useTransform(
    progressRatio,
    (ratio) => {
      if (!pathRef.current) return 0;
      const point = getPathPointAtDistance(pathRef.current, ratio);
      // Scale the SVG Y coordinate (0-188) to match the actual course profile position on screen
      // The course profile appears to be positioned around 50vh - 360px area, need to map SVG coords to screen coords
      const courseProfileTop = window.innerHeight * 0.5 - 360 + 4; // Same calc as Indicator top
      const courseProfileHeight = 200; // Approximate height of course profile on screen
      const scaledY = courseProfileTop + (point.y / 188) * courseProfileHeight;
      return scaledY;
    }
  );

  // Debug motion values
  useMotionValueEvent(mouseX, "change", (latest) => {
    setIsVisible(latest > 0);
  });

  useMotionValueEvent(smoothMouseX, "change", (latest) => {
    console.log('🔴 CoursePathAnimator smoothMouseX (should match Indicator):', latest.toFixed(1));
    
    // Calculate progress ratio
    const ratio = Math.max(0, Math.min(1, latest / COURSE_PROFILE_SVG_WIDTH));
    
    // Get current path Y position
    const currentPathY = pathRef.current ? getPathPointAtDistance(pathRef.current, ratio).y : 0;

    setDebugInfo({
      mouseX: mouseX.get(),
      scrollX: scrollX.get(),
      pageX: mouseX.get() + scrollX.get(),
      progress: ratio * 100,
      actualX: latest, // This is now the exact smoothMouseX value
      pathY: currentPathY,
    });
  });

  useMotionValueEvent(progressRatio, "change", (latest) => {
    console.log('🎯 CoursePathAnimator Progress:', (latest * 100).toFixed(1) + '%',
      '| smoothMouseX:', smoothMouseX.get().toFixed(1),
      '| ratio:', latest.toFixed(3));
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full pointer-events-none"
    >
      {/* Debug overlay - visible when component is active */}
      {isVisible && (
        <div className="fixed top-4 left-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50 pointer-events-none">
          <div>Mouse X: {debugInfo.mouseX.toFixed(1)}px (Raw)</div>
          <div>Smooth X: {debugInfo.actualX.toFixed(1)}px (= Indicator)</div>
          <div>Path Y: {debugInfo.pathY.toFixed(1)}px (SVG)</div>
          <div>Progress: {debugInfo.progress.toFixed(1)}%</div>
          <div>Circle: {isVisible ? 'Visible' : 'Hidden'}</div>
          <div className="mt-1 text-pink-400">🎯 Direct Positioning</div>
        </div>
      )}

      {/* SVG path for Y coordinate calculation */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 3072 188"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        style={{ width: `${COURSE_PROFILE_SVG_WIDTH}px`, height: '188px' }}
      >
        <path
          ref={pathRef}
          id="course-path"
          d={COURSE_PROFILE_PATH}
          stroke="transparent"
          strokeWidth="1"
          fill="none"
        />
      </svg>

      {/* Animated pink circle following the path with direct positioning */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            id="course-path-animator"
            className="fixed w-3 h-3 -ml-1.5 -mt-1.5 rounded-full pointer-events-none border-2 border-white shadow-lg z-[99]"
            style={{
              background: "var(--color-pink11)",
              x: smoothMouseX, // Direct X positioning like Indicator
              y: pathY, // Y position from SVG path, already scaled to screen coordinates
              transform: 'translateX(-1px)', // Same centering transform as Indicator
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            }}
            initial={{ 
              opacity: 0,
              scale: 0.5 
            }}
            animate={{ 
              opacity: 1,
              scale: 1
            }}
            exit={{
              opacity: 0,
              scale: 0.5
            }}
            transition={{
              duration: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 30
            }}
          />
        )}
      </AnimatePresence>

      {/* Debug: Show visible SVG path for development */}
      {process.env.NODE_ENV === 'development' && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 3072 188"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
          style={{ width: `${COURSE_PROFILE_SVG_WIDTH}px`, height: '188px' }}
        >
          <path
            d={COURSE_PROFILE_PATH}
            stroke="rgba(236, 72, 153, 0.3)"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      )}
    </div>
  );
}