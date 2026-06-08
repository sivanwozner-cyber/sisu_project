/**
 * Animated "aurora" backdrop — a fixed full-screen layer of drifting gradient
 * blobs on a near-black base, in the brand teal/blue/violet palette. Pure CSS;
 * no client JS. Sits behind all content (-z-10). Honors prefers-reduced-motion
 * via the global media query in globals.css (animations collapse to static).
 */
export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Deep base wash */}
      <div className="absolute inset-0 bg-aurora-radial" />

      {/* Drifting color blobs */}
      <div className="absolute -right-32 -top-40 h-[36rem] w-[36rem] rounded-full bg-aurora-teal/25 blur-[120px] animate-aurora" />
      <div className="absolute -left-24 top-1/4 h-[32rem] w-[32rem] rounded-full bg-aurora-violet/25 blur-[130px] animate-aurora-slow" />
      <div className="absolute bottom-[-12rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-aurora-blue/20 blur-[140px] animate-float" />
      <div className="absolute right-1/4 top-1/2 h-72 w-72 rounded-full bg-aurora-cyan/15 blur-[110px] animate-float [animation-delay:2s]" />

      {/* Subtle grain to break up banding */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
