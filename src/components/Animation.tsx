import { useEffect, useRef, useState } from "react";
import green from "../assets/AirpodGreen.png";
import black from "../assets/airpodBlack.png";
import white from "../assets/airpodWhite.png";
import blue from "../assets/airpodBlue.png";
import red from "../assets/airpodRed.png";

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  /** Transparent PNG/WebP of the headphone. If omitted, a placeholder SVG is drawn. */
  image?: string;
  /** Background colour for this slide (hex). */
  bg: string;
  /** Colour used by the placeholder SVG only. */
  tint: string;
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "green",
    title: "Apple Airpods Max Wireless Over - Ear Headphones",
    description:
      "Lorem ipsum dolor sit amet consectetur. Varius sollicitudin commodo pharetra molestie est accumsan in locus lacus. Metus laoreet ultricies elit wisi nictum dictum.",
    price: "$479.00",
    bg: "#5fbf87",
    tint: "#8fc9a3",
    image: green,
  },
  {
    id: "space-gray",
    title: "Apple Airpods Max Wireless Over - Ear Headphones",
    description:
      "Lorem ipsum dolor sit amet consectetur. Varius sollicitudin commodo pharetra molestie est accumsan in locus lacus. Metus laoreet ultricies elit wisi nictum dictum.",
    price: "$479.00",
    bg: "#3b3b3d",
    tint: "#2b2b2d",
    image: black
  },
  {
    id: "silver",
    title: "Apple Airpods Max Wireless Over - Ear Headphones",
    description:
      "Lorem ipsum dolor sit amet consectetur. Varius sollicitudin commodo pharetra molestie est accumsan in locus lacus. Metus laoreet ultricies elit wisi nictum dictum.",
    price: "$479.00",
    bg: "#c4c5c7",
    tint: "#e3e4e6",
    image: white,
  },
  {
    id: "sky-blue",
    title: "Apple Airpods Max Wireless Over - Ear Headphones",
    description:
      "Lorem ipsum dolor sit amet consectetur. Varius sollicitudin commodo pharetra molestie est accumsan in locus lacus. Metus laoreet ultricies elit wisi nictum dictum.",
    price: "$479.00",
    bg: "#1f4c6b",
    tint: "#5b86a8",
    image: blue,
  },
  {
    id: "red",
    title: "Apple Airpods Max Wireless Over - Ear Headphones",
    description:
      "Lorem ipsum dolor sit amet consectetur. Varius sollicitudin commodo pharetra molestie est accumsan in locus lacus. Metus laoreet ultricies elit wisi nictum dictum.",
    price: "$479.00",
    bg: "#e8574f",
    tint: "#d9443d",
    image: red,
  },
];

/* ---------- slot layout (in % of the stage, relative to its centre) ---------- */
interface Pose {
  x: number; // % of stage width
  y: number; // % of stage height
  scale: number;
  blur: number; // px
  opacity: number;
}
// slot 0 = main / centre-right, 1 = top-right (blurred), 2 = bottom-right (blurred)
const SLOTS: Pose[] = [
  { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 },
  { x: 38, y: -34, scale: 0.42, blur: 10, opacity: 0.85 },
  { x: 40, y: 38, scale: 0.42, blur: 10, opacity: 0.85 },
];

// off-screen "parking" poses used when there are more than 3 headphones
const HIDE_TOP: Pose = { x: 52, y: -62, scale: 0.3, blur: 14, opacity: 0 };
const HIDE_BOTTOM: Pose = { x: 52, y: 64, scale: 0.3, blur: 14, opacity: 0 };

interface Layout {
  slots: Pose[];
  hideTop: Pose;
  hideBottom: Pose;
}
const DESKTOP: Layout = { slots: SLOTS, hideTop: HIDE_TOP, hideBottom: HIDE_BOTTOM };
// phone: headphone stack sits in the top half, copy underneath
const MOBILE: Layout = {
  slots: [
    { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 },
    { x: 33, y: -40, scale: 0.4, blur: 8, opacity: 0.8 },
    { x: 33, y: 42, scale: 0.4, blur: 8, opacity: 0.8 },
  ],
  hideTop: { x: 46, y: -62, scale: 0.28, blur: 12, opacity: 0 },
  hideBottom: { x: 46, y: 64, scale: 0.28, blur: 12, opacity: 0 },
};

