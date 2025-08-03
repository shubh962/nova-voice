
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
    if (adSlotRef.current) {
        return;
    }

    const adUnitPath = '/22639388115/rewarded_web_example';

    const rewardedSlotReady = (event: googletag.events.RewardedSlotReadyEvent) => {
      event.makeRewardedVisible();
    };

    const rewardedSlotGranted = (event: googletag.events.RewardedSlotGrantedEvent) => {
      isRewardedRef.current = true;
    };

    const rewardedSlotClosed = () => {
      onComplete(isRewardedRef.current);
      
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

      const rewardedSlot = googletag.defineOutOfPageSlot(adUnitPath, googletag.enums.OutOfPageFormat.REWARDED);
      
      if (!rewardedSlot) {
        console.error('Failed to create rewarded ad slot.');
        toast({
          variant: 'destructive',
          title: 'Ad Error',
          description: 'Could not load the ad. Please try again later.',
        });
        onComplete(false);
        return;
      }

      rewardedSlot.addService(googletag.pubads());
      adSlotRef.current = rewardedSlot;
      
      googletag.enableServices();
      googletag.display(rewardedSlot);
    });

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

  return null;
};

export default RewardedAd;
