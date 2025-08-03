
'use client';

import React, { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RewardedAdProps {
  onComplete: (rewarded: boolean) => void;
}

const RewardedAd: React.FC<RewardedAdProps> = ({ onComplete }) => {
  const adSlotRef = useRef<googletag.Slot | null>(null);
  const isRewardedRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    // Ensure this runs only once per mount
    if (adSlotRef.current) {
        return;
    }

    // Test Ad Unit ID, replace with your own.
    const adUnitPath = '/22639388115/rewarded_web_example';

    const rewardedSlotReady = (event: googletag.events.RewardedSlotReadyEvent) => {
      // Show the ad as soon as it's ready
      event.makeRewardedVisible();
    };

    const rewardedSlotGranted = (event: googletag.events.RewardedSlotGrantedEvent) => {
      // The user has been rewarded.
      isRewardedRef.current = true;
    };

    const rewardedSlotClosed = () => {
      // The ad is closed by the user.
      // Pass the reward status back to the main page.
      onComplete(isRewardedRef.current);
      
      // Clean up listeners and destroy the slot to prevent memory leaks
      // and allow a new ad to be requested next time.
      window.googletag.cmd.push(() => {
        if (adSlotRef.current) {
          googletag.pubads().removeEventListener('rewardedSlotReady', rewardedSlotReady);
          googletag.pubads().removeEventListener('rewardedSlotGranted', rewardedSlotGranted);
          googletag.pubads().removeEventListener('rewardedSlotClosed', rewardedSlotClosed);
          googletag.destroySlots([adSlotRef.current]);
          adSlotRef.current = null;
        }
      });
    };

    window.googletag.cmd.push(() => {
      googletag.pubads().addEventListener('rewardedSlotReady', rewardedSlotReady);
      googletag.pubads().addEventListener('rewardedSlotGranted', rewardedSlotGranted);
      googletag.pubads().addEventListener('rewardedSlotClosed', rewardedSlotClosed);

      // Define the out-of-page ad slot.
      const rewardedSlot = googletag.defineOutOfPageSlot(adUnitPath, googletag.enums.OutOfPageFormat.REWARDED);
      
      if (!rewardedSlot) {
        console.error('Failed to create rewarded ad slot.');
        toast({
          variant: 'destructive',
          title: 'Ad Error',
          description: 'Could not load the ad. Please try again later.',
        });
        onComplete(false); // Signal failure
        return;
      }

      rewardedSlot.addService(googletag.pubads());
      adSlotRef.current = rewardedSlot;
      
      googletag.enableServices();
      googletag.display(rewardedSlot);
    });

    // Fallback cleanup in case the component unmounts unexpectedly
    return () => {
      window.googletag.cmd.push(() => {
        if (adSlotRef.current) {
            googletag.pubads().removeEventListener('rewardedSlotReady', rewardedSlotReady);
            googletag.pubads().removeEventListener('rewardedSlotGranted', rewardedSlotGranted);
            googletag.pubads().removeEventListener('rewardedSlotClosed', rewardedSlotClosed);
            googletag.destroySlots([adSlotRef.current]);
            adSlotRef.current = null;
        }
      });
    };
  }, [onComplete, toast]);

  // The rewarded ad is an out-of-page (interstitial) ad,
  // so it doesn't need a visible container div.
  return null;
};

export default RewardedAd;
