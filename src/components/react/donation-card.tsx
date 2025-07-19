import { AnimatePresence, motion, useInView } from "motion/react";
import { SendIcon } from "./send-icon";
import React from "react";

interface CampaignData {
  currentAmount: number;
  goalAmount: number;
  supporters: string[];
  supportersCount: number;
}

interface DonationCardProps {
  campaignData?: CampaignData;
  onHoverChange?: (isHovered: boolean) => void;
  isHovered?: boolean;
}

// Fallback data in case props aren't provided
const FALLBACK_DATA: CampaignData = {
  currentAmount: 200,
  goalAmount: 1800,
  supporters: [
    "COLE TOWNSEND",
  ],
  supportersCount: 1
};

export default function DonationCard({ campaignData, onHoverChange, isHovered }: DonationCardProps) {
  const data = FALLBACK_DATA;
  const { currentAmount, goalAmount, supporters, supportersCount } = data;
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: false, margin: "40px" });

  return (
    <motion.div
      ref={ref}
      className="bg-neutral-100 rounded-lg p-6 flex flex-col relatibe z-[1000]"
      onHoverStart={() => onHoverChange?.(true)}
      onHoverEnd={() => onHoverChange?.(false)}
    >
      {/* Header with donate text and send button */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2">
          <span className="text-neutral-400 text-sm font-mono font-medium uppercase tracking-wide">
            Donate
          </span>
          {/* Marker that appears when hovering */}
          {isHovered && (
            <AnimatePresence>
              <motion.span
                layoutId="minimap-marker"
                className="block"
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "var(--color-pink11)",
                }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 30 }}
              />
            </AnimatePresence>
          )}
        </div>
        <motion.button
          onClick={async () => {
            const shareData = {
              title: "Support Cole's Fundraiser",
              text: "Help me reach my fundraising goal for Best Buddies!",
              url: "http://engdr.co/1-5357890"
            };

            try {
              if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
              } else {
                // Fallback: copy to clipboard or open in new tab
                if (navigator.clipboard) {
                  await navigator.clipboard.writeText(shareData.url);
                  alert("Link copied to clipboard!");
                } else {
                  window.open(shareData.url, '_blank', 'noopener,noreferrer');
                }
              }
            } catch (error) {
              // User cancelled or error occurred
              if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Share failed:', error);
                // Fallback to opening link
                window.open(shareData.url, '_blank', 'noopener,noreferrer');
              }
            }
          }}
          whileHover={{ rotate: 15 }}
          whileTap={{ rotate: 45, color: 'black' }}
          className="text-neutral-400 cursor-pointer hover:text-gray-800 transition-colors bg-transparent border-none p-0"
        >
          <SendIcon />
        </motion.button>
      </div>

      {/* Large donation amount */}
      <div className="mb-2">
        <div className="text-6xl font-normal text-black font-mono leading-none">
          ${currentAmount.toLocaleString()}
        </div>
      </div>

      {/* Progress information */}
      <div className="mb-8">
        <div className="text-sm font-mono text-neutral-400 uppercase tracking-wide font-medium">
          PLEDGED OF ${goalAmount.toLocaleString()} GOAL
        </div>
      </div>

      {/* Supporters section */}
      <div className="flex-1 font-mono uppercase flex flex-col">
        <div className="flex justify-between items-center">
          <div className="text-sm text-neutral-400 uppercase tracking-wide font-medium mb-4">
            SUPPORTERS
          </div>

          <div className="text-sm text-neutral-400 uppercase tracking-wide font-medium mb-3 text-right">
            {supportersCount} SUPPORTERS
          </div>
        </div>

        {/* Scrollable supporters list - showing 3 latest */}
        <div className="mb-4">
          <div
            className="h-28 overflow-y-auto bg-white rounded border border-neutral-200 scrollbar-thin scrollbar-track-neutral-100 scrollbar-thumb-neutral-300"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f5f5f5'
            }}
          >
            <motion.div layout className="p-2 space-y-1 supporters-list">
              {/* Animated "Possibly you" supporter */}
              <AnimatePresence>
                {isInView && (
                  <motion.div
                    initial={{ opacity: 0, filter: 'blur(10px)' }}
                    animate={{
                      opacity: 1,
                      filter: 'blur(0px)',
                      display: 'block',
                      transition: {
                        duration: 0.3,
                        delay: 0.5,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }
                    }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="text-pink-600 rounded-2 font-medium text-sm py-1 px-2"
                  >
                    Possibly you
                  </motion.div>
                )}
              </AnimatePresence>
              {supporters.map((supporter, index) => (
                <AnimatePresence>
                  <div
                    key={index}
                    className="text-gray-900 rounded-2 font-medium text-sm py-1 px-2 transition-colors"
                  >
                    {supporter}
                  </div>
                </AnimatePresence>
              ))}

            </motion.div>
          </div>
        </div>

        {/* Donation button */}
        <motion.a
          href="https://go.twnsnd.co/bbnyc-2025"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="text-white block w-full antialiased text-center font-mono uppercase tracking-wide transition-colors"
          style={{
            height: '44px',
            background: '#FF0D8A',
            border: '1px solid rgba(0, 0, 0, 0.15)',
            boxShadow: 'inset 0px -1px 3px rgba(0, 0, 0, 0.1), inset 0px 1px 4px 1px rgba(0, 0, 0, 0.05), inset 0px 1px 1px rgba(255, 255, 255, 0.5)',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          Make a donation
        </motion.a>
      </div>
    </motion.div>
  );
}