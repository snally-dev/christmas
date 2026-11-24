import { ASSET_DIRECTORY, DATA_URL, SEASON_YEAR, TOTAL_DAYS, getAppNow } from "./config.ts";
import {
  formatUnlockDate,
  getChristmasCountdownState,
  getCountdownState,
  getSeasonDateState,
  isDayAvailable,
  millisecondsUntilNextLocalMidnight,
} from "./dates.ts";
import {
  collectId,
  createEmptyState,
  createStorageController,
  getCollectedIds,
  mergeStates,
  normalizeState,
} from "./storage.ts";
import type { CollectionFilter, Cryptid, DoorState } from "./types.ts";
import "./style.css";

const MILESTONES = [
  { count: 1, title: "First Discovery" },
  { count: 5, title: "Cryptid Explorer" },
  { count: 10, title: "Mystery Investigator" },
  { count: 15, title: "Cryptid Tracker" },
  { count: 20, title: "Master Cryptid Hunter" },
  { count: 25, title: "Christmas Cryptozoologist" },
] as const;

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Application root not found");

app.innerHTML = `
  <a class="skip-link" href="#main-content">Skip to the mysteries</a>
  <div class="forest-backdrop" aria-hidden="true">
    <div class="stars"></div><div class="moon"></div>
    <div class="tree-line tree-line--far"></div><div class="tree-line tree-line--near"></div>
  </div>
  <div class="christmas-ribbon" aria-label="Christmas Day countdown">
    <span>Christmas Day</span><strong class="christmas-countdown">Counting down…</strong>
  </div>
  <header class="site-header">
    <a class="brand" href="#calendar" aria-label="Christmas Cryptids home">
      <span class="brand-mark" aria-hidden="true"><span></span></span>
      <span><strong>Christmas Cryptids</strong><small>Field Society · Est. 2026</small></span>
    </a>
    <nav class="primary-nav" aria-label="Primary navigation">
      <a href="#calendar" data-route="calendar">Advent Calendar</a>
      <a href="#collection" data-route="collection">My Collection <span class="nav-count">· 0/25</span></a>
    </nav>
  </header>
  <div class="storage-warning" role="status" hidden>Private browsing has disabled storage. You can still explore, but progress will not be saved after this visit.</div>
  <main id="main-content">
    <section class="view calendar-view" data-view="calendar" aria-labelledby="calendar-title">
      <div class="hero">
        <div class="hero-copy">
          <p class="eyebrow">A holiday field expedition</p>
          <h1 id="calendar-title">The 25 Cryptids <em>of Christmas</em></h1>
          <p class="hero-subtitle">A mysterious creature awaits behind every door.</p>
          <div class="hero-progress" aria-label="Collection progress">
            <div class="progress-copy"><span>Field guide progress</span><strong class="progress-count">0 of 25 found</strong></div>
            <div class="progress-track"><span class="progress-fill"></span></div>
          </div>
        </div>
        <aside class="countdown-card" aria-labelledby="countdown-label">
          <span class="countdown-ornament" aria-hidden="true">✦</span>
          <p id="countdown-label">Until the first mystery</p>
          <div class="countdown-units" aria-live="off">
            <span><strong data-time="days">00</strong><small>Days</small></span><i aria-hidden="true">:</i>
            <span><strong data-time="hours">00</strong><small>Hours</small></span><i aria-hidden="true">:</i>
            <span><strong data-time="minutes">00</strong><small>Mins</small></span><i aria-hidden="true">:</i>
            <span><strong data-time="seconds">00</strong><small>Secs</small></span>
          </div>
          <p class="countdown-finished" hidden></p>
        </aside>
      </div>
      <div class="calendar-heading">
        <div><p class="section-kicker">December ${SEASON_YEAR}</p><h2>Expedition Calendar</h2></div>
        <p class="season-message" aria-live="polite"></p>
      </div>
      <div class="calendar-grid" aria-label="25 day Christmas cryptid advent calendar"></div>
      <aside class="how-it-works">
        <span class="compass" aria-hidden="true">✦</span>
        <div><h2>How the expedition works</h2><p>Return each December day to open a new field report. Missed days stay available, and every creature you discover is saved in your collection on this device.</p></div>
      </aside>
    </section>
    <section class="view collection-view" data-view="collection" aria-labelledby="collection-title" hidden>
      <header class="collection-header"><p class="eyebrow">Your illustrated field journal</p><h1 id="collection-title">My Christmas Cryptid Collection</h1><p>Every sighting recorded. Every mystery remembered.</p></header>
      <div class="collection-summary">
        <div><strong class="summary-collected">0</strong><span>Discovered</span></div>
        <div><strong class="summary-remaining">25</strong><span>Still hidden</span></div>
        <div class="summary-progress"><span>Collection progress</span><strong class="summary-percent">0%</strong><div class="progress-track"><span class="progress-fill"></span></div></div>
      </div>
      <section class="milestone-section" aria-labelledby="milestone-title">
        <div class="section-title-row"><div><p class="section-kicker">Field ranks</p><h2 id="milestone-title">Expedition Milestones</h2></div><p class="current-rank">Next rank: First Discovery</p></div>
        <div class="milestone-list"></div>
      </section>
      <section class="album" aria-labelledby="album-title">
        <div class="section-title-row album-toolbar">
          <div><p class="section-kicker">Specimen archive</p><h2 id="album-title">The Field Guide</h2></div>
          <div class="filter-group" role="group" aria-label="Filter collection">
            <button class="filter-button is-active" data-filter="all" type="button">All</button><button class="filter-button" data-filter="collected" type="button">Collected</button><button class="filter-button" data-filter="undiscovered" type="button">Undiscovered</button>
          </div>
        </div>
        <div class="collection-grid"></div><p class="empty-filter" hidden>No discoveries match this filter yet.</p>
      </section>
      <section class="completion-card" hidden>
        <div class="completion-creatures" aria-hidden="true"></div>
        <div><p class="section-kicker">Field guide complete</p><h2>Every mystery has been discovered!</h2><p>You are officially a Christmas Cryptozoologist.</p><a class="button button--gold" href="#calendar">Revisit the calendar</a></div>
      </section>
    </section>
  </main>
  <footer class="site-footer"><p>Made for curious explorers · No accounts, tracking, or faraway servers.</p><button class="settings-button" type="button">Field Kit &amp; Settings</button></footer>
  <dialog class="collectible-dialog" aria-labelledby="collectible-title"><div class="dialog-paper"><button class="dialog-close" type="button" aria-label="Close collectible">×</button><div class="sparkles" aria-hidden="true"></div><div class="collectible-content"></div></div></dialog>
  <dialog class="message-dialog" aria-labelledby="message-title"><div class="message-paper"><button class="dialog-close" type="button" aria-label="Close message">×</button><span class="message-emblem" aria-hidden="true">?</span><p class="section-kicker">Field report sealed</p><h2 id="message-title">This door is still locked</h2><p class="message-copy"></p><button class="button button--dark message-ok" type="button">I’ll come back</button></div></dialog>
  <dialog class="settings-dialog" aria-labelledby="settings-title"><div class="settings-paper"><button class="dialog-close" type="button" aria-label="Close settings">×</button><p class="section-kicker">Explorer supplies</p><h2 id="settings-title">Field Kit &amp; Settings</h2><p>Your discoveries live only in this browser. Keep a backup if you want to move them to another device.</p><div class="settings-actions"><button class="button button--dark export-button" type="button">Export progress</button><label class="button button--paper" for="restore-file">Restore from file</label><input id="restore-file" type="file" accept="application/json,.json" /></div><p class="import-status" role="status"></p><div class="danger-zone"><div><strong>Reset this field guide</strong><span>Remove every discovery saved for ${SEASON_YEAR} on this device.</span></div><button class="reset-button" type="button">Reset progress</button></div></div></dialog>
  <div class="sr-only" aria-live="polite" id="announcer"></div>
`;

