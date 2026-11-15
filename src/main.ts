import { gsap } from "gsap";

import { getChristmasState, type ChristmasState } from "./countdown.ts";
import "./style.css";

function getElement<ElementType extends Element>(selector: string): ElementType {
  const element = document.querySelector<ElementType>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

const app = getElement<HTMLDivElement>("#app");

app.innerHTML = `
  <main class="display" aria-labelledby="display-title">
    <div class="moon" aria-hidden="true"></div>
    <div class="snow snow--far" aria-hidden="true"></div>
    <div class="snow snow--near" aria-hidden="true"></div>

    <section class="countdown" aria-live="polite" aria-atomic="true">
      <p class="kicker">Christmas is coming</p>
      <h1 id="display-title">The North Pole Express</h1>
      <div class="rule" aria-hidden="true"><span>✦</span></div>
      <div class="countdown-stage">
        <p class="countdown-value" id="countdown-value">—</p>
        <div class="celebration" aria-hidden="true"></div>
      </div>
      <p class="countdown-label" id="countdown-label">Days until Christmas</p>
      <time class="christmas-date" id="christmas-date">December 25</time>
    </section>

    <div class="snowbank snowbank--back" aria-hidden="true"></div>
    <div class="snowbank snowbank--front" aria-hidden="true"></div>
    <div class="vignette" aria-hidden="true"></div>
  </main>
`;

const valueElement = getElement<HTMLParagraphElement>("#countdown-value");
const labelElement = getElement<HTMLParagraphElement>("#countdown-label");
const dateElement = getElement<HTMLTimeElement>("#christmas-date");
const celebrationElement = getElement<HTMLDivElement>(".celebration");
const snowLayers = Array.from(document.querySelectorAll<HTMLDivElement>(".snow"));

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let lastStateKey = "";
let midnightTimer: number | undefined;
let celebrationTimeline: gsap.core.Timeline | undefined;

function getStateKey(state: ChristmasState): string {
  return `${state.mode}-${state.daysRemaining ?? "message"}-${state.targetYear}`;
}

function setContent(state: ChristmasState): void {
  const isCountdown = state.mode === "countdown";
  valueElement.classList.toggle("is-message", !isCountdown);
  valueElement.textContent = isCountdown ? String(state.daysRemaining) : state.message;
  labelElement.textContent = isCountdown
    ? state.daysRemaining === 1
      ? "Day until Christmas"
      : "Days until Christmas"
    : state.mode === "christmas"
      ? "Peace · Joy · Wonder"
      : "The countdown begins again January 1";
  dateElement.dateTime = `${state.targetYear}-12-25`;
  dateElement.textContent = `December 25, ${state.targetYear}`;
}

function stopCelebration(): void {
  celebrationTimeline?.kill();
  celebrationTimeline = undefined;
  celebrationElement.replaceChildren();
}

function startCelebration(): void {
  stopCelebration();
  if (motionPreference.matches) return;

  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 10; index += 1) {
    const sparkle = document.createElement("i");
    sparkle.textContent = index % 2 === 0 ? "✦" : "·";
    sparkle.style.left = `${8 + ((index * 37) % 84)}%`;
    sparkle.style.top = `${10 + ((index * 43) % 76)}%`;
    fragment.append(sparkle);
  }
  celebrationElement.append(fragment);

  celebrationTimeline = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });
  celebrationTimeline.fromTo(
    celebrationElement.children,
    { autoAlpha: 0, scale: 0.3 },
    {
      autoAlpha: 0.9,
      scale: 1,
      duration: 0.7,
      stagger: 0.09,
      ease: "power2.out",
    },
  );
  celebrationTimeline.to(celebrationElement.children, {
    autoAlpha: 0,
    scale: 1.35,
    duration: 0.8,
    stagger: 0.05,
  });
}

function renderCountdown(animate = true): void {
  const state = getChristmasState(new Date());
  const stateKey = getStateKey(state);
  if (stateKey === lastStateKey) return;

  const shouldAnimate = animate && lastStateKey !== "" && !motionPreference.matches;
  if (shouldAnimate) {
    gsap.to([valueElement, labelElement, dateElement], {
      y: -12,
      autoAlpha: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setContent(state);
        gsap.fromTo(
          [valueElement, labelElement, dateElement],
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.55, stagger: 0.06, ease: "power3.out" },
        );
      },
    });
  } else {
    setContent(state);
  }

  if (state.mode === "christmas") startCelebration();
  else stopCelebration();
  lastStateKey = stateKey;
}

function scheduleMidnightRefresh(): void {
  window.clearTimeout(midnightTimer);
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  midnightTimer = window.setTimeout(
    () => {
      renderCountdown();
      scheduleMidnightRefresh();
    },
    Math.max(1_000, nextMidnight.getTime() - now.getTime() + 250),
  );
}

function createSnow(): void {
  snowLayers.forEach((layer, layerIndex) => {
    layer.replaceChildren();
    const count = motionPreference.matches ? 8 : layerIndex === 0 ? 12 : 16;
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < count; index += 1) {
      const flake = document.createElement("i");
      const size = layerIndex === 0 ? 2 + ((index * 5) % 4) : 4 + ((index * 7) % 6);
      flake.style.width = `${size}px`;
      flake.style.height = `${size}px`;
      flake.style.left = `${(index * 37.7 + layerIndex * 13) % 100}%`;
      flake.style.opacity = String(0.3 + ((index * 11) % 6) * 0.09);
      fragment.append(flake);
    }
    layer.append(fragment);

    if (motionPreference.matches) {
      Array.from(layer.children).forEach((flake, index) => {
        (flake as HTMLElement).style.top = `${7 + ((index * 19) % 84)}%`;
      });
      return;
    }

    Array.from(layer.children).forEach((flake, index) => {
      const duration = (layerIndex === 0 ? 20 : 13) + ((index * 7) % 9);
      gsap.fromTo(
        flake,
        { y: "-8vh", x: 0 },
        {
          y: "112vh",
          x: -25 + ((index * 17) % 51),
          duration,
          delay: -((index * 3.2) % duration),
          repeat: -1,
          ease: "none",
        },
      );
    });
  });
}

function updateMotionPreference(): void {
  snowLayers.forEach((layer) => gsap.killTweensOf(layer.children));
  createSnow();
  if (lastStateKey.startsWith("christmas")) startCelebration();
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    renderCountdown();
    scheduleMidnightRefresh();
  }
});
motionPreference.addEventListener("change", updateMotionPreference);

createSnow();
renderCountdown(false);
scheduleMidnightRefresh();

// Covers device-clock changes and long browser suspensions without busy polling.
window.setInterval(renderCountdown, 30 * 60 * 1_000);
