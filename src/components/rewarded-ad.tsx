
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
    // Prevent running this effect multiple times
    if (adSlotRef.current) {
        return;
    }

    const adUnitPath = '/22639388115/rewarded_web_example';

    const rewardedSlotReady = (event: googletag.events.RewardedSlotReadyEvent) => {
      // This is called when the ad is ready to be shown.
      event.makeRewardedVisible();
    };

    const rewardedSlotGranted = (event: googletag.events.RewardedSlotGrantedEvent) => {
      // This is called when the user has earned the reward.
      // The grant may happen before the ad is even closed.
      isRewardedRef.current = true;
    };

    const rewardedSlotClosed = () => {
      // This is called when the user closes the ad.
      // We now call the onComplete callback with the reward status.
      onComplete(isRewardedRef.current);
      
      // Clean up listeners and destroy the slot. This is crucial.
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
      // Add the event listeners.
      googletag.pubads().addEventListener('rewardedSlotReady', rewardedSlotReady);
      googletag.pubads().addEventListener('rewardedSlotGranted', rewardedSlotGranted);
      googletag.pubads().addEventListener('rewardedSlotClosed', rewardedSlotClosed);

      // Define the ad slot.
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
      
      // Enable services and display the ad.
      googletag.enableServices();
      googletag.display(rewardedSlot);
    });

    // Return a cleanup function to be safe.
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

  return null; // This component does not render anything itself.
};

export default RewardedAd;
