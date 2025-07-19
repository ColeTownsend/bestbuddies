import {
  motion,
  useSpring,
  useMotionValueEvent,
  useMotionValue,
  useInView,
} from "motion/react";
import * as React from "react";
import { useSound } from "./use-sound";
import courseProfileSvg from "../../assets/course-profile.svg";
import DonationCard from "./donation-card";

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

// Animated text component with opacity and blur
function AnimatedText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "10px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, filter: "blur(8px)" }}
      animate={isInView ? { opacity: 1, filter: "blur(0px)" } : { opacity: 0, filter: "blur(8px)" }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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

export default function MobilePage({ campaignData }: PageProps) {
  const popClick = useSound("/sounds/pop-click.wav", POP_SOUND_OPTIONS);
  const tick = useSound("/sounds/tick.mp3", TICK_SOUND_OPTIONS);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Motion values for smooth scroll
  const scrollY = useMotionValue(0);
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 400 * SCROLL_SMOOTHING,
    damping: 40,
    mass: 0.8 / SCROLL_SMOOTHING,
  });

  const lastTickPosition = React.useRef(0);
  const tickThreshold = 50; // Tick every 10 pixels of scrolling

  // Handle tick sound on scroll
  useMotionValueEvent(smoothScrollY, "change", (latest) => {
    const positionDifference = Math.abs(latest - lastTickPosition.current);
    if (positionDifference >= tickThreshold) {
      tick();
      lastTickPosition.current = latest;
    }
  });

  // Handle wheel events for smooth scrolling
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
      // So we proceed with vertical page scrolling
      e.preventDefault();

      // Convert wheel scroll to vertical and update motion value
      const scrollAmount = e.deltaY || e.deltaX;
      const currentScroll = scrollY.get();
      const newScroll = Math.max(0, Math.min(container.scrollHeight - container.clientHeight, currentScroll + scrollAmount));
      scrollY.set(newScroll);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [scrollY]);

  // Handle touch scroll events for mobile devices
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isScrolling = false;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // Update motion value with current scroll position
      scrollY.set(container.scrollTop);

      // Track scrolling state
      isScrolling = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 100);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [scrollY]);

  React.useEffect(() => {
    function handleClick() {
      popClick();
    }
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [popClick]);

  // Apply smooth scroll position to container (desktop only)
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Only apply smooth scrolling on desktop (when wheel events are available)
    const isDesktop = 'ontouchstart' in window === false;
    if (!isDesktop) return;

    const unsubscribe = smoothScrollY.on("change", (latest) => {
      container.scrollTop = latest;
    });

    return unsubscribe;
  }, [smoothScrollY]);

  return (
    <main
      className="main relative h-screen min-w-screen overflow-hidden"
    >
      <div
        ref={containerRef}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollBehavior: "auto", // We handle smooth scrolling with spring
        }}
        className="scroll-container relative flex flex-col overflow-y-scroll h-full gap-4 p-12"
      >
        <section className="grid bg-white grid-cols-1 gap-8 font-semibold">
          <AnimatedText className="col-span-1">
            <h1 className="text-4xl font-normal mb-8 text-gray-800">
              Best Buddies Challenge
            </h1>
          </AnimatedText>
          <AnimatedText className="col-span-1">
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
          </AnimatedText>
          <AnimatedText className="col-span-1">
            <p className="text-base mb-4">
              <span className="text-pink11">Best Buddies International</span> is the largest organization dedicated to ending the social, physical and economic isolation of the 200 million people worldwide with intellectual and developmental disabilities (IDD).
            </p>
            <p className="text-base mb-4">
              I'm fundraising to support <span className="text-pink11">Best Buddies'</span> programs that create opportunities for one-to-one friendships, integrated employment, inclusive living, leadership development, and family support for people with IDD.
            </p>
            <p className="text-base">
              Running and cycling have given me a place to belong, and I want to support <span className="text-pink11">Best Buddies</span> mission to do the same for others.
            </p>
          </AnimatedText>
        </section>

        <div
          className="w-full my-4"
          style={{ zIndex: 90 }}
        >
          <img src={courseProfileSvg.src} alt="Course Profile" className="w-full h-full object-cover" />

        </div>

        <section className="grid bg-white grid-cols-1 gap-4 font-semibold">
          <AnimatedText className="col-span-1">
            <p className="text-base mb-4">
              My fundraising goal is $1,800, and should surpass that. I'm matching donations up to $1,000 myself.
            </p>
            <p className="text-base mb-4">
              $25: Supplies training and instruction for interactive activities, lesson plans, and tool kits for school students in a Best Buddies chapter so that they can learn about acceptance and inclusion at a young age.
            </p>
            <p className="text-base mb-4">
              $50: Provides a Best Buddies Jobs participant with one hour of job coaching, where an employment candidate with IDD can practice interview skills, prepare for job readiness, or receive on-the-job support so he or she can excel in a new placement.
            </p>
          </AnimatedText>
          <AnimatedText className="col-span-1">
            <p className="text-base mb-4">
              $100: Funds an online e-Buddies friendship between a person with and a person without IDD. By joining e-Buddies, participants become more comfortable using technology to communicate with friends, gain computer literacy skills, and are better equipped to socialize online in the future.
            </p>
            <p className="text-base mb-4">
              $250: Supports a one-to-one friendship between someone with IDD and their peer, helping to build a mutually enriching connection that enhances the lives of program participants and their families.            </p>
            <p className="text-base mb-4">
              $1,000: Gives a student leader, Ambassador, or Jobs participant the opportunity to attend the annual Best Buddies Leadership Conference, where they will learn how to become an advocate for the IDD community.            </p>
          </AnimatedText>
          <div className="col-span-1">
            <DonationCard campaignData={campaignData} />
          </div>
        </section>
      </div>
    </main>
  );
}