function select<ElementType extends Element>(selector: string): ElementType {
  const element = document.querySelector<ElementType>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

const storage = createStorageController();
let collectionState = storage.read();
let cryptids: Cryptid[] = [];
let activeFilter: CollectionFilter = "all";
let midnightTimer: number | undefined;
let lastFocusedElement: HTMLElement | null = null;
const calendarGrid = select<HTMLDivElement>(".calendar-grid");
const collectionGrid = select<HTMLDivElement>(".collection-grid");
const collectibleDialog = select<HTMLDialogElement>(".collectible-dialog");
const messageDialog = select<HTMLDialogElement>(".message-dialog");
const settingsDialog = select<HTMLDialogElement>(".settings-dialog");
const announcer = select<HTMLDivElement>("#announcer");

function creatureImageUrl(cryptid: Cryptid): string {
  return `${import.meta.env.BASE_URL}${ASSET_DIRECTORY}/${cryptid.image}`;
}

function getCollectionCount(): number {
  return getCollectedIds(collectionState).size;
}

function getDoorState(id: number, now = getAppNow()): DoorState {
  if (collectionState.collected[String(id)]) return "collected";
  return isDayAvailable(id, now) ? "available" : "locked";
}

function setText(selector: string, text: string): void {
  document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    element.textContent = text;
  });
}

