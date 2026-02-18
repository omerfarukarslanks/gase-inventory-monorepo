import { useEffect, useState } from "react";

/**
 * Returns true when the viewport matches the given media query.
 * Defaults to "(min-width: 768px)" (the md breakpoint).
 */
export function useMediaQuery(query = "(min-width: 768px)"): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = (e: MediaQueryListEvent | MediaQueryList) =>
      setMatches(e.matches);
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return matches;
}
