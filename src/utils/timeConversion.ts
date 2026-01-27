export const secondsToHMS = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { h, m, s };
};

export const hmsToSeconds = (h: string, m: string, s: string) =>
  (parseInt(h) || 0) * 3600 + (parseInt(m) || 0) * 60 + (parseInt(s) || 0);