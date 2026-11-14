export const MISSION_START_SECONDS = 20 * 86400 + 12 * 3600 + 2 * 60 + 1;

export function getMissionTime(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    clock: [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":"),
  };
}
