import { useMotionValue } from "motion/react";

export function useMousePosition() {
  const mouseX = useMotionValue<number>(0);
  const mouseY = useMotionValue<number>(0);

  function onMouseMove(e: React.MouseEvent) {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }

  function onMouseLeave() {
    // Keep mouseX at its last position when leaving
    // mouseX.set(0);
    mouseY.set(0);
  }

  return { mouseX, mouseY, onMouseMove, onMouseLeave };
}