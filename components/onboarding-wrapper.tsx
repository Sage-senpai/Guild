"use client";

import { useEffect } from "react";
import { OnboardingModal, useOnboarding } from "@/components/onboarding-modal";
import { GuidedTour, useTour } from "@/components/guided-tour";

export function OnboardingWrapper() {
  const { showOnboarding, setShowOnboarding, hasCompleted: onboardingDone } = useOnboarding();
  const { showTour, startTour, closeTour } = useTour();

  // Auto-show onboarding on first visit
  useEffect(() => {
    if (!onboardingDone) {
      setShowOnboarding(true);
    }
  }, [onboardingDone, setShowOnboarding]);

  function handleOnboardingClose() {
    setShowOnboarding(false);
    // Start the guided tour after onboarding completes
    setTimeout(() => startTour(), 500);
  }

  return (
    <>
      <OnboardingModal open={showOnboarding} onClose={handleOnboardingClose} />
      <GuidedTour open={showTour} onClose={closeTour} />
    </>
  );
}
