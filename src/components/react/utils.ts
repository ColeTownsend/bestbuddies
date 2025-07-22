import { useMotionValue } from "motion/react";

export function useMousePosition() {
  const mouseX = useMotionValue<number>(0);
  const mouseY = useMotionValue<number>(0);

  function onMouseMove(e: React.MouseEvent) {
    // Get the current target's bounding rectangle
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    // Convert back to page coordinates for absolute positioning
    const pageY = relativeY + rect.top;

    // console.log('Mouse move:', relativeX, pageY);
    mouseX.set(relativeX);
    mouseY.set(pageY);
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