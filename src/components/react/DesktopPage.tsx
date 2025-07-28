import {
  motion,
  useSpring,
  useMotionValueEvent,
  useMotionValue,
} from "motion/react";
import * as React from "react";
import { useSound } from "./use-sound";
import DonationCard from "./donation-card";
import { useMousePosition } from "./utils";
import { Indicator } from "./Indicator";
import { Volume2, VolumeX } from "lucide-react";
import ElevationProfileSVG from "./ElevationProfileSVG";
// Elevation data is now managed by the store

interface CampaignData {
  currentAmount: number;
  goalAmount: number;
  supporters: string[];
  supportersCount: number;
}

interface PageProps {
  campaignData?: CampaignData;
}

const POP_SOUND_OPTIONS = { volume: 0.3 };
const TICK_SOUND_OPTIONS = { volume: 0.1 }

export const COURSE_LENGTH = 108.21;
export const LINE_WIDTH = 1;
export const LINE_COUNT = Math.round(COURSE_LENGTH * 10); // 1082 lines for 108.21 miles at 0.1 mile intervals
export const LINE_STEP = 0.1;

// Course profile width to match page.tsx
export const COURSE_PROFILE_WIDTH = 3072;
// Calculate spacing between lines to cover the full course profile width
export const LINE_GAP = COURSE_PROFILE_WIDTH / LINE_COUNT; // ~2.84px spacing

export const MIN = 0;
export const MAX = COURSE_PROFILE_WIDTH;

// Controls scroll smoothing (lower = more smooth, higher = more responsive)
const SCROLL_SMOOTHING = 0.25;

