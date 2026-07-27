"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch: only read the resolved theme after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {mounted ? (
            <>
              <Sun
                className={`absolute h-4 w-4 transition-all duration-300 ${
                  isDark
                    ? "scale-0 -rotate-90 opacity-0"
                    : "scale-100 rotate-0 opacity-100"
                }`}
              />
              <Moon
                className={`absolute h-4 w-4 transition-all duration-300 ${
                  isDark
                    ? "scale-100 rotate-0 opacity-100"
                    : "scale-0 rotate-90 opacity-0"
                }`}
              />
            </>
          ) : (
            // Static placeholder before mount to prevent layout shift / hydration flash
            <Sun className="h-4 w-4 opacity-0" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isDark ? "Switch to light mode" : "Switch to dark mode"}
      </TooltipContent>
    </Tooltip>
  );
}
