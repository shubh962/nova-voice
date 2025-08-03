
'use client';

import React, { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RewardedAdProps {
  onReward: () => void;
  onClose: () => void;
}

const RewardedAd: React.FC<RewardedAdProps> = ({ onReward, onClose }) => {
  const adSlotRef = useRef<googletag.Slot | null>(null);
  const adContainerRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Test Ad Unit ID, replace with your own. This is for a rewarded ad.
    const adUnitPath = '/22639388115/rewarded_web_example';

    const rewardedSlotApiReady = (event: googletag.events.RewardedSlotReadyEvent) => {
        event.makeRewardedVisible();
    };

    const handleRewarded = (event: googletag.events.RewardedSlotGrantedEvent) => {
      if (event.reward) {
        onReward();
      } else {
        toast({
          variant: 'destructive',
          title: 'Ad Not Completed',
          description: 'You must watch the full ad to get the reward.',
        });
      }
      onClose(); // Always close after grant event
    };

    const handleSlotClosed = () => {
      onClose();
    };

    window.googletag.cmd.push(() => {
      googletag.pubads().addEventListener('rewardedSlotReady', rewardedSlotApiReady);
      googletag.pubads().addEventListener('rewardedSlotGranted', handleRewarded);
      googletag.pubads().addEventListener('rewardedSlotClosed', handleSlotClosed);

      // defineOutOfPageSlot is the correct method for web rewarded ads.
      const rewardedSlot = googletag.defineOutOfPageSlot(adUnitPath, googletag.enums.OutOfPageFormat.REWARDED);
      
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
      
      googletag.enableServices();
      googletag.display(rewardedSlot);
    });

    const destroyAd = () => {
        if (adSlotRef.current) {
            window.googletag.cmd.push(() => {
                googletag.pubads().removeEventListener('rewardedSlotReady', rewardedSlotApiReady);
                googletag.pubads().removeEventListener('rewardedSlotGranted', handleRewarded);
                googletag.pubads().removeEventListener('rewardedSlotClosed', handleSlotClosed);
                googletag.destroySlots([adSlotRef.current]);
                adSlotRef.current = null;
            });
        }
    };

    return () => {
      destroyAd();
    };
  }, [onReward, onClose, toast]);

  // The rewarded ad is an out-of-page (interstitial) ad, 
  // so it doesn't need a visible container div.
  return null;
};

export default RewardedAd;