/** true below Tailwind's `md` breakpoint (768px) */
function useIsMobile() {
  const query = "(max-width: 767px)";
  const [m, setM] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return m;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: Pose, b: Pose, t: number): Pose => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  scale: lerp(a.scale, b.scale, t),
  blur: lerp(a.blur, b.blur, t),
  opacity: lerp(a.opacity, b.opacity, t),
});

/**
 * r is the item's position on the closed cycle [0, n):
 *   0 → 1        centre → top-right (blurred)
 *   1 → 2        top-right → fades out        (n > 3)
 *   n-2 → n-1    fades in → bottom-right      (n > 3)
 *   n-1 → n      bottom-right → centre
 * With exactly 3 items, top-right → bottom-right is a single leg.
 * Because the cycle is closed, the leaving item travels centre → bottom-right.
 */
function poseAt(r: number, n: number, L: Layout): Pose {
  const S = L.slots;
  if (r <= 1) return mix(S[0], S[1], r);
  if (n <= 3) {
    return r <= 2 ? mix(S[1], S[2], r - 1) : mix(S[2], S[0], r - 2);
  }
  if (r <= 2) return mix(S[1], L.hideTop, r - 1);
  if (r >= n - 1) return mix(S[2], S[0], r - (n - 1));
  if (r >= n - 2) return mix(L.hideBottom, S[2], r - (n - 2));
  return L.hideTop;
}