function setProgress(count: number): void {
  const percentage = Math.round((count / TOTAL_DAYS) * 100);
  document.querySelectorAll<HTMLElement>(".progress-fill").forEach((fill) => {
    fill.style.width = `${percentage}%`;
  });
  setText(".progress-count", `${count} of ${TOTAL_DAYS} found`);
  setText(".nav-count", `· ${count}/${TOTAL_DAYS}`);
  setText(".summary-collected", String(count));
  setText(".summary-remaining", String(TOTAL_DAYS - count));
  setText(".summary-percent", `${percentage}%`);
}

function createDoor(cryptid: Cryptid, now: Date): HTMLButtonElement {
  const state = getDoorState(cryptid.id, now);
  const button = document.createElement("button");
  button.type = "button";
  button.className = `door door--${state}`;
  button.dataset.id = String(cryptid.id);
  button.style.setProperty("--door-index", String(cryptid.id));
  if (state === "locked") {
    button.setAttribute(
      "aria-label",
      `Day ${cryptid.id}, locked until ${formatUnlockDate(cryptid.id)}`,
    );
    button.innerHTML = `<span class="door-number">${cryptid.id}</span><span class="door-decoration" aria-hidden="true"><i></i></span><span class="door-status">Locked</span>`;
  } else if (state === "available") {
    button.setAttribute("aria-label", `Day ${cryptid.id}, available to open`);
    if (getSeasonDateState(now).todayDay === cryptid.id) button.classList.add("door--today");
    button.innerHTML = `<span class="door-number">${cryptid.id}</span><span class="door-decoration" aria-hidden="true"><i></i></span><span class="door-status">Open me</span>`;
  } else {
    button.setAttribute(
      "aria-label",
      `Day ${cryptid.id}, ${cryptid.title}, collected. Open collectible.`,
    );
    const image = document.createElement("img");
    image.src = creatureImageUrl(cryptid);
    image.alt = "";
    image.loading = "lazy";
    const number = document.createElement("span");
    number.className = "door-day-badge";
    number.textContent = `Day ${cryptid.id}`;
    const check = document.createElement("span");
    check.className = "collected-check";
    check.textContent = "Collected";
    button.append(image, number, check);
  }
  return button;
}

function renderCalendar(): void {
  const now = getAppNow();
  const season = getSeasonDateState(now);
  calendarGrid.replaceChildren(...cryptids.map((cryptid) => createDoor(cryptid, now)));
  let message = "The first mystery arrives December 1. Every door is waiting quietly.";
  if (season.phase === "active") {
    message =
      season.todayDay === TOTAL_DAYS
        ? "The final field report is ready. Merry Christmas, explorer!"
        : `Day ${season.todayDay} is ready to investigate. Earlier unopened reports are still waiting.`;
  } else if (season.phase === "after")
    message = "The full expedition is unlocked. Complete your field guide whenever you like.";
  setText(".season-message", message);
}

function createCollectionCard(cryptid: Cryptid, collected: boolean): HTMLElement {
  const card = collected ? document.createElement("button") : document.createElement("article");
  if (card instanceof HTMLButtonElement) card.type = "button";
  card.className = collected
    ? "album-card album-card--collected"
    : "album-card album-card--unknown";
  card.dataset.id = String(cryptid.id);
  if (collected) {
    card.setAttribute("aria-label", `Open collectible for ${cryptid.title}, day ${cryptid.id}`);
    const picture = document.createElement("span");
    picture.className = "album-picture";
    const image = document.createElement("img");
    image.src = creatureImageUrl(cryptid);
    image.alt = `${cryptid.title}, the Christmas cryptid discovered on day ${cryptid.id}`;
    image.loading = "lazy";
    picture.append(image);
    const day = document.createElement("small");
    day.textContent = `Field report ${String(cryptid.id).padStart(2, "0")}`;
    const title = document.createElement("strong");
    title.textContent = cryptid.title;
    card.append(picture, day, title);
  } else {
    card.setAttribute("aria-label", `Undiscovered collection slot for day ${cryptid.id}`);
    card.innerHTML = `<span class="unknown-mark" aria-hidden="true">?</span><small>Field report ${String(cryptid.id).padStart(2, "0")}</small><strong>Undiscovered</strong>`;
  }
  return card;
}

