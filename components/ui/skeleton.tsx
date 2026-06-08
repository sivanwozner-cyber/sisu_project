import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shimmer rounded-lg border border-white/5 bg-white/[0.04]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
