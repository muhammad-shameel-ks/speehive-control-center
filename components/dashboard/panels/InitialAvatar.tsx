export function InitialAvatar({
  name,
  rounded = "full",
  className = "",
}: {
  name: string;
  rounded?: "full" | "md";
  className?: string;
}) {
  return (
    <div
      className={`h-7 w-7 flex items-center justify-center bg-muted text-[11px] font-semibold text-muted-foreground ${rounded === "full" ? "rounded-full" : "rounded-md"} ${className}`}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
