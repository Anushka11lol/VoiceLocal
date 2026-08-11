export function Waveform({ bars = 28, active = false, className = "" }) {
  return (
    <div className={`flex items-end gap-[3px] h-10 ${className}`} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full ${active ? "wave-bar bg-pink-400" : "bg-pink-200"}`}
          style={{
            height: `${20 + Math.abs(Math.sin(i * 0.9)) * 80}%`,
            animationDelay: `${(i % 8) * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}