function renderMilestones(count: number): void {
  const list = select<HTMLDivElement>(".milestone-list");
  list.replaceChildren(
    ...MILESTONES.map((milestone) => {
      const item = document.createElement("div");
      const unlocked = count >= milestone.count;
      item.className = `milestone ${unlocked ? "is-unlocked" : "is-locked"}`;
      item.innerHTML = `<span class="milestone-seal" aria-hidden="true">${unlocked ? "✦" : milestone.count}</span><span><strong></strong><small>${unlocked ? "Earned" : `${milestone.count} discoveries`}</small></span>`;
      item.querySelector("strong")!.textContent = milestone.title;
      return item;
    }),
  );
  const current = [...MILESTONES].reverse().find((milestone) => count >= milestone.count);
  const next = MILESTONES.find((milestone) => count < milestone.count);
  setText(
    ".current-rank",
    current
      ? next
        ? `${current.title} · Next: ${next.title}`
        : current.title
      : `Next rank: ${MILESTONES[0].title}`,
  );
}

function renderCollection(): void {
  const collectedIds = getCollectedIds(collectionState);
  const filtered = cryptids.filter((cryptid) =>
    activeFilter === "collected"
      ? collectedIds.has(cryptid.id)
      : activeFilter === "undiscovered"
        ? !collectedIds.has(cryptid.id)
        : true,
  );
  collectionGrid.replaceChildren(
    ...filtered.map((cryptid) => createCollectionCard(cryptid, collectedIds.has(cryptid.id))),
  );
  select<HTMLParagraphElement>(".empty-filter").hidden = filtered.length > 0;
  const count = collectedIds.size;
  setProgress(count);
  renderMilestones(count);
  renderCompletion(count === TOTAL_DAYS);
}

function renderCompletion(isComplete: boolean): void {
  const card = select<HTMLElement>(".completion-card");
  card.hidden = !isComplete;
  if (!isComplete) return;
  const creatureWrap = select<HTMLDivElement>(".completion-creatures");
  creatureWrap.replaceChildren(
    ...[cryptids[0], cryptids[11], cryptids[24]].map((cryptid) => {
      const image = document.createElement("img");
      image.src = creatureImageUrl(cryptid);
      image.alt = "";
      return image;
    }),
  );
}

function renderAll(): void {
  setProgress(getCollectionCount());
  renderCalendar();
  renderCollection();
  select<HTMLElement>(".storage-warning").hidden = storage.available;
}

function createSparkles(): DocumentFragment {
  const points = [
    [-280, -160],
    [-120, -220],
    [70, -220],
    [250, -150],
    [310, 0],
    [250, 150],
    [80, 220],
    [-90, 210],
    [-260, 150],
    [-320, 10],
    [-190, -70],
    [180, 70],
  ];
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 12; index += 1) {
    const sparkle = document.createElement("i");
    sparkle.style.setProperty("--sparkle-index", String(index));
    sparkle.style.setProperty("--sparkle-x", `${points[index][0]}px`);
    sparkle.style.setProperty("--sparkle-y", `${points[index][1]}px`);
    fragment.append(sparkle);
  }
  return fragment;
}

function rememberFocusAndOpen(dialog: HTMLDialogElement): void {
  lastFocusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  dialog.showModal();
  dialog.querySelector<HTMLElement>("button")?.focus();
}

function showCollectible(cryptid: Cryptid, isNew: boolean): void {
  const content = select<HTMLDivElement>(".collectible-content");
  const sparkles = select<HTMLDivElement>(".sparkles");
  content.replaceChildren();
  sparkles.replaceChildren(createSparkles());
  collectibleDialog.classList.toggle("is-reveal", isNew);
  collectibleDialog.classList.toggle("is-final", isNew && cryptid.id === TOTAL_DAYS);
  const report = document.createElement("p");
  report.className = "collectible-report";
  report.textContent = `Field report ${String(cryptid.id).padStart(2, "0")} · December ${cryptid.id}`;
  const imageWrap = document.createElement("div");
  imageWrap.className = "collectible-image";
  const image = document.createElement("img");
  image.src = creatureImageUrl(cryptid);
  image.alt = `${cryptid.title}, a Christmas cryptid`;
  imageWrap.append(image);
  const badge = document.createElement("span");
  badge.className = "collected-badge";
  badge.textContent = isNew ? "Cryptid discovered!" : "Collected";
  const title = document.createElement("h2");
  title.id = "collectible-title";
  title.textContent = cryptid.title;
  const description = document.createElement("p");
  description.className = "collectible-description";
  description.textContent = cryptid.description;
  const confirmation = document.createElement("p");
  confirmation.className = "collection-confirmation";
  confirmation.textContent = isNew
    ? "Added to your Christmas field guide."
    : "Already safe in your Christmas field guide.";
  const actions = document.createElement("div");
  actions.className = "collectible-actions";
  actions.innerHTML = `<button class="button button--gold return-calendar" type="button">Return to calendar</button><button class="button button--paper view-collection" type="button">View collection</button>`;
  content.append(report, imageWrap, badge, title, description, confirmation, actions);
  rememberFocusAndOpen(collectibleDialog);
}