export default function DesktopPage({ campaignData }: PageProps) {
  // Volume state - default visual to true, but track if user has interacted
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [hasInteracted, setHasInteracted] = React.useState(false);

  // Enable sounds based on user preference only (removed hasInteracted requirement)
  const actualSoundEnabled = soundEnabled;

  const popClick = useSound("/sounds/pop-click.wav", { ...POP_SOUND_OPTIONS, soundEnabled: actualSoundEnabled });
  const tick = useSound("/sounds/tick.mp3", { ...TICK_SOUND_OPTIONS, soundEnabled: actualSoundEnabled });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null); // NEW: ref for #grid
  const [gridTop, setGridTop] = React.useState(0); // NEW: state for grid top offset
  // Elevation data is now managed by the store

  // Motion values for smooth scroll
  const scrollX = useMotionValue(0);
  const smoothScrollX = useSpring(scrollX, {
    stiffness: 400 * SCROLL_SMOOTHING,
    damping: 40,
    mass: 0.8 / SCROLL_SMOOTHING,
  });

  const { mouseX, mouseY, onMouseMove, onMouseLeave } = useMousePosition();

  // Track donation card hover state
  const [isDonationCardHovered, setIsDonationCardHovered] = React.useState(false);
  const lastTickPosition = React.useRef(0);
  const tickThreshold = 50; // Tick every 10 pixels of scrolling

  // Handle tick sound on scroll
  useMotionValueEvent(smoothScrollX, "change", (latest) => {
    const positionDifference = Math.abs(latest - lastTickPosition.current);
    if (positionDifference >= tickThreshold) {
      tick();
      lastTickPosition.current = latest;
    }
  });

  React.useEffect(() => {
    function handleClick() {
      popClick();
    }
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [popClick]);

  // Elevation data loading is now handled by the store

  // Convert vertical scroll to horizontal scroll with spring smoothing
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Check if the target element or its ancestors are scrollable
      const target = e.target as HTMLElement;
      let element = target;

      while (element && element !== container) {
        const computedStyle = window.getComputedStyle(element);
        const overflowY = computedStyle.overflowY;

        // If we find a scrollable element, check if it can actually scroll
        if (overflowY === 'auto' || overflowY === 'scroll') {
          const canScrollDown = element.scrollTop < element.scrollHeight - element.clientHeight;
          const canScrollUp = element.scrollTop > 0;

          // Allow native scrolling if the element can scroll in the attempted direction
          if ((e.deltaY > 0 && canScrollDown) || (e.deltaY < 0 && canScrollUp)) {
            return; // Don't prevent default, allow native scrolling
          }
        }

        element = element.parentElement as HTMLElement;
      }

      // If we reach here, either no scrollable element was found or it can't scroll
      // So we proceed with horizontal page scrolling
      e.preventDefault();

      // Convert vertical scroll to horizontal and update motion value
      const scrollAmount = e.deltaY || e.deltaX;
      const currentScroll = scrollX.get();
      const newScroll = Math.max(0, Math.min(container.scrollWidth - container.clientWidth, currentScroll + scrollAmount));
      scrollX.set(newScroll);
    };

    // Add wheel event listener
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [scrollX]);

  // Apply smooth scroll to actual container
  useMotionValueEvent(smoothScrollX, "change", (latest) => {
    const container = containerRef.current;
    if (container) {
      container.scrollLeft = latest;
    }
  });

  React.useEffect(() => {
    function updateGridTop() {
      if (gridRef.current) {
        // Get the top of #grid relative to the viewport
        const rect = gridRef.current.getBoundingClientRect();
        setGridTop(rect.top);
      }
    }
    updateGridTop();
    window.addEventListener('resize', updateGridTop);
    return () => window.removeEventListener('resize', updateGridTop);
  }, []);

  return (
    <main
      className="main relative h-screen min-w-screen overflow-hidden"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div
        ref={containerRef}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollBehavior: "auto", // We handle smooth scrolling with spring
        }}
        className="scroll-container relative overflow-x-scroll h-full p-12 grid items-center bg-neutral-200"
      >
        <div id="grid" ref={gridRef} style={{
          gridTemplateColumns: "1440px 1440px", // Explicitly set column widths to match sections
        }} className="grid grid-cols-2 gap-16 relative">
          <section className="grid bg-white grid-cols-3 grid-rows-[auto_1fr] gap-8 font-semibold w-[1440px] p-16 h-[720px]">
            <div className="col-span-3">
              <h1 className="text-5xl font-normal mb-8 text-gray-800">
                Best Buddies Challenge
              </h1>
            </div>
            <div className="col-span-1 relative">
              <motion.div
                whileTap={{ scale: 1.1 }}
                className="absolute bottom-0 left-0"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the global click sound

                  if (!hasInteracted) {
                    // First click: enable interaction and keep sounds on
                    setHasInteracted(true);
                    // Play pop sound after enabling interaction
                    setTimeout(() => popClick(), 0);
                  } else {
                    // Subsequent clicks: normal toggle behavior
                    setSoundEnabled(!soundEnabled);
                    // Play pop sound for toggle
                    popClick();
                  }
                }}
              >
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 cursor-pointer text-gray-500 absolute bottom-0 left-0" />
                ) : (
                  <VolumeX className="w-5 h-5 cursor-pointer text-gray-500 absolute bottom-0 left-0" />
                )}
              </motion.div>
            </div>
            <div className="col-span-1">
              <p className="text-base mb-4">
                This past year I tore my meniscus, and I've been unable to run. I've taken up cycling.
                Cycling has given me an outlet, both physical and mental that I am so so glad to have. It keeps me focused, fit, and out of trouble (mostly).
              </p>
              <p className="text-base mb-4">
                It has also provided me a second identity (although my running identity will never be replaced), and a group to hang out with. I started riding recently and felt so welcomed into the group I now ride with.
              </p>
              <p className="text-base">
                Some of the people I ride with work with a group called <span className="text-pink11">Best Buddies</span>.
              </p>
            </div>
            <div className="col-span-1">
              <p className="text-base mb-4">
                <span className="text-pink11">Best Buddies International</span> is the largest organization dedicated to ending the social, physical and economic isolation of the 200 million people worldwide with intellectual and developmental disabilities (IDD).
              </p>
              <p className="text-base mb-4">
                I'm fundraising to support <span className="text-pink11">Best Buddies'</span> programs that create opportunities for one-to-one friendships, integrated employment, inclusive living, leadership development, and family support for people with IDD.
              </p>
              <p className="text-base">
                Running and cycling have given me a place to belong, and I want to support <span className="text-pink11">Best Buddies</span> mission to do the same for others.
              </p>
            </div>

          </section>

          <section className="grid bg-white grid-cols-3 grid-rows-[auto_1fr] gap-8 font-semibold w-[1440px] p-16 h-[720px]">
            <div className="col-span-3">
              <h1 className="text-5xl font-normal mb-8 text-gray-800">
                Best Buddies Challenge
              </h1>
            </div>
            <div className="col-span-1">
              <p className="text-base mb-4">
                My fundraising goal is $1,800, and should surpass that. I'm matching donations up to $1,000 myself.
              </p>
              <p className="text-base mb-4">
                $25: Supplies training and instruction for interactive activities, lesson plans, and tool kits for school students in a Best Buddies chapter so that they can learn about acceptance and inclusion at a young age.
              </p>
              <p className="text-base mb-4">
                $50: Provides a Best Buddies Jobs participant with one hour of job coaching, where an employment candidate with IDD can practice interview skills, prepare for job readiness, or receive on-the-job support so he or she can excel in a new placement.
              </p>

            </div>
            <div className="col-span-1">
              <p className="text-base mb-4">
                $100: Funds an online e-Buddies friendship between a person with and a person without IDD. By joining e-Buddies, participants become more comfortable using technology to communicate with friends, gain computer literacy skills, and are better equipped to socialize online in the future.
              </p>
              <p className="text-base mb-4">
                $250: Supports a one-to-one friendship between someone with IDD and their peer, helping to build a mutually enriching connection that enhances the lives of program participants and their families.            </p>
              <p className="text-base mb-4">
                $1,000: Gives a student leader, Ambassador, or Jobs participant the opportunity to attend the annual Best Buddies Leadership Conference, where they will learn how to become an advocate for the IDD community.            </p>
            </div>
            {/* Donation Card */}
            <div className="col-span-1">
              <DonationCard
                campaignData={campaignData}
                onHoverChange={setIsDonationCardHovered}
                isHovered={isDonationCardHovered}
              />
            </div>
          </section>
        </div>


        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 w-[3072px] overflow-visible"
          style={{ zIndex: 10 }}
        >
          <ElevationProfileSVG
            width={3072}
            height={180}
            className="w-full"
            mouseX={mouseX}
            scrollX={scrollX}
          />
        </div>
      </div>
      <Indicator
        x={mouseX}
        mouseY={mouseY}
        scrollX={scrollX}
        fundraised={campaignData?.currentAmount || 0}
        isVisible={!isDonationCardHovered}
        gridTop={gridTop}
      // elevationData prop no longer needed - using store
      />
    </main>
  );
}
