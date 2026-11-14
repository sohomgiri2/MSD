import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

let lenis: Lenis | null = null;
let raf: ((t: number) => void) | null = null;

/** Smooth scrolling (Lenis) synced with GSAP ScrollTrigger. Disabled for reduced-motion / low performance. */
export function setSmoothScroll(enabled: boolean) {
  if (enabled && !lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on("scroll", ScrollTrigger.update);
    raf = (t: number) => lenis?.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
  } else if (!enabled && lenis) {
    if (raf) gsap.ticker.remove(raf);
    lenis.destroy();
    lenis = null;
    raf = null;
  }
}

export function scrollToTop(immediate = true) {
  if (lenis) lenis.scrollTo(0, { immediate });
  window.scrollTo(0, 0);
}

export function scrollToEl(el: Element | null) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -90 });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function pauseScroll(p: boolean) {
  if (!lenis) return;
  if (p) lenis.stop();
  else lenis.start();
}
