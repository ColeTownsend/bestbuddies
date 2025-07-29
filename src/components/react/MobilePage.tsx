import {
  motion,
  useSpring,
  useMotionValueEvent,
  useMotionValue,
  useInView,
} from "motion/react";
import * as React from "react";
import { useSound } from "./use-sound";
import courseProfileSvg from "./course-profile.svg";
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
  const isInView = useInView(ref, { once: true, margin: "-80px" });

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

// Controls scroll smoothing (lower = more smooth, higher = more responsive)
const SCROLL_SMOOTHING = 0.5;

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

  React.useEffect(() => {
    function handleClick() {
      popClick();
    }
    window.addEventListener("click", handleClick);
    window.addEventListener("touchstart", handleClick)
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("touchstart", handleClick)
    };
  }, [popClick]);


  return (
    <main
      className="main relative min-h-screen min-w-screen"
    >
      <div
        ref={containerRef}
        className="scroll-container relative flex flex-col overflow-y-scroll h-full gap-4 py-12 px-6"
      >
        <section className="grid bg-white grid-cols-1 font-semibold">
          <AnimatedText className="col-span-1">
            <h1 className="text-4xl font-normal mb-8">
              Best Buddies Challenge
            </h1>
          </AnimatedText>
          <AnimatedText>
            <p className="text-base mb-4">
              This past year I tore my meniscus, and I've been unable to run. I've taken up cycling.
              Cycling has given me an outlet, both physical and mental that I am so so glad to have. It keeps me focused, fit, and out of trouble (mostly).
            </p>
          </AnimatedText>
          <AnimatedText>
            <p className="text-base mb-4">
              It has also provided me a second identity (although my running identity will never be replaced), and a group to hang out with. I started riding recently and felt so welcomed into the group I now ride with.
            </p>
          </AnimatedText>
          <AnimatedText>
            <p className="text-base mb-4">
              This September, I'll be riding 100 miles through New York City as part of the Best <span className="text-pink11">Buddies</span> Challenge.
            </p>
          </AnimatedText>

          <AnimatedText>
            <p className="text-base mb-4">
              <span className="text-pink11">Best Buddies International</span> is the largest organization dedicated to ending the social, physical and economic isolation of the 200 million people worldwide with intellectual and developmental disabilities (IDD).
            </p>
          </AnimatedText>
          <AnimatedText>
            <p className="text-base mb-4">
              I'm fundraising to support <span className="text-pink11">Best Buddies'</span> programs that create opportunities for one-to-one friendships, integrated employment, inclusive living, leadership development, and family support for people with IDD. <a className="text-gray-400" href="https://www.bestbuddies.org/about-us/where-the-dollar-goes/">How they spend their money</a>
            </p>
          </AnimatedText>
          <AnimatedText>
            <p className="text-base">
              Running and cycling have given me a place to belong, and I want to support <span className="text-pink11">Best Buddies</span> mission to do the same for others.
            </p>
          </AnimatedText>

        </section>

        <div
          className="w-screen my-4 -mx-6"
          style={{ zIndex: 90 }}
        >
          <img src={courseProfileSvg.src} alt="Course Profile" className="w-screen h-full object-cover" />

        </div>

        <section className="grid bg-white grid-cols-1 font-semibold">
          <AnimatedText className="col-span-1">
            <h2 className="text-4xl text-pink- font-normal mb-8 text-gray-800">
              Fundraising
            </h2>
          </AnimatedText>
          <AnimatedText className="col-span-1">
            <p className="text-base mb-4">
              My fundraising goal is $1,800, and I should surpass that.
            </p>
          </AnimatedText>
          <AnimatedText>
            <p className="text-base mb-4">
              <span className="font-mono font-400 text-[18px]">$25</span> — Supplies training and instruction for interactive activities, lesson plans, and tool kits for school students in a Best Buddies chapter so that they can learn about acceptance and inclusion at a young age.
            </p>
          </AnimatedText>
          <AnimatedText>
            <p className="text-base mb-4">
              <span className="font-mono font-400 text-[18px]">$50</span> — Provides a Best Buddies Jobs participant with one hour of job coaching, where an employment candidate with IDD can practice interview skills, prepare for job readiness, or receive on-the-job support so he or she can excel in a new placement.
            </p>
          </AnimatedText>
          <AnimatedText className="col-span-1">
            <p className="text-base mb-4">
              <span className="font-mono font-400 text-[18px]">$100</span> — Funds an online e-Buddies friendship between a person with and a person without IDD. By joining e-Buddies, participants become more comfortable using technology to communicate with friends, gain computer literacy skills, and are better equipped to socialize online in the future.
            </p>
            <p className="text-base mb-4">
              <span className="font-mono font-400 text-[18px]">$250</span> — Supports a one-to-one friendship between someone with IDD and their peer, helping to build a mutually enriching connection that enhances the lives of program participants and their families.            </p>
            <p className="text-base mb-4">
              <span className="font-mono font-400 text-[18px]">$1000</span> — Gives a student leader, Ambassador, or Jobs participant the opportunity to attend the annual Best Buddies Leadership Conference, where they will learn how to become an advocate for the IDD community.            </p>
          </AnimatedText>
          <div className="col-span-1 mt-8">
            <DonationCard campaignData={campaignData} />
          </div>
        </section>
      </div>
    </main >
  );
}
