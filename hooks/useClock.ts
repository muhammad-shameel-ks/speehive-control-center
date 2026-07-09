"use client";

import { useEffect, useState } from "react";

export function useClock(): Date | null {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return currentTime;
}
