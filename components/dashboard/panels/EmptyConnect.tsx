export function EmptyConnect({
  message,
  ctaLabel,
  onCta,
}: {
  message: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <p className="text-[12px] text-muted-foreground max-w-[200px]">{message}</p>
      <button
        onClick={onCta}
        className="rounded-lg border border-border bg-muted/30 hover:bg-muted/60 px-3 py-1.5 text-[12px] font-semibold text-foreground transition-colors"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
