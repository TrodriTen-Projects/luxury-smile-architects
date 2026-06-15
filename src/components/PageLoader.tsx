export function PageLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-5">
        <span
          className="font-serif text-3xl text-foreground"
          style={{ fontVariationSettings: '"opsz" 144, "wght" 360' }}
        >
          Luxury Smile
        </span>
        <div className="h-px w-24 overflow-hidden bg-border">
          <div className="h-full w-1/2 animate-marquee bg-gradient-to-r from-transparent via-gold to-transparent" />
        </div>
      </div>
    </div>
  );
}
