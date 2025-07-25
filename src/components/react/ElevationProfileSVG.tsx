import React, { useMemo } from 'react';
import { loadRouteProfile, type ElevationProfile } from '../../utils/gpx-parser';

interface ElevationProfileSVGProps {
  width?: number;
  height?: number;
  className?: string;
}

const DEFAULT_WIDTH = 3072;
const DEFAULT_HEIGHT = 200;

export function ElevationProfileSVG({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  className = ""
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
        fill="rgba(156, 163, 175, 0.3)"
        stroke="none"
      />
      
      {/* Stroke line */}
      <path
        d={strokePathData}
        fill="none"
        stroke="rgba(156, 163, 175, 0.8)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default ElevationProfileSVG;