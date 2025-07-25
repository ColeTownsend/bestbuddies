import {
  motion,
  useMotionValue,
  useSpring,
} from "motion/react";
import * as React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type Plugin,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import mapboxgl from 'mapbox-gl';
import { useElevationData, useElevationStore, elevationUtils } from "../../stores/elevation-store";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

interface ElevationProfileProps {
  width?: number;
  height?: number;
  className?: string;
}

const DEFAULT_HEIGHT = 200;

export function ElevationProfile({
  width,
  height = DEFAULT_HEIGHT,
  className = ""
}: ElevationProfileProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<ChartJS<'line'>>(null);
  const { elevationProfile: elevationData, isLoading: elevationLoading } = useElevationData();
  const [marker, setMarker] = React.useState<mapboxgl.Marker | null>(null);
  const [hoverPosition, setHoverPosition] = React.useState<{ x: number; y: number } | null>(null);
  const [chartTooltip, setChartTooltip] = React.useState<{ x: number; y: number; elevation: number; distance: number } | null>(null);

  // Animation values
  const animationProgress = useMotionValue(0);
  const smoothProgress = useSpring(animationProgress, {
    stiffness: 400,
    damping: 10,
    mass: 0.8,
  });

  // Data loading is handled by the store hook

  // Animate entrance
  React.useEffect(() => {
    if (elevationData && elevationData.points.length > 0) {
      const timer = setTimeout(() => {
        animationProgress.set(1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [elevationData, animationProgress]);

  // Create mapbox marker for hover interactions (larger size)
  React.useEffect(() => {
    const element = document.createElement('div');
    element.className = 'h-6 w-6 rounded-full bg-cyan-500 border-2 border-white shadow-lg';
    const newMarker = new mapboxgl.Marker({ element });
    setMarker(newMarker);

    return () => {
      if (newMarker) {
        newMarker.remove();
      }
    };
  }, []);

  // Prepare Chart.js data
  const chartData = React.useMemo(() => {
    if (!elevationData || !elevationData.points.length) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Use index-based labels for consistent coordinate system
    const labels = elevationData.points.map((_, index) => index);

    // Create index-based data for consistent coordinate system
    const indexBasedData = elevationData.points.map((point, index) => ({
      x: index,
      y: point.elevation,
      coordinates: [point.lon, point.lat],
      index,
      distance: point.distance // Keep distance for reference
    }));

    return {
      labels,
      datasets: [
        {
          label: 'Elevation',
          data: indexBasedData,
          fill: 'start',
          backgroundColor: 'rgba(156, 163, 175, 0.5)',
          borderColor: 'rgba(156, 163, 175, 0.2)',
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.4,
          cubicInterpolationMode: 'monotone' as const,
        }
      ]
    };
  }, [elevationData]);

  // Chart.js options
  const chartOptions: ChartOptions<'line'> = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: window.devicePixelRatio || 1,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
    animation: {
      duration: 500,
      easing: 'easeOutQuart'
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false, // Disable Chart.js tooltip since we use the existing Indicator tooltip
      },
      zoom: {
        pan: {
          enabled: false, // Disable panning
        },
        zoom: {
          wheel: {
            enabled: false, // Disable zoom
          },
        },
      },
    },
    scales: {
      x: {
        border: {
          display: false,
        },
        display: false,
        title: {
          display: false,
        },
        ticks: {
          display: false,
          maxRotation: 0,
        },
        gridLines: {
          display: false,
          drawBorder: false
        },
        grid: {
          display: false,
          drawBorder: false
        },
        offset: false,
        min: 0,
        max: (context: any) => {
          const data = context.chart.data.datasets[0]?.data;
          return data ? data.length - 1 : 100;
        }
      },
      y: {
        border: {
          display: false,
        },
        display: false,
        title: {
          display: false,
        },
        ticks: {
          display: false,
        },
        gridLines: {
          display: false,
          drawBorder: false
        },
        grid: {
          display: false,
          drawBorder: false
        }
      }
    },
    onHover: (event, activeElements, chart) => {
      if (activeElements.length > 0) {
        const point = activeElements[0].element as any;
        const dataIndex = activeElements[0].index;

        // Get the actual elevation data point - this should match what's visually rendered
        const elevationPoint = elevationData?.points[dataIndex];

        // Set hover position for the custom marker plugin
        setHoverPosition({
          x: point.x,
          y: point.y
        });

        // Set chart tooltip with correct elevation data
        if (elevationPoint && event.native) {
          const canvasRect = chart.canvas.getBoundingClientRect();
          setChartTooltip({
            x: (event.native as MouseEvent).clientX - canvasRect.left,
            y: (event.native as MouseEvent).clientY - canvasRect.top,
            elevation: elevationPoint.elevation,
            distance: elevationPoint.distance
          });
        }

        if (marker && elevationPoint?.coordinates) {
          // Use the coordinates from the actual elevation data point
          marker.setLngLat(elevationPoint.coordinates);
          // marker.addTo(map); // Uncomment if you have a map instance
        }
      } else {
        setHoverPosition(null);
        setChartTooltip(null);
        if (marker) {
          marker.remove();
        }
      }
    }
  }), [marker, chartData, setHoverPosition]);

  // Custom plugin to draw hover marker on the elevation profile
  const hoverMarkerPlugin: Plugin<'line'> = {
    id: 'hoverMarker',
    afterDraw: (chart) => {
      if (hoverPosition && chart.chartArea) {
        const { ctx, chartArea } = chart;
        const { x, y } = hoverPosition;

        // Save context
        ctx.save();

        // Draw vertical line at hover position
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Red line
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();

        // Draw marker circle at the elevation point
        ctx.fillStyle = 'rgba(239, 68, 68, 1)'; // Red marker
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Restore context
        ctx.restore();
      }
    },
    beforeEvent: (chart, args) => {
      if (args.event.type === 'mouseout') {
        setHoverPosition(null);
        if (marker) {
          marker.remove();
        }
      }
    }
  };

  if (!elevationData || elevationLoading) {
    return (
      <div
        ref={containerRef}
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-neutral-500 text-sm">Loading elevation profile...</div>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className={`relative w-full ${className}`}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div style={{ height, width: '100%', overflow: 'hidden' }}>
        <Line
          ref={chartRef}
          data={chartData}
          options={chartOptions}
          plugins={[hoverMarkerPlugin]}
        />
        
        {/* Chart-specific tooltip */}
        {chartTooltip && (
          <div
            className="absolute z-50 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none"
            style={{
              left: chartTooltip.x + 10,
              top: chartTooltip.y - 30,
              transform: 'translateX(-50%)'
            }}
          >
            <div>{Math.round(chartTooltip.elevation)} ft</div>
            <div>{chartTooltip.distance.toFixed(1)} mi</div>
          </div>
        )}
      </div>

    </motion.div>
  );
}

export default ElevationProfile;