function showLockedMessage(day: number): void {
  select<HTMLParagraphElement>(".message-copy").textContent =
    `Field report ${day} opens at midnight on ${formatUnlockDate(day)}. The creature inside must remain a mystery until then.`;
  rememberFocusAndOpen(messageDialog);
}

function handleCryptidSelection(id: number): void {
  const cryptid = cryptids.find((entry) => entry.id === id);
  if (!cryptid) return;
  const state = getDoorState(id);
  if (state === "locked") {
    showLockedMessage(id);
    return;
  }
  if (state === "collected") {
    showCollectible(cryptid, false);
    return;
  }
  collectionState = collectId(collectionState, id, getAppNow());
  storage.write(collectionState);
  renderAll();
  showCollectible(cryptid, true);
  announcer.textContent = `${cryptid.title} discovered and added to your collection.`;
}

function updateCountdown(): void {
  const countdown = getCountdownState(getAppNow());
  const christmas = getChristmasCountdownState(getAppNow());
  setText(
    ".christmas-countdown",
    christmas.target
      ? `${christmas.days}d ${String(christmas.hours).padStart(2, "0")}h ${String(christmas.minutes).padStart(2, "0")}m ${String(christmas.seconds).padStart(2, "0")}s`
      : "Merry Christmas",
  );
  setText("#countdown-label", countdown.label);
  const units = select<HTMLDivElement>(".countdown-units");
  const finished = select<HTMLParagraphElement>(".countdown-finished");
  units.hidden = countdown.target === null;
  finished.hidden = countdown.target !== null;
  if (countdown.target === null) {
    finished.textContent = countdown.label;
    return;
  }
  for (const [unit, value] of Object.entries({
    days: countdown.days,
    hours: countdown.hours,
    minutes: countdown.minutes,
    seconds: countdown.seconds,
  })) {
    const element = document.querySelector<HTMLElement>(`[data-time="${unit}"]`);
    if (element) element.textContent = String(value).padStart(2, "0");
  }
}

function getRoute(): "calendar" | "collection" {
  return window.location.hash === "#collection" ? "collection" : "calendar";
}

function renderRoute(): void {
  const route = getRoute();
  document.querySelectorAll<HTMLElement>("[data-view]").forEach((view) => {
    view.hidden = view.dataset.view !== route;
  });
  document.querySelectorAll<HTMLAnchorElement>("[data-route]").forEach((link) => {
    const active = link.dataset.route === route;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  window.scrollTo({ top: 0, behavior: "auto" });
}

function scheduleMidnightRefresh(): void {
  window.clearTimeout(midnightTimer);
  midnightTimer = window.setTimeout(() => {
    renderAll();
    updateCountdown();
    scheduleMidnightRefresh();
  }, millisecondsUntilNextLocalMidnight(getAppNow()));
}

function closeDialog(dialog: HTMLDialogElement): void {
  dialog.close();
}

document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const door = target.closest<HTMLButtonElement>(".door");
  if (door) handleCryptidSelection(Number(door.dataset.id));
  const collectionCard = target.closest<HTMLButtonElement>(".album-card--collected");
  if (collectionCard) handleCryptidSelection(Number(collectionCard.dataset.id));
  const filter = target.closest<HTMLButtonElement>(".filter-button");
  if (filter) {
    activeFilter = filter.dataset.filter as CollectionFilter;
    document
      .querySelectorAll(".filter-button")
      .forEach((button) => button.classList.remove("is-active"));
    filter.classList.add("is-active");
    renderCollection();
  }
  const close = target.closest<HTMLButtonElement>(".dialog-close");
  if (close) closeDialog(close.closest("dialog") as HTMLDialogElement);
  if (target.closest(".message-ok")) closeDialog(messageDialog);
  if (target.closest(".return-calendar")) {
    closeDialog(collectibleDialog);
    window.location.hash = "calendar";
  }
  if (target.closest(".view-collection")) {
    closeDialog(collectibleDialog);
    window.location.hash = "collection";
  }
  if (target.closest(".settings-button")) rememberFocusAndOpen(settingsDialog);
  if (target.closest(".export-button")) exportProgress();
  if (target.closest(".reset-button")) resetProgress();
});

