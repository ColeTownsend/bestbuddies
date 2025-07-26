import React, { useMemo } from 'react';
import { motion, useSpring, useTransform, useMotionValue, useMotionValueEvent, type MotionValue } from 'motion/react';
import { loadRouteProfile, type ElevationProfile } from '../../utils/gpx-parser';
import { elevationUtils } from '../../stores/elevation-store';

interface ElevationProfileSVGProps {
  width?: number;
  height?: number;
  className?: string;
  // Props for syncing with the Indicator
  mouseX?: MotionValue<number>;
  scrollX?: MotionValue<number>;
}

const DEFAULT_WIDTH = 3072;
const DEFAULT_HEIGHT = 200;

export function ElevationProfileSVG({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  className = "",
  mouseX,
  scrollX
}: ElevationProfileSVGProps) {
  const [elevationData, setElevationData] = React.useState<ElevationProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load GPX data
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const profile = await loadRouteProfile();
        setElevationData(profile);
      } catch (error) {
        console.error('Failed to load elevation profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Generate SVG path data
  const pathData = useMemo(() => {
    if (!elevationData || elevationData.points.length === 0) {
      return '';
    }

    const { points, minElevation, maxElevation } = elevationData;
    const elevationRange = maxElevation - minElevation;

    // Handle case where there's no elevation variation
    if (elevationRange === 0) {
      const y = height / 2;
      return `M0,${y}L${width},${y}L${width},${height}L0,${height}Z`;
    }

    // Create path points
    let pathString = '';

    points.forEach((point, index) => {
      // Calculate x position based on distance ratio
      const xRatio = elevationData.totalDistance > 0
        ? point.distance / elevationData.totalDistance
        : index / (points.length - 1);
      const x = xRatio * width;

      // Calculate y position (invert because SVG y=0 is at top)
      const elevationRatio = (point.elevation - minElevation) / elevationRange;
      const y = height - (elevationRatio * height);

      if (index === 0) {
        pathString += `M${x},${y}`;
      } else {
        pathString += `L${x},${y}`;
      }
    });

    // Close the path to create a filled area
    const lastPoint = points[points.length - 1];
    const lastX = elevationData.totalDistance > 0
      ? (lastPoint.distance / elevationData.totalDistance) * width
      : width;

    pathString += `L${lastX},${height}L0,${height}Z`;

    return pathString;
  }, [elevationData, width, height]);

  // Generate path for the stroke line only (without fill to bottom)
  const strokePathData = useMemo(() => {
    if (!elevationData || elevationData.points.length === 0) {
      return '';
    }

    const { points, minElevation, maxElevation } = elevationData;
    const elevationRange = maxElevation - minElevation;

    if (elevationRange === 0) {
      const y = height / 2;
      return `M0,${y}L${width},${y}`;
    }

    let pathString = '';

    points.forEach((point, index) => {
      const xRatio = elevationData.totalDistance > 0
        ? point.distance / elevationData.totalDistance
        : index / (points.length - 1);
      const x = xRatio * width;

      const elevationRatio = (point.elevation - minElevation) / elevationRange;
      const y = height - (elevationRatio * height);

      if (index === 0) {
        pathString += `M${x},${y}`;
      } else {
        pathString += `L${x},${y}`;
      }
    });

    return pathString;
  }, [elevationData, width, height]);

  // Create smooth springs for marker animation
  const markerX = useMotionValue(0);
  const markerY = useMotionValue(height / 2);

  // Apply centering offset for the 12px marker (subtract 6px to center)
  const smoothMarkerX = useSpring(useTransform(markerX, x => x - 6), {
    stiffness: 400 * 0.25, // Match the SCROLL_SMOOTHING value from page.tsx
    damping: 40,
    mass: 0.8 / 0.25,
  });

  const smoothMarkerY = useSpring(useTransform(markerY, y => y - 6), {
    stiffness: 400 * 0.25, // Match the SCROLL_SMOOTHING value from page.tsx
    damping: 40,
    mass: 0.8 / 0.25,
  });

  // Always create motion values for marker position, but provide fallbacks
  const fallbackMouseX = useMotionValue(0);
  const fallbackScrollX = useMotionValue(0);

  // Calculate marker position on elevation curve - always call useTransform
  const markerPosition = useTransform(
    [mouseX || fallbackMouseX, scrollX || fallbackScrollX],
    (values: number[]) => {
      const [mouseXValue, scrollXValue] = values;
      // Return early if we don't have the required data
      if (!mouseX || !scrollX || !elevationData || elevationData.points.length === 0) {
        return { x: 0, y: height / 2, elevation: 0, distance: 0 };
      }

      // Calculate the page position (mouse position + scroll offset)
      const pageX = mouseXValue + scrollXValue;

      // Convert page position to distance using elevation utils
      const distance = elevationUtils.pageXToDistance(pageX);

      // Get elevation at this distance
      const elevation = elevationUtils.getElevationAtDistance(distance);

      // Calculate SVG coordinates
      const { minElevation, maxElevation, totalDistance } = elevationData;
      const elevationRange = maxElevation - minElevation;

      // Calculate x position based on distance ratio
      const xRatio = totalDistance > 0 ? distance / totalDistance : 0;
      const x = Math.max(0, Math.min(width, xRatio * width));

      // Calculate y position (invert because SVG y=0 is at top)
      let y = height / 2; // Default to middle if no elevation range
      if (elevationRange > 0) {
        const elevationRatio = (elevation - minElevation) / elevationRange;
        y = height - (elevationRatio * height);
      }

      return { x, y, elevation, distance };
    }
  );

  // Update marker position when markerPosition changes
  React.useEffect(() => {
    if (markerPosition) {
      const unsubscribe = markerPosition.on('change', (latest) => {
        if (latest) {
          markerX.set(latest.x);
          markerY.set(latest.y);
        }
      });
      return unsubscribe;
    }
  }, [markerPosition, markerX, markerY]);

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-100 ${className}`}
        style={{ width, height }}
      >
        <div className="text-neutral-500 text-sm">Loading elevation profile...</div>
      </div>
    );
  }

  if (!elevationData || elevationData.points.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-100 ${className}`}
        style={{ width, height }}
      >
        <div className="text-neutral-500 text-sm">No elevation data available</div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        className={className}
        style={{ display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Filled area */}
        <path
          d={pathData}
          fill="rgba(156, 163, 175, 0.2)"
          stroke="none"
        />

        {/* Stroke line */}
        <path
          d={strokePathData}
          fill="none"
          stroke="rgba(156, 163, 175, 0.1)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Elevation marker that follows the curve */}
      {mouseX && scrollX && elevationData && elevationData.points.length > 0 && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: smoothMarkerX,
            top: smoothMarkerY,
          }}
        >
          <div
            className="rounded-full border-2 border-white shadow-lg"
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: 'var(--color-pink11)',
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

export default ElevationProfileSVG;