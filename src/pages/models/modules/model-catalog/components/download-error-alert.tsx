export function DownloadErrorAlert({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-6 rounded bg-muted p-4 text-sm text-ink" role="alert">{message}</p>;
}
