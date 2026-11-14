import { useEffect, useState } from "react";
import { getMissionTime, MISSION_START_SECONDS } from "../data/missionTime.js";

export default function MissionTimer({ startedAt }) {
  const [totalSeconds, setTotalSeconds] = useState(
    () => MISSION_START_SECONDS + Math.floor((Date.now() - startedAt) / 1000),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTotalSeconds(MISSION_START_SECONDS + Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  const { days, clock } = getMissionTime(totalSeconds);

  return (
    <div className="mission-timer" role="timer" aria-live="off">
      <span className="mission-timer-name">Mission Andromeda</span>{" "}
      <span className="mission-timer-days">{days} Days</span>{" "}
      <span className="mission-timer-clock">{clock}</span>
    </div>
  );
}
