import { motion, useSpring, useTransform, MotionValue } from "motion/react";
import courseProfileSvg from "./course-profile.svg";
import CoursePathAnimator from "./CoursePathAnimator";

interface CourseProfileMaskProps {
  currentAmount: number;
  goalAmount: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  scrollX: MotionValue<number>;
  gridTop?: number;
}

export default function CourseProfileMask({ currentAmount, goalAmount, mouseX, mouseY, scrollX, gridTop = 0 }: CourseProfileMaskProps) {

  // Calculate fill percentage, capped at 100%
  const fillPercentage = Math.min(100, (currentAmount / goalAmount) * 100);

  // Smooth spring animation for the fill
  const animatedFillPercentage = useSpring(fillPercentage, {
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  });

  // Transform the motion value to clipPath string
  const clipPath = useTransform(
    animatedFillPercentage,
    (value) => `polygon(0% 0%, ${value}% 0%, ${value}% 100%, 0% 100%)`
  );


  return (
    <div
      className="relative w-full h-full cursor-none"
    >
      {/* Pink overlay with animated mask */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          clipPath,
        }}
      >
        <div
          className="w-full h-full"
          style={{
            background: `var(--color-pink11)`,
            maskImage: `url(${courseProfileSvg.src})`,
            maskSize: 'cover',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskImage: `url(${courseProfileSvg.src})`,
            WebkitMaskSize: 'cover',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
          }}
        />
      </motion.div>

      <div className="absolute inset-0 w-full h-full">
        <CoursePathAnimator mouseX={mouseX} mouseY={mouseY} scrollX={scrollX} gridTop={gridTop} />
      </div>

      <motion.img
        src={courseProfileSvg.src}
        alt="Course Profile"
        className="inset-0 w-full h-full object-cover"
      />
    </div>
  );
}