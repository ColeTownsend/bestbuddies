import { motion, AnimatePresence } from "motion/react";

interface EnhancedIndicatorLineProps {
  isVisible: boolean;
  height?: string;
}

const lineVariants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        type: "spring",
        stiffness: 400,
        damping: 40,
        mass: 0.8,
      },
      opacity: {
        duration: 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  },
  exiting: {
    pathLength: 0,
    opacity: 0,
    transition: {
      pathLength: {
        type: "spring",
        stiffness: 600,
        damping: 50,
        mass: 0.6,
      },
      opacity: {
        duration: 0.15,
        delay: 0.1,
        ease: [0.55, 0.06, 0.68, 0.19],
      },
    },
  },
};

export default function EnhancedIndicatorLine({ 
  isVisible, 
  height = "calc(100vh - 52px)" 
}: EnhancedIndicatorLineProps) {
  // Calculate the height in pixels for SVG viewBox
  // Using a reasonable default that works with the calc value
  const svgHeight = 800; // Approximate height for viewport minus 52px
  
  // Create dashed path - 8px dash, 8px gap pattern
  const dashLength = 8;
  const gapLength = 8;
  const totalPattern = dashLength + gapLength;
  const numberOfDashes = Math.floor(svgHeight / totalPattern);
  
  // Generate path data for dashed line
  let pathData = "M 0.5 0";
  for (let i = 0; i < numberOfDashes; i++) {
    const startY = i * totalPattern;
    const endY = startY + dashLength;
    pathData += ` L 0.5 ${startY} L 0.5 ${endY}`;
    if (i < numberOfDashes - 1) {
      pathData += ` M 0.5 ${endY + gapLength}`;
    }
  }

  return (
    <div
      className="flex flex-col w-[1px] items-center overflow-visible"
      style={{ height }}
    >
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.svg
            key="indicator-line"
            width="1"
            height={svgHeight}
            viewBox={`0 0 1 ${svgHeight}`}
            className="absolute top-0 left-0"
            style={{ 
              overflow: "visible",
              height: "100%",
            }}
            variants={lineVariants}
            initial="hidden"
            animate="visible"
            exit="exiting"
          >
            <motion.path
              d={pathData}
              stroke="#cccccc"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              style={{
                pathLength: 1,
              }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}