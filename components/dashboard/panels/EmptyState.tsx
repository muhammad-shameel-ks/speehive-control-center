export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center py-12">
      <p className="text-[12px] text-muted-foreground">{message}</p>
    </div>
  );
}
