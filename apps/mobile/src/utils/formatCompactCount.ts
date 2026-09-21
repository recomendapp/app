export const formatCompactCount = (count: number) => {
  if (count < 1_000) return `${count}`;

  const units = ['k', 'M', 'B', 'T'];
  const unitIndex = Math.min(Math.floor(Math.log(count) / Math.log(1_000)) - 1, units.length - 1);
  const divisor = 1_000 ** (unitIndex + 1);

  return `${Math.floor(count / divisor)}${units[unitIndex]}`;
};