for (const dialog of [collectibleDialog, messageDialog, settingsDialog]) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });
  dialog.addEventListener("close", () => lastFocusedElement?.focus());
}

function exportProgress(): void {
  const blob = new Blob([JSON.stringify(collectionState, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `christmas-cryptids-${SEASON_YEAR}-progress.json`;
  link.click();
  URL.revokeObjectURL(url);
  select<HTMLParagraphElement>(".import-status").textContent = "Backup downloaded.";
}

async function importProgress(file: File): Promise<void> {
  const status = select<HTMLParagraphElement>(".import-status");
  try {
    if (file.size > 100_000) throw new Error("File is too large");
    const parsed: unknown = JSON.parse(await file.text());
    const imported = normalizeState(parsed);
    if (!imported) throw new Error("That file is not a valid 2026 Christmas Cryptids backup");
    const before = getCollectionCount();
    collectionState = mergeStates(collectionState, imported);
    storage.write(collectionState);
    renderAll();
    const added = getCollectionCount() - before;
    status.textContent =
      added > 0
        ? `${added} new ${added === 1 ? "discovery" : "discoveries"} restored.`
        : "Backup checked. No new discoveries were needed.";
  } catch (error) {
    status.textContent =
      error instanceof Error
        ? `${error.message}. Nothing was changed.`
        : "That backup could not be read. Nothing was changed.";
  }
}

function resetProgress(): void {
  if (
    !window.confirm(
      `Reset every ${SEASON_YEAR} discovery on this device? This cannot be undone unless you exported a backup.`,
    )
  )
    return;
  storage.clear();
  collectionState = createEmptyState();
  activeFilter = "all";
  document
    .querySelectorAll(".filter-button")
    .forEach((button) =>
      button.classList.toggle("is-active", (button as HTMLElement).dataset.filter === "all"),
    );
  renderAll();
  select<HTMLParagraphElement>(".import-status").textContent = "The field guide has been reset.";
}

select<HTMLInputElement>("#restore-file").addEventListener("change", (event) => {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (file) void importProgress(file);
  input.value = "";
});
window.addEventListener("hashchange", renderRoute);
window.addEventListener("focus", () => {
  renderAll();
  updateCountdown();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    renderAll();
    updateCountdown();
    scheduleMidnightRefresh();
  }
});

async function loadCryptids(): Promise<Cryptid[]> {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`Field guide data failed to load (${response.status})`);
  const data: unknown = await response.json();
  if (!Array.isArray(data) || data.length !== TOTAL_DAYS)
    throw new Error("Field guide data must contain 25 records");
  const records = data.filter((record): record is Cryptid => {
    if (typeof record !== "object" || record === null) return false;
    const candidate = record as Partial<Cryptid>;
    return (
      Number.isInteger(candidate.id) &&
      typeof candidate.title === "string" &&
      typeof candidate.description === "string" &&
      typeof candidate.image === "string" &&
      /^[a-z0-9-]+\.png$/.test(candidate.image)
    );
  });
  const ids = new Set(records.map((record) => record.id));
  if (
    records.length !== TOTAL_DAYS ||
    ids.size !== TOTAL_DAYS ||
    records.some((record) => record.id < 1 || record.id > TOTAL_DAYS)
  )
    throw new Error("Field guide data contains invalid or duplicate records");
  return records.toSorted((a, b) => a.id - b.id);
}

async function start(): Promise<void> {
  try {
    cryptids = await loadCryptids();
    renderAll();
    renderRoute();
    updateCountdown();
    scheduleMidnightRefresh();
    window.setInterval(updateCountdown, 1_000);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The field guide could not be opened";
    calendarGrid.innerHTML = `<div class="load-error"><strong>The expedition hit a snag.</strong><p></p></div>`;
    calendarGrid.querySelector("p")!.textContent =
      `${message}. Please refresh the page and try again.`;
  }
}

void start();
