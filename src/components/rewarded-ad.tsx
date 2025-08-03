
'use client';

import React, { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RewardedAdProps {
  onReward: () => void;
  onClose: () => void;
}

const RewardedAd: React.FC<RewardedAdProps> = ({ onReward, onClose }) => {
  const adSlotRef = useRef<googletag.Slot | null>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Test Ad Unit ID, replace with your own
    const adUnitPath = '/6355419/Travel/Europe/France/Paris';

    window.googletag.cmd.push(() => {
      // Check if container is not already occupied
      if (adContainerRef.current && adContainerRef.current.children.length > 0) {
        return;
      }

      const rewardedSlot = googletag.defineRewardedSlot(adUnitPath, [320, 50]);
      if (!rewardedSlot) {
        console.error('Failed to create rewarded ad slot.');
        toast({
          variant: 'destructive',
          title: 'Ad Error',
          description: 'Could not load the ad. Please try again later.',
        });
        onClose();
        return;
      }

      rewardedSlot.addService(googletag.pubads());
      adSlotRef.current = rewardedSlot;

      const handleRewarded = (event: googletag.events.Reward) => {
        if (event.reward) {
          onReward();
        } else {
          toast({
            variant: 'destructive',
            title: 'Ad Not Completed',
            description: 'You must watch the full ad to get the reward.',
          });
          onClose();
        }
      };

      const handleSlotClosed = () => {
        onClose();
        destroyAd();
      };

      googletag.pubads().addEventListener('rewardedSlotGranted', handleRewarded);
      googletag.pubads().addEventListener('rewardedSlotClosed', handleSlotClosed);
      
      googletag.enableServices();
      googletag.display(rewardedSlot);
    });

    const destroyAd = () => {
      if (adSlotRef.current) {
        googletag.destroySlots([adSlotRef.current]);
        adSlotRef.current = null;
      }
    };

    return () => {
      destroyAd();
      // Remove event listeners
      // Note: GPT API doesn't provide a direct way to remove specific event listeners.
      // Re-architecting to handle multiple listeners is complex for this use case.
      // The current approach assumes a single rewarded ad context at a time.
    };
  }, [onReward, onClose, toast]);

  return <div ref={adContainerRef}></div>;
};

export default RewardedAd;
