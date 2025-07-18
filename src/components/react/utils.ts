import { useMotionValue } from "motion/react";

export function useMousePosition() {
  const mouseX = useMotionValue<number>(0);
  const mouseY = useMotionValue<number>(0);

  function onMouseMove(e: React.MouseEvent) {
    console.log('Mouse move:', e.clientX, e.clientY);
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }

  function onMouseLeave() {
    // Keep mouseX at its last position when leaving
    // mouseX.set(0);
    // Keep mouseY at its last position instead of resetting to 0
    // This prevents the tooltip from jumping to the top of the screen
    // mouseY.set(0);
  }

  return { mouseX, mouseY, onMouseMove, onMouseLeave };
}