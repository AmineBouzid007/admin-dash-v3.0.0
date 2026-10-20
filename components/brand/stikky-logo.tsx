/**
 * Stikky brand marks, rendered as CSS masks so they inherit `currentColor`.
 * Color them with a text utility (e.g. `text-foreground`, `text-white`) and they
 * follow light/dark mode automatically — no separate light/dark image files.
 *
 *  - "wordmark": the plain "Stikky" lettering (navbar, footer)
 *  - "icon":     the framed "S" (admin dashboard, small/square placements)
 *
 * Size with a height class (e.g. `h-7`); width is derived from the aspect ratio.
 */
const MARKS = {
  wordmark: { src: "/brand/stikky-wordmark.png", ratio: 429 / 162 },
  icon: { src: "/brand/stikky-icon.png", ratio: 1 },
} as const;

interface StikkyLogoProps {
  variant?: keyof typeof MARKS;
  className?: string;
  label?: string;
}

export function StikkyLogo({
  variant = "wordmark",
  className = "",
  label = "Stikky",
}: StikkyLogoProps) {
  const { src, ratio } = MARKS[variant];
  const mask = `url(${src}) center / contain no-repeat`;
  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{ aspectRatio: ratio, WebkitMask: mask, mask }}
    />
  );
}