/* ---------- colour helpers ---------- */
const hexToRgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mixHex = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`;
};

/* ---------- social icons (use currentColor so they follow the text colour) ---------- */
function LinkedInIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M15.3369 15.3372H12.6698V11.1604C12.6698 10.1644 12.652 8.88221 11.2827 8.88221C9.89359 8.88221 9.68107 9.96739 9.68107 11.0879V15.3369H7.01403V6.74767H9.57438V7.92149H9.61022C9.86645 7.48337 10.2367 7.12295 10.6816 6.87862C11.1264 6.63429 11.6292 6.5152 12.1364 6.53402C14.8396 6.53402 15.338 8.31211 15.338 10.6253L15.3369 15.3372ZM4.00472 5.57358C3.69861 5.57363 3.39936 5.48291 3.14481 5.31289C2.89026 5.14286 2.69184 4.90117 2.57465 4.61837C2.45746 4.33558 2.42675 4.02438 2.48641 3.72413C2.54608 3.42388 2.69344 3.14807 2.90985 2.93157C3.12626 2.71507 3.40201 2.56761 3.70223 2.50784C4.00244 2.44806 4.31364 2.47866 4.59647 2.59575C4.8793 2.71285 5.12106 2.91119 5.29117 3.16569C5.46128 3.42019 5.5521 3.71941 5.55216 4.02553C5.5522 4.22879 5.5122 4.43006 5.43445 4.61786C5.35671 4.80566 5.24273 4.9763 5.09904 5.12005C4.95535 5.2638 4.78475 5.37784 4.59699 5.45566C4.40922 5.53347 4.20797 5.57354 4.00472 5.57358ZM5.33824 15.3372H2.66843V6.74767H5.33824V15.3372ZM16.6665 0.00122592H1.32824C0.980105 -0.00270291 0.644652 0.131747 0.395594 0.375031C0.146536 0.618315 0.00424879 0.95053 0 1.29867V16.7011C0.00410337 17.0494 0.146299 17.3818 0.395349 17.6254C0.644398 17.8689 0.979933 18.0036 1.32824 17.9999H16.6665C17.0155 18.0043 17.3519 17.8699 17.602 17.6264C17.852 17.3829 17.9952 17.0501 18 16.7011V1.29756C17.995 0.948728 17.8518 0.616137 17.6017 0.372858C17.3517 0.12958 17.0153 -0.00448607 16.6665 0.000114616"
        fill="currentColor"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M18 9C18 4.05 13.95 0 9 0C4.05 0 0 4.05 0 9C0 13.5 3.2625 17.2125 7.5375 17.8875V11.5875H5.2875V9H7.5375V6.975C7.5375 4.725 8.8875 3.4875 10.9125 3.4875C11.925 3.4875 12.9375 3.7125 12.9375 3.7125V5.9625H11.8125C10.6875 5.9625 10.35 6.6375 10.35 7.3125V9H12.825L12.375 11.5875H10.2375V18C14.7375 17.325 18 13.5 18 9Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** The inner camera glyph is a "cut-out", so it takes the current background colour. */
function InstagramIcon({ cutout }: { cutout: string }) {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" aria-hidden>
      <path
        d="M11.0036 0C6.41119 0 5.06809 0.00416388 4.80702 0.0231988C3.86458 0.0920515 3.27814 0.22247 2.63924 0.502045C2.14687 0.716931 1.75856 0.96602 1.37532 1.31519C0.677379 1.95197 0.254381 2.73537 0.101256 3.66659C0.0268086 4.11867 0.00515117 4.21087 0.000751995 6.52004C-0.000939994 7.28977 0.000751995 8.30278 0.000751995 9.66154C0.000751995 13.6946 0.00582797 14.8738 0.0278238 15.1028C0.103963 15.9089 0.247782 16.416 0.552341 16.9706C1.13438 18.0324 2.24602 18.8295 3.55562 19.1269C4.00908 19.2295 4.5099 19.2861 5.15286 19.3128C5.42527 19.3232 8.20183 19.3307 10.9801 19.3307C13.7583 19.3307 16.5366 19.3277 16.8022 19.3158C17.5467 19.285 17.979 19.234 18.457 19.1254C19.1063 18.9791 19.7115 18.7099 20.2302 18.3367C20.749 17.9635 21.1687 17.4953 21.4603 16.9647C21.7589 16.4234 21.9103 15.897 21.9789 15.133C21.9937 14.9665 22 12.311 22 9.65902C22 7.00662 21.9932 4.35601 21.9783 4.18946C21.909 3.41319 21.7575 2.89122 21.4493 2.33951C21.1963 1.88787 20.9154 1.5506 20.5077 1.20574C19.7801 0.59484 18.8901 0.223065 17.8294 0.0886312C17.3156 0.0233475 17.2132 0.00401517 14.5838 0H11.0036Z"
        fill="currentColor"
      />
      <path
        d="M10.998 2.5282C8.79236 2.5282 8.51555 2.53667 7.64925 2.57132C6.78464 2.60612 6.19448 2.72643 5.67808 2.90295C5.14392 3.08527 4.6908 3.32915 4.23938 3.72606C3.78762 4.12282 3.51013 4.52106 3.30202 4.99039C3.10067 5.4444 2.96362 5.96325 2.92471 6.72286C2.88613 7.48426 2.87598 7.7277 2.87598 9.66628C2.87598 11.6049 2.88579 11.8474 2.92504 12.6088C2.96481 13.3687 3.10169 13.8874 3.30236 14.3413C3.50997 14.8108 3.78745 15.209 4.23904 15.6058C4.6903 16.0028 5.14341 16.2473 5.67723 16.4296C6.19397 16.6061 6.7843 16.7264 7.64874 16.7612C8.51504 16.7959 8.79168 16.8044 10.9972 16.8044C13.203 16.8044 13.479 16.7959 14.3453 16.7612C15.2099 16.7264 15.8007 16.6061 16.3175 16.4296C16.8515 16.2473 17.3039 16.0028 17.7552 15.6058C18.2069 15.209 18.4844 14.8108 18.6925 14.3414C18.8922 13.8874 19.0292 13.3686 19.0698 12.609C19.1088 11.8476 19.1189 11.6049 19.1189 9.66628C19.1189 7.7277 19.1088 7.48441 19.0698 6.72301C19.0292 5.9631 18.8922 5.4444 18.6925 4.99054C18.4844 4.52106 18.2069 4.12282 17.7552 3.72606C17.3034 3.329 16.8516 3.08512 16.317 2.90295C15.7992 2.72643 15.2087 2.60612 14.3441 2.57132C13.4778 2.53667 13.202 2.5282 10.9957 2.5282H10.998ZM10.2695 3.81454C10.4857 3.81424 10.727 3.81454 10.998 3.81454C13.1665 3.81454 13.4235 3.82138 14.2798 3.85558C15.0717 3.88741 15.5014 4.0037 15.7877 4.1014C16.1667 4.23078 16.4369 4.38544 16.721 4.63527C17.0053 4.8851 17.1812 5.12304 17.3288 5.45615C17.4399 5.70747 17.5724 6.08519 17.6085 6.78116C17.6474 7.53363 17.6558 7.75967 17.6558 9.66464C17.6558 11.5696 17.6474 11.7957 17.6085 12.5481C17.5723 13.2441 17.4399 13.6218 17.3288 13.8731C17.1816 14.2062 17.0053 14.4434 16.721 14.6931C16.4368 14.943 16.1669 15.0976 15.7877 15.227C15.5018 15.3251 15.0717 15.4411 14.2798 15.473C13.4237 15.5072 13.1665 15.5146 10.998 15.5146C8.82941 15.5146 8.5724 15.5072 7.71625 15.473C6.9244 15.4408 6.49463 15.3245 6.20818 15.2268C5.82918 15.0975 5.55846 14.9428 5.2742 14.693C4.98995 14.4431 4.81398 14.2058 4.66644 13.8725C4.55528 13.6212 4.42279 13.2435 4.38675 12.5475C4.34784 11.7951 4.34006 11.569 4.34006 9.66286C4.34006 7.75669 4.34784 7.53184 4.38675 6.77937C4.42296 6.08341 4.55528 5.70569 4.66644 5.45407C4.81364 5.12096 4.98995 4.88302 5.2742 4.63319C5.55846 4.38336 5.82918 4.2287 6.20818 4.09902C6.49447 4.00087 6.9244 3.88488 7.71625 3.85291C8.46546 3.82317 8.75581 3.81424 10.2695 3.81276V3.81454ZM15.3333 4.99976C15.1405 4.99976 14.952 5.05 14.7918 5.14414C14.6315 5.23827 14.5066 5.37207 14.4328 5.5286C14.3591 5.68514 14.3398 5.85738 14.3774 6.02355C14.415 6.18971 14.5079 6.34234 14.6442 6.46212C14.7806 6.5819 14.9543 6.66346 15.1433 6.69648C15.3324 6.72949 15.5284 6.71249 15.7064 6.64761C15.8845 6.58273 16.0367 6.4729 16.1438 6.332C16.2508 6.1911 16.3079 6.02546 16.3078 5.85603C16.3078 5.38313 15.8713 4.99946 15.3333 4.99946V4.99976ZM10.998 6.00058C8.69473 6.00058 6.82728 7.64189 6.82728 9.66628C6.82728 11.6907 8.69473 13.3312 10.998 13.3312C13.3013 13.3312 15.1683 11.6907 15.1683 9.66628C15.1683 7.64189 13.3013 6.00058 10.998 6.00058ZM10.998 7.28692C12.4931 7.28692 13.7052 8.35213 13.7052 9.66628C13.7052 10.9803 12.4931 12.0456 10.998 12.0456C9.50282 12.0456 8.29085 10.9803 8.29085 9.66628C8.29085 8.35213 9.50282 7.28692 10.998 7.28692Z"
        fill={cutout}
      />
    </svg>
  );
}

/* ---------- placeholder headphone ---------- */
function PlaceholderHeadphone({ tint }: { tint: string }) {
  return (
    <svg viewBox="0 0 300 380" className="h-full w-full drop-shadow-2xl">
      <path
        d="M60 230 C 40 20, 260 20, 240 230"
        fill="none"
        stroke="#ececec"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <rect x="22" y="190" width="100" height="170" rx="50" fill={tint} />
      <rect x="178" y="190" width="100" height="170" rx="50" fill={tint} />
      <rect
        x="40"
        y="220"
        width="64"
        height="110"
        rx="32"
        fill="#000"
        opacity=".25"
      />
      <rect
        x="196"
        y="220"
        width="64"
        height="110"
        rx="32"
        fill="#000"
        opacity=".25"
      />
    </svg>
  );
}

/* ---------- component ---------- */
interface Props {
  products?: Product[];
  /** Scroll distance (in viewport heights) used for each transition. */
  screensPerSlide?: number;
}

export default function HeadphoneShowcase({
  products = DEFAULT_PRODUCTS,
  screensPerSlide = 1,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [t, setT] = useState(0); // fractional index in [0, N-1]
  const n = products.length;
  const isMobile = useIsMobile();
  const layout = isMobile ? MOBILE : DESKTOP;

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      setT(p * (n - 1));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [n]);

  // background: blend between neighbouring slides
  const i0 = Math.min(n - 1, Math.floor(t));
  const i1 = Math.min(n - 1, i0 + 1);
  const bg = mixHex(products[i0].bg, products[i1].bg, t - i0);
  const dark = (() => {
    const [r, g, b] = hexToRgb(products[Math.round(t)].bg);
    return (r * 299 + g * 587 + b * 114) / 1000 < 140;
  })();
  const active = Math.round(t);
  const fg = dark || active === 0 ? "text-white" : "text-neutral-900";

  return (
    <section
      ref={sectionRef}
      style={{ height: `${100 + (n - 1) * screensPerSlide * 100}vh` }}
      className="relative"
    >
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ backgroundColor: bg }}
      >
        {/* soft vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_65%_45%,rgba(255,255,255,0.18),transparent_60%)]" />

        {/* logo */}
        <div
          className={`absolute left-6 top-[4%] z-20 flex items-center gap-1 text-2xl inter-bold md:left-[6%] md:top-[9%] md:text-3xl transition-colors duration-500 ${fg}`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 fill-current md:h-10 md:w-10"
            aria-hidden
          >
            <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.800-1.400-.1-2.800.9-3.5.9-.7 0-1.800-.8-3-.8-1.500 0-3 .9-3.800 2.300-1.600 2.800-.4 7 1.200 9.300.8 1.100 1.700 2.400 2.900 2.300 1.200 0 1.600-.7 3-.7s1.800.7 3 .7c1.300 0 2.100-1.100 2.800-2.200.9-1.300 1.300-2.500 1.300-2.600-.1 0-2.500-1-2.500-3.900zM14.200 5.900c.6-.8 1.100-1.800 1-2.900-.9 0-2 .6-2.700 1.400-.6.700-1.100 1.800-1 2.800 1 .1 2-.5 2.700-1.300z" />
          </svg>
          AirPods
        </div>

        {/* text – cross-fades per slide */}
        <div className="absolute inset-x-6 top-[60%] z-20 md:inset-x-auto md:left-[6%] md:top-[36%] md:w-[34%] md:min-w-[260px]">
          {products.map((p, i) => {
            const d = Math.abs(t - i);
            const o = Math.max(0, 1 - d * 2.2);
            return (
              <div
                key={p.id}
                className={`absolute left-0 top-0 w-full transition-colors duration-500 ${fg}`}
                style={{
                  opacity: o,
                  transform: `translateY(${(i - t) * 24}px)`,
                  pointerEvents: i === active ? "auto" : "none",
                }}
              >
                <h2 className="text-2xl inter-black leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
                  {p.title}
                </h2>
                <p className="mt-2 max-w-sm inter-medium text-[11px] leading-snug opacity-90 md:mt-3 md:text-xs">
                  {p.description}
                </p>
                <p className="mt-3 text-2xl inter-black md:mt-6 md:text-3xl">{p.price}</p>
              </div>
            );
          })}
        </div>

        {/* socials */}
        <div
          className={`absolute bottom-6 left-6 z-20 flex items-center gap-3 md:bottom-[8%] md:left-[6%] transition-colors duration-500 ${fg}`}
        >
          <a href="#" aria-label="LinkedIn" className="transition-opacity hover:opacity-70">
            <LinkedInIcon />
          </a>
          <a href="#" aria-label="Facebook" className="transition-opacity hover:opacity-70">
            <FacebookIcon />
          </a>
          <a href="#" aria-label="Instagram" className="transition-opacity hover:opacity-70">
            <InstagramIcon cutout={bg} />
          </a>
        </div>

        {/* headphones stage */}
        <div className="absolute inset-x-0 top-0 h-[56%] md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[62%] md:pr-20">
          <div className="relative h-full w-full">
            {products.map((p, i) => {
              // position on the cycle: 0 = centre, 1 = top-right, 2 = bottom-right
              const r = (((i - t) % n) + n) % n;
              const pose = poseAt(r, n, layout);
              return (
                <div
                  key={p.id}
                  className="absolute left-1/2 top-1/2 h-[82%] aspect-[300/380] md:h-[98%] will-change-transform"
                  style={{
                    transform: `translate(calc(-50% + ${pose.x}% * 1.55), calc(-50% + ${pose.y}%)) scale(${pose.scale})`,
                    filter: `blur(${pose.blur}px)`,
                    opacity: pose.opacity,
                    zIndex: Math.round((1 - Math.min(r, n - r) / n) * 10),
                  }}
                >
                  {p.image ? (
                    <img
                      src={p.image}
                      alt=""
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <PlaceholderHeadphone tint={p.tint} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}