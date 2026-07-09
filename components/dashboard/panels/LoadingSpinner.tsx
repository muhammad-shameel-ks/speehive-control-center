export function LoadingSpinner() {
  return (
    <div className="flex h-full items-center justify-center py-16">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}
