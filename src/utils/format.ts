export function formatGigabytes(bytes: number) {
  return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
}
