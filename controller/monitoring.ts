// Requests per second
let currentSecond = 0;
let currentCount = 0;
let lastSecondCount = 0;

// Requests per hour (Map: minute absolue -> count)
const minuteBuckets = new Map<number, number>();

export const recordRequest = (): void => {
  const now = Math.floor(Date.now() / 1000);
  const minute = Math.floor(now / 60);

  // Per second tracking
  if (now === currentSecond) {
    currentCount++;
  } else {
    lastSecondCount = now === currentSecond + 1 ? currentCount : 0;
    currentSecond = now;
    currentCount = 1;
  }

  // Per minute tracking
  const currentMinuteCount = minuteBuckets.get(minute) || 0;
  if (currentMinuteCount === 0) {
    cleanup(minute);
  }
  minuteBuckets.set(minute, currentMinuteCount + 1);
};

const cleanup = (currentMinute: number): void => {
  const cutoff = currentMinute - 60;
  for (const minute of minuteBuckets.keys()) {
    if (minute < cutoff) {
      minuteBuckets.delete(minute);
    }
  }
};

export const getRequestsPerSecond = (): number => {
  return lastSecondCount;
};

export const getRequestsPerHour = (): number => {
  const now = Math.floor(Date.now() / 1000);
  const minute = Math.floor(now / 60);
  const cutoff = minute - 60;

  let total = 0;
  for (const [m, count] of minuteBuckets) {
    if (m >= cutoff) {
      total += count;
    }
  }
  return total;
};
