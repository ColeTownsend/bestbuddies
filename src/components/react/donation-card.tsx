import { motion } from "motion/react";
import { SendIcon } from "./send-icon";

interface CampaignData {
  currentAmount: number;
  goalAmount: number;
  supporters: string[];
  supportersCount: number;
}

interface DonationCardProps {
  campaignData?: CampaignData;
}

// Fallback data in case props aren't provided
const FALLBACK_DATA: CampaignData = {
  currentAmount: 200,
  goalAmount: 1800,
  supporters: [
    "COLE TOWNSEND",
    "BARBARA TOWNSEND",
    "MICHAEL CHEN"
  ],
  supportersCount: 20
};

export default function DonationCard({ campaignData }: DonationCardProps) {
  const data = campaignData || FALLBACK_DATA;
  const { currentAmount, goalAmount, supporters, supportersCount } = data;

  return (
    <div className="bg-neutral-100 rounded-lg p-6 flex flex-col">
      {/* Header with donate text and send button */}
      <div className="flex justify-between items-start mb-6">
        <span className="text-neutral-400 text-sm font-mono font-medium uppercase tracking-wide">
          Donate
        </span>
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
              if (error.name !== 'AbortError') {
                console.error('Share failed:', error);
                // Fallback to opening link
                window.open(shareData.url, '_blank', 'noopener,noreferrer');
              }
            }
          }}
          whileHover={{ rotate: 15 }}
          whileTap={{ rotate: 30 }}
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
            <div className="p-2 space-y-1 supporters-list">
              {supporters.map((supporter, index) => (
                <div
                  key={index}
                  className="text-gray-900 rounded-2 font-medium text-sm py-1 px-2 transition-colors"
                >
                  {supporter}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Donation button */}
        <motion.a
          href="https://go.twnsnd.co/bbnyc-2025"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
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
    </div>
  );
}