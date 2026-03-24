const BOOKMARKS_API_URL = "./api/bookmarks";
const BOOKMARKS_RESET_URL = "./api/bookmarks/reset";
const SETTINGS_KEY = "lighter-page-settings";
const FAVICON_CACHE_KEY = "lighter-page-favicon-cache";
const EXPORT_FILE_NAME = "lighter-page-bookmarks.json";
const GOOGLE_FAVICON_URL = "https://www.google.com/s2/favicons?sz=64&domain_url=";

const SVG_ICONS = {
  add: {
    viewBox: "0 0 24 24",
    paths: [
      { d: "M12 5v14", stroke: "currentColor" },
      { d: "M5 12h14", stroke: "currentColor" }
    ]
  },
  edit: {
    viewBox: "0 0 24 24",
    paths: [
      { d: "M4 18.5V20h1.5L18 7.5 16.5 6 4 18.5Z", fill: "none", stroke: "currentColor" },
      { d: "M14.5 8 16 9.5", stroke: "currentColor" }
    ]
  },
  trash: {
    viewBox: "0 0 24 24",
    paths: [
      { d: "M7 7l10 10", stroke: "currentColor" },
      { d: "M17 7 7 17", stroke: "currentColor" }
    ]
  },
  upload: {
    viewBox: "0 0 24 24",
    paths: [
      { d: "M12 16V6", stroke: "currentColor" },
      { d: "m8.5 9.5 3.5-3.5 3.5 3.5", fill: "none", stroke: "currentColor" },
      { d: "M5 18.5h14", stroke: "currentColor" }
    ]
  },
  download: {
    viewBox: "0 0 24 24",
    paths: [
      { d: "M12 6v10", stroke: "currentColor" },
      { d: "m8.5 12.5 3.5 3.5 3.5-3.5", fill: "none", stroke: "currentColor" },
      { d: "M5 18.5h14", stroke: "currentColor" }
    ]
  },
  reset: {
    viewBox: "0 0 24 24",
    paths: [
      { d: "M19 12a7 7 0 1 1-2.05-4.95", stroke: "currentColor" },
      { d: "M19 5v5h-5", stroke: "currentColor" }
    ]
  },
  close: {
    viewBox: "0 0 24 24",
    paths: [
      { d: "M7 7l10 10", stroke: "currentColor" },
      { d: "M17 7 7 17", stroke: "currentColor" }
    ]
  },
  grip: {
    viewBox: "0 0 24 24",
    paths: [
      { d: "M9 6.5h.01", stroke: "currentColor" },
      { d: "M9 12h.01", stroke: "currentColor" },
      { d: "M9 17.5h.01", stroke: "currentColor" },
      { d: "M15 6.5h.01", stroke: "currentColor" },
      { d: "M15 12h.01", stroke: "currentColor" },
      { d: "M15 17.5h.01", stroke: "currentColor" }
    ]
  },
  settings: {
    viewBox: "0 0 24 24",
    paths: [
      { d: "M12 8.9a3.1 3.1 0 1 1 0 6.2 3.1 3.1 0 0 1 0-6.2Z", fill: "none", stroke: "currentColor" },
      {
        d: "M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.2 1.2 0 0 1 0 1.7l-1.1 1.1a1.2 1.2 0 0 1-1.7 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9v.2A1.2 1.2 0 0 1 14 22h-1.6a1.2 1.2 0 0 1-1.2-1.2v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.2 1.2 0 0 1-1.7 0l-1.1-1.1a1.2 1.2 0 0 1 0-1.7l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6h-.2A1.2 1.2 0 0 1 4 14v-1.6a1.2 1.2 0 0 1 1.2-1.2h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.2 1.2 0 0 1 0-1.7l1.1-1.1a1.2 1.2 0 0 1 1.7 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V5.2A1.2 1.2 0 0 1 12.4 4H14a1.2 1.2 0 0 1 1.2 1.2v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.2 1.2 0 0 1 1.7 0l1.1 1.1a1.2 1.2 0 0 1 0 1.7l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2A1.2 1.2 0 0 1 22 12.4V14a1.2 1.2 0 0 1-1.2 1.2h-.2a1 1 0 0 0-.9.6Z",
        fill: "none",
        stroke: "currentColor"
      }
    ]
  }
};

let bookmarkState = { groups: [] };
let editorState = null;
let confirmState = null;
let lastActiveElement = null;
let activeModalBackdrop = null;
let dragState = null;
let dataSourceKind = "server";
let bookmarkFilterValue = "";
let settingsState = loadSettings();
let faviconCache = loadFaviconCache();
let faviconCacheDirty = false;
let faviconCacheSaveTimer = 0;
let bookmarkSaveRequestId = 0;

function defaultSettings() {
  return {
    showFavicons: true,
    performanceMode: true,
    showAnimations: false,
    hideScrollbars: true
  };
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);

    if (!raw) {
      return defaultSettings();
    }

    return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch (error) {
    console.error("Failed to load settings:", error);
    return defaultSettings();
  }
}

function persistSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsState));
}

function applySettingsToPage() {
  document.body.classList.toggle("performance-mode", settingsState.performanceMode);
  document.documentElement.classList.toggle("hide-scrollbars", settingsState.hideScrollbars);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function shouldAnimate() {
  return settingsState.showAnimations && !settingsState.performanceMode && !prefersReducedMotion();
}

function scheduleDeferredWork(callback) {
  if (typeof callback !== "function") {
    return;
  }

  if (settingsState.performanceMode) {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(callback, { timeout: 600 });
      return;
    }

    window.setTimeout(callback, 180);
    return;
  }

  callback();
}

function initializeMotion() {
  document.body.classList.remove("motion-enabled", "motion-active");

  if (!shouldAnimate()) {
    return;
  }

  document.body.classList.add("motion-enabled");
  requestAnimationFrame(() => {
    document.body.classList.add("motion-active");
  });
}

function initializeFilter() {
  const input = document.getElementById("bookmark-filter");

  if (!input) {
    return;
  }

  input.addEventListener("input", (event) => {
    bookmarkFilterValue = event.target.value.trim();
    renderBookmarks();
  });
}

function normalizeUrl(value) {
  const raw = value.trim();

  if (!raw) {
    return "";
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw)) {
    return raw;
  }

  return `https://${raw}`;
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function normalizeBookmark(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const name = typeof item.name === "string" ? item.name.trim() : "";
  const url = typeof item.url === "string" ? normalizeUrl(item.url) : "";

  if (!name || !url) {
    return null;
  }

  return { name, url };
}

function normalizeGroup(group) {
  if (!group || typeof group !== "object") {
    return null;
  }

  const title = typeof group.title === "string" && group.title.trim() ? group.title.trim() : "Unnamed Group";
  const items = Array.isArray(group.items) ? group.items.map(normalizeBookmark).filter(Boolean) : [];

  return { title, items };
}

function sanitizeData(data) {
  if (!data || !Array.isArray(data.groups)) {
    throw new Error("Invalid schema");
  }

  return {
    groups: data.groups.map(normalizeGroup).filter(Boolean)
  };
}

function serializeData(data) {
  return JSON.stringify(sanitizeData(cloneData(data)));
}

async function parseBookmarksResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  return {
    data: sanitizeData(payload),
    source: payload?.meta?.source === "default" ? "default" : "server"
  };
}

async function fetchBookmarks() {
  const response = await fetch(BOOKMARKS_API_URL, { cache: "no-store" });
  return parseBookmarksResponse(response);
}

async function writeBookmarks(data = bookmarkState) {
  const response = await fetch(BOOKMARKS_API_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: serializeData(data)
  });

  return parseBookmarksResponse(response);
}

async function resetBookmarks() {
  const response = await fetch(BOOKMARKS_RESET_URL, {
    method: "POST"
  });

  return parseBookmarksResponse(response);
}

function persistBookmarks() {
  const snapshot = cloneData(bookmarkState);
  const requestId = ++bookmarkSaveRequestId;

  void writeBookmarks(snapshot)
    .then(({ data, source }) => {
      if (requestId !== bookmarkSaveRequestId) {
        return;
      }

      bookmarkState = cloneData(data);
      dataSourceKind = source;
      setFeedback("");
      renderBookmarks();
    })
    .catch((error) => {
      if (requestId !== bookmarkSaveRequestId) {
        return;
      }

      console.error("Failed to sync bookmarks:", error);
      setFeedback("Failed to sync bookmarks to the server.", true);
    });
}

function loadFaviconCache() {
  try {
    const raw = localStorage.getItem(FAVICON_CACHE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.error("Failed to read favicon cache:", error);
    return {};
  }
}

function scheduleFaviconCacheSave() {
  if (!faviconCacheDirty) {
    return;
  }

  window.clearTimeout(faviconCacheSaveTimer);
  faviconCacheSaveTimer = window.setTimeout(() => {
    localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(faviconCache));
    faviconCacheDirty = false;
  }, 80);
}

function updateFaviconCache(url, value) {
  faviconCache[url] = value;
  faviconCacheDirty = true;
  scheduleFaviconCacheSave();
}

function setFeedback(message = "", isError = false) {
  const feedback = document.getElementById("bookmark-feedback");

  if (!feedback) {
    return;
  }

  feedback.textContent = message;
  feedback.classList.toggle("is-error", isError);
}

function setSourceStatus() {
  const node = document.getElementById("bookmark-source-status");

  if (!node) {
    return;
  }

  node.textContent = `Current Data: ${dataSourceKind === "default" ? "Bundled Defaults" : "Server Storage"}`;
}

function setBookmarkStatus(text) {
  const node = document.getElementById("bookmark-status");

  if (!node) {
    return;
  }

  node.textContent = text;
}

function isModalOpen() {
  return activeModalBackdrop instanceof HTMLElement && !activeModalBackdrop.classList.contains("hidden");
}

function setAppInert(isInert) {
  const appShell = document.getElementById("app-shell");

  if (!appShell) {
    return;
  }

  if (isInert) {
    appShell.setAttribute("aria-hidden", "true");
    appShell.inert = true;
    document.body.classList.add("has-modal-open");
    return;
  }

  appShell.removeAttribute("aria-hidden");
  appShell.inert = false;
  document.body.classList.remove("has-modal-open");
}

function getFocusableElements(container) {
  if (!(container instanceof HTMLElement)) {
    return [];
  }

  return [...container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((element) => !element.hasAttribute("hidden"));
}

function trapModalFocus(event) {
  if (event.key !== "Tab" || !isModalOpen()) {
    return;
  }

  const focusableElements = getFocusableElements(activeModalBackdrop);

  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function showModal(backdrop) {
  if (!(backdrop instanceof HTMLElement)) {
    return;
  }

  activeModalBackdrop = backdrop;
  backdrop.classList.remove("hidden");
  backdrop.setAttribute("aria-hidden", "false");
  setAppInert(true);
}

function hideModal(backdrop) {
  if (!(backdrop instanceof HTMLElement)) {
    return;
  }

  backdrop.classList.add("hidden");
  backdrop.setAttribute("aria-hidden", "true");

  if (activeModalBackdrop === backdrop) {
    activeModalBackdrop = null;
  }

  if (!document.querySelector(".dialog-backdrop:not(.hidden)")) {
    setAppInert(false);
  }
}

function rememberActiveElement() {
  if (document.activeElement instanceof HTMLElement) {
    lastActiveElement = document.activeElement;
  }
}

function restoreActiveElement() {
  if (lastActiveElement instanceof HTMLElement) {
    lastActiveElement.focus();
  }
}

function createSvgIcon(iconName) {
  const iconDefinition = SVG_ICONS[iconName];

  if (!iconDefinition) {
    return document.createTextNode("");
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", iconDefinition.viewBox);
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("svg-icon");

  iconDefinition.paths.forEach((pathDefinition) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    Object.entries(pathDefinition).forEach(([key, value]) => {
      path.setAttribute(key, value);
    });

    if (!pathDefinition.fill) {
      path.setAttribute("fill", "none");
    }

    if (pathDefinition.stroke) {
      path.setAttribute("stroke-width", "1.8");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
    }

    svg.appendChild(path);
  });

  return svg;
}

function setButtonIcon(button, iconName) {
  button.replaceChildren(createSvgIcon(iconName));
}

function createIconButton(label, iconName, className, onClick, disabled = false) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = className;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.disabled = disabled;
  setButtonIcon(button, iconName);
  button.addEventListener("click", onClick);

  return button;
}

function getFaviconUrl(url) {
  return `${GOOGLE_FAVICON_URL}${encodeURIComponent(url)}`;
}

function getDirectFaviconCandidates(url) {
  try {
    const parsedUrl = new URL(url);
    return [
      `${parsedUrl.origin}/favicon.ico`,
      `${parsedUrl.origin}/icon.svg`,
      `${parsedUrl.origin}/static/icon.svg`,
      `${parsedUrl.origin}/apple-touch-icon.png`
    ];
  } catch {
    return [];
  }
}

function createBookmarkIcon(item, link) {
  if (!settingsState.showFavicons) {
    return null;
  }

  const cachedValue = Object.prototype.hasOwnProperty.call(faviconCache, item.url) ? faviconCache[item.url] : undefined;

  if (cachedValue === "") {
    return null;
  }

  const icon = document.createElement("span");
  const image = document.createElement("img");

  icon.className = "bookmark-icon";
  icon.hidden = true;

  image.className = "bookmark-favicon";
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.referrerPolicy = "no-referrer";

  image.addEventListener("load", () => {
    icon.hidden = false;
    link.classList.add("has-icon");
  });

  icon.appendChild(image);

  if (typeof cachedValue === "string") {
    image.src = cachedValue;
    return icon;
  }

  const faviconCandidates = [...getDirectFaviconCandidates(item.url), getFaviconUrl(item.url)].filter(Boolean);

  if (faviconCandidates.length === 0) {
    updateFaviconCache(item.url, "");
    return null;
  }

  let currentIndex = 0;

  function tryNextFavicon() {
    if (currentIndex >= faviconCandidates.length) {
      updateFaviconCache(item.url, "");
      icon.hidden = true;
      link.classList.remove("has-icon");
      return;
    }

    const candidate = faviconCandidates[currentIndex];
    currentIndex += 1;

    image.onerror = () => {
      tryNextFavicon();
    };
    image.onload = () => {
      updateFaviconCache(item.url, candidate);
      icon.hidden = false;
      link.classList.add("has-icon");
    };
    image.src = candidate;
  }

  scheduleDeferredWork(() => {
    tryNextFavicon();
  });

  return icon;
}

function getFilteredGroups() {
  const query = bookmarkFilterValue.trim().toLowerCase();

  if (!query) {
    return bookmarkState.groups.map((group, groupIndex) => ({
      ...group,
      groupIndex
    }));
  }

  return bookmarkState.groups
    .map((group, groupIndex) => {
      const titleMatches = group.title.toLowerCase().includes(query);
      const items = titleMatches
        ? group.items
        : group.items.filter((item) => `${item.name} ${item.url}`.toLowerCase().includes(query));

      if (items.length === 0) {
        return null;
      }

      return {
        title: group.title,
        items,
        groupIndex
      };
    })
    .filter(Boolean);
}

function getBookmarkTotals(groups) {
  return groups.reduce(
    (summary, group) => {
      summary.groups += 1;
      summary.items += group.items.length;
      return summary;
    },
    { groups: 0, items: 0 }
  );
}

function updateStatusSummary(visibleGroups) {
  const totals = getBookmarkTotals(bookmarkState.groups);
  const visibleTotals = getBookmarkTotals(visibleGroups);

  if (bookmarkFilterValue) {
    setBookmarkStatus(`Filtered: ${visibleTotals.groups} groups - ${visibleTotals.items} bookmarks`);
    return;
  }

  setBookmarkStatus(`${totals.groups} groups - ${totals.items} bookmarks`);
}

function getDropTargetFromPoint(clientX, clientY) {
  const target = document.elementFromPoint(clientX, clientY);

  if (!(target instanceof HTMLElement)) {
    return null;
  }

  const bookmarkItem = target.closest(".bookmark-item");

  if (bookmarkItem instanceof HTMLElement) {
    const targetGroupIndex = Number(bookmarkItem.dataset.groupIndex);
    const targetItemIndex = Number(bookmarkItem.dataset.itemIndex);

    if (!Number.isInteger(targetGroupIndex) || !Number.isInteger(targetItemIndex)) {
      return null;
    }

    const rect = bookmarkItem.getBoundingClientRect();
    const insertAfter = clientX > rect.left + rect.width / 2;

    return {
      type: "item",
      element: bookmarkItem,
      groupIndex: targetGroupIndex,
      itemIndex: targetItemIndex + (insertAfter ? 1 : 0)
    };
  }

  const bookmarkList = target.closest(".bookmark-list");

  if (bookmarkList instanceof HTMLElement) {
    const targetGroupIndex = Number(bookmarkList.dataset.groupIndex);

    if (!Number.isInteger(targetGroupIndex)) {
      return null;
    }

    return {
      type: "list",
      element: bookmarkList,
      groupIndex: targetGroupIndex,
      itemIndex: bookmarkState.groups[targetGroupIndex]?.items.length ?? 0
    };
  }

  return null;
}

function updateDropTarget(nextTarget) {
  if (dragState?.dropTarget?.element instanceof HTMLElement) {
    dragState.dropTarget.element.classList.remove("is-drop-target", "is-drop-target-list");
  }

  if (nextTarget?.element instanceof HTMLElement) {
    nextTarget.element.classList.add(nextTarget.type === "item" ? "is-drop-target" : "is-drop-target-list");
  }

  if (dragState) {
    dragState.dropTarget = nextTarget;
  }
}

function clearDragState() {
  if (dragState?.sourceElement instanceof HTMLElement) {
    dragState.sourceElement.classList.remove("is-dragging");
  }

  if (dragState?.ghostElement instanceof HTMLElement) {
    dragState.ghostElement.remove();
  }

  if (dragState?.dropTarget?.element instanceof HTMLElement) {
    dragState.dropTarget.element.classList.remove("is-drop-target", "is-drop-target-list");
  }

  document.body.classList.remove("is-pointer-dragging");
  document.removeEventListener("pointermove", handlePointerDragMove);
  document.removeEventListener("pointerup", handlePointerDragEnd);
  document.removeEventListener("pointercancel", handlePointerDragEnd);
  dragState = null;
}

function handlePointerDragMove(event) {
  if (!dragState) {
    return;
  }

  const { ghostElement, pointerOffsetX, pointerOffsetY } = dragState;

  if (ghostElement instanceof HTMLElement) {
    ghostElement.style.left = `${event.clientX - pointerOffsetX}px`;
    ghostElement.style.top = `${event.clientY - pointerOffsetY}px`;
  }

  updateDropTarget(getDropTargetFromPoint(event.clientX, event.clientY));
}

function handlePointerDragEnd(event) {
  if (!dragState) {
    return;
  }

  const currentDragState = dragState;
  const fallbackTarget = event ? getDropTargetFromPoint(event.clientX, event.clientY) : null;
  const dropTarget = currentDragState.dropTarget || fallbackTarget;

  clearDragState();

  if (!dropTarget) {
    return;
  }

  moveBookmarkByDrag(
    currentDragState.sourceGroupIndex,
    currentDragState.sourceItemIndex,
    dropTarget.groupIndex,
    dropTarget.itemIndex
  );
}

function startPointerDrag(event, wrapper, item, groupIndex, itemIndex) {
  if (!(wrapper instanceof HTMLElement)) {
    return;
  }

  event.preventDefault();
  clearDragState();

  const rect = wrapper.getBoundingClientRect();
  const ghostElement = wrapper.cloneNode(true);

  ghostElement.classList.add("bookmark-drag-ghost");
  ghostElement.classList.remove("is-entering", "is-drop-target", "is-dragging");
  ghostElement.style.width = `${rect.width}px`;
  ghostElement.style.height = `${rect.height}px`;
  ghostElement.style.left = `${rect.left}px`;
  ghostElement.style.top = `${rect.top}px`;
  document.body.appendChild(ghostElement);

  dragState = {
    sourceGroupIndex: groupIndex,
    sourceItemIndex: itemIndex,
    sourceElement: wrapper,
    ghostElement,
    pointerOffsetX: event.clientX - rect.left,
    pointerOffsetY: event.clientY - rect.top,
    dropTarget: null
  };

  wrapper.classList.add("is-dragging");
  document.body.classList.add("is-pointer-dragging");
  document.addEventListener("pointermove", handlePointerDragMove);
  document.addEventListener("pointerup", handlePointerDragEnd);
  document.addEventListener("pointercancel", handlePointerDragEnd);
  updateDropTarget(getDropTargetFromPoint(event.clientX, event.clientY));
}

function createBookmarkElement(item, groupIndex, itemIndex) {
  const wrapper = document.createElement("div");
  const link = document.createElement("a");
  const copy = document.createElement("span");
  const name = document.createElement("span");
  const actions = document.createElement("div");
  const dragHandle = document.createElement("button");

  wrapper.className = "bookmark-item";
  wrapper.style.setProperty("--enter-delay", `${100 + groupIndex * 70 + itemIndex * 40}ms`);
  if (shouldAnimate()) {
    wrapper.classList.add("is-entering");
  }
  wrapper.dataset.groupIndex = String(groupIndex);
  wrapper.dataset.itemIndex = String(itemIndex);

  link.className = "bookmark-link";
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noreferrer noopener";

  copy.className = "bookmark-copy";
  name.className = "bookmark-name";
  name.textContent = item.name;
  name.title = item.name;
  copy.appendChild(name);

  const icon = createBookmarkIcon(item, link);
  if (icon) {
    link.appendChild(icon);
  }
  link.appendChild(copy);

  actions.className = "bookmark-actions";
  actions.appendChild(
    createIconButton("Edit Bookmark", "edit", "icon-action-button", () => openBookmarkEditor(groupIndex, itemIndex))
  );
  actions.appendChild(
    createIconButton("Delete Bookmark", "trash", "icon-action-button danger", () => deleteBookmark(groupIndex, itemIndex))
  );

  dragHandle.type = "button";
  dragHandle.className = "bookmark-drag-handle";
  dragHandle.setAttribute("aria-label", "Drag to Reorder");
  dragHandle.title = "Drag to Reorder";
  setButtonIcon(dragHandle, "grip");
  dragHandle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType !== "touch") {
      return;
    }

    startPointerDrag(event, wrapper, item, groupIndex, itemIndex);
  });

  wrapper.appendChild(link);
  wrapper.appendChild(actions);
  wrapper.appendChild(dragHandle);

  return wrapper;
}

function createGroupElement(group, groupIndex) {
  const article = document.createElement("article");
  const header = document.createElement("div");
  const title = document.createElement("h3");
  const list = document.createElement("div");
  const actions = document.createElement("div");

  article.className = "bookmark-group";
  article.style.setProperty("--enter-delay", `${220 + groupIndex * 90}ms`);
  if (shouldAnimate()) {
    article.classList.add("is-entering");
  }

  header.className = "bookmark-group-header";
  list.className = "bookmark-list";
  list.dataset.groupIndex = String(groupIndex);
  actions.className = "group-actions";

  title.textContent = group.title;
  header.appendChild(title);

  actions.appendChild(
    createIconButton("Add Bookmark", "add", "icon-action-button", () => openBookmarkEditor(groupIndex))
  );
  actions.appendChild(
    createIconButton("Edit Group", "edit", "icon-action-button", () => openGroupEditor(groupIndex))
  );
  actions.appendChild(
    createIconButton("Delete Group", "trash", "icon-action-button danger", () => deleteGroup(groupIndex))
  );

  if (group.items.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "bookmark-empty";
    emptyState.textContent = "This group has no bookmarks yet";
    list.appendChild(emptyState);
  } else {
    group.items.forEach((item, itemIndex) => {
      list.appendChild(createBookmarkElement(item, groupIndex, itemIndex));
    });
  }

  article.appendChild(header);
  article.appendChild(list);
  article.appendChild(actions);

  return article;
}

function renderEmptyState(container, message) {
  const emptyState = document.createElement("div");
  emptyState.className = "bookmark-empty bookmark-empty-global";
  emptyState.textContent = message;
  container.appendChild(emptyState);
}

function renderBookmarks() {
  const container = document.getElementById("bookmark-groups");

  if (!container) {
    return;
  }

  container.innerHTML = "";
  setSourceStatus();

  if (bookmarkState.groups.length === 0) {
    setBookmarkStatus("No bookmark groups yet");
    setFeedback("");
    renderEmptyState(container, "There are no bookmark groups yet. Create one to get started.");
    return;
  }

  const visibleGroups = getFilteredGroups();
  updateStatusSummary(visibleGroups);

  if (visibleGroups.length === 0) {
    setFeedback("");
    renderEmptyState(container, "No matching bookmarks");
    return;
  }

  visibleGroups.forEach((group) => {
    container.appendChild(createGroupElement(group, group.groupIndex));
  });

  setFeedback("");
}

function createFieldElement(field) {
  const wrapper = document.createElement("div");
  const label = document.createElement("label");
  const input = document.createElement("input");

  wrapper.className = "field";
  label.htmlFor = field.id;
  label.textContent = field.label;

  input.id = field.id;
  input.name = field.name;
  input.type = field.type || "text";
  input.value = field.value || "";
  input.placeholder = field.placeholder || "";
  input.autocomplete = "off";

  wrapper.appendChild(label);
  wrapper.appendChild(input);

  return wrapper;
}

function openEditor(config) {
  const backdrop = document.getElementById("editor-backdrop");
  const title = document.getElementById("editor-title");
  const fields = document.getElementById("editor-fields");
  const error = document.getElementById("editor-error");

  if (!backdrop || !title || !fields || !error) {
    return;
  }

  rememberActiveElement();
  editorState = config;
  title.textContent = config.title;
  fields.innerHTML = "";
  error.textContent = "";

  config.fields.forEach((field) => {
    fields.appendChild(createFieldElement(field));
  });

  showModal(backdrop);

  const firstInput = fields.querySelector("input");

  if (firstInput instanceof HTMLElement) {
    firstInput.focus();
  }
}

function closeEditor() {
  const backdrop = document.getElementById("editor-backdrop");
  const error = document.getElementById("editor-error");

  editorState = null;

  if (!backdrop || !error) {
    return;
  }

  error.textContent = "";
  hideModal(backdrop);
  restoreActiveElement();
}

function setEditorError(message) {
  const error = document.getElementById("editor-error");

  if (error) {
    error.textContent = message;
  }
}

function openGroupEditor(groupIndex) {
  const group = Number.isInteger(groupIndex) ? bookmarkState.groups[groupIndex] : null;

  openEditor({
    mode: "group",
    title: group ? "Edit Group" : "New Group",
    groupIndex,
    fields: [
      {
        id: "group-title",
        name: "title",
        label: "Group Name",
        value: group ? group.title : "",
        placeholder: "e.g. Daily"
      }
    ]
  });
}

function openBookmarkEditor(groupIndex, itemIndex) {
  const group = bookmarkState.groups[groupIndex];
  const item = Number.isInteger(itemIndex) ? group?.items[itemIndex] : null;

  openEditor({
    mode: "bookmark",
    title: item ? "Edit Bookmark" : "Add Bookmark",
    groupIndex,
    itemIndex,
    fields: [
      {
        id: "bookmark-name",
        name: "name",
        label: "Name",
        value: item ? item.name : "",
        placeholder: "e.g. GitHub"
      },
      {
        id: "bookmark-url",
        name: "url",
        label: "URL",
        type: "url",
        value: item ? item.url : "",
        placeholder: "https://example.com"
      }
    ]
  });
}

function saveGroup(formData) {
  const title = (formData.get("title") || "").toString().trim();

  if (!title) {
    setEditorError("Group name is required");
    return;
  }

  if (Number.isInteger(editorState.groupIndex)) {
    bookmarkState.groups[editorState.groupIndex].title = title;
  } else {
    bookmarkState.groups.push({ title, items: [] });
  }

  dataSourceKind = "server";
  persistBookmarks();
  renderBookmarks();
  closeEditor();
}

function saveBookmark(formData) {
  const name = (formData.get("name") || "").toString().trim();
  const url = normalizeUrl((formData.get("url") || "").toString());
  const groupIndex = editorState.groupIndex;

  if (!bookmarkState.groups[groupIndex]) {
    setEditorError("Selected group is unavailable");
    return;
  }

  if (!name) {
    setEditorError("Bookmark name is required");
    return;
  }

  if (!url) {
    setEditorError("URL is required");
    return;
  }

  const record = { name, url };

  if (Number.isInteger(editorState.itemIndex)) {
    bookmarkState.groups[groupIndex].items.splice(editorState.itemIndex, 1, record);
  } else {
    bookmarkState.groups[groupIndex].items.push(record);
  }

  dataSourceKind = "server";
  persistBookmarks();
  renderBookmarks();
  closeEditor();
}

function moveBookmarkByDrag(sourceGroupIndex, sourceItemIndex, targetGroupIndex, targetItemIndex) {
  const sourceItems = bookmarkState.groups[sourceGroupIndex]?.items;
  const targetItems = bookmarkState.groups[targetGroupIndex]?.items;

  if (!sourceItems || !targetItems) {
    return;
  }

  if (
    sourceGroupIndex === targetGroupIndex &&
    (targetItemIndex === sourceItemIndex || targetItemIndex === sourceItemIndex + 1)
  ) {
    return;
  }

  const [item] = sourceItems.splice(sourceItemIndex, 1);

  if (!item) {
    return;
  }

  let insertionIndex = targetItemIndex;

  if (sourceGroupIndex === targetGroupIndex && sourceItemIndex < targetItemIndex) {
    insertionIndex -= 1;
  }

  insertionIndex = Math.max(0, Math.min(insertionIndex, targetItems.length));
  targetItems.splice(insertionIndex, 0, item);

  dataSourceKind = "server";
  persistBookmarks();
  renderBookmarks();
}

function openConfirmDialog(message, onAccept) {
  const backdrop = document.getElementById("confirm-backdrop");
  const messageNode = document.getElementById("confirm-message");

  if (!backdrop || !messageNode) {
    return;
  }

  rememberActiveElement();
  confirmState = { onAccept };
  messageNode.textContent = message;
  showModal(backdrop);

  const acceptButton = document.getElementById("confirm-accept-button");

  if (acceptButton instanceof HTMLElement) {
    acceptButton.focus();
  }
}

function closeConfirmDialog() {
  const backdrop = document.getElementById("confirm-backdrop");
  const messageNode = document.getElementById("confirm-message");

  confirmState = null;

  if (!backdrop || !messageNode) {
    return;
  }

  messageNode.textContent = "";
  hideModal(backdrop);
  restoreActiveElement();
}

function deleteGroup(groupIndex) {
  const group = bookmarkState.groups[groupIndex];

  if (!group) {
    return;
  }

  openConfirmDialog(`Are you sure you want to delete group "${group.title}"?`, () => {
    bookmarkState.groups.splice(groupIndex, 1);
    dataSourceKind = "server";
    persistBookmarks();
    renderBookmarks();
  });
}

function deleteBookmark(groupIndex, itemIndex) {
  const items = bookmarkState.groups[groupIndex]?.items;
  const item = items?.[itemIndex];

  if (!items || !item) {
    return;
  }

  openConfirmDialog(`Are you sure you want to delete bookmark "${item.name}"?`, () => {
    items.splice(itemIndex, 1);
    dataSourceKind = "server";
    persistBookmarks();
    renderBookmarks();
  });
}

function exportBookmarks() {
  const blob = new Blob([JSON.stringify(bookmarkState, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = EXPORT_FILE_NAME;
  link.click();
  URL.revokeObjectURL(url);
}

async function restoreDefaults() {
  try {
    const { data, source } = await resetBookmarks();
    bookmarkState = cloneData(data);
    dataSourceKind = source;
    renderBookmarks();
    setFeedback("");
  } catch (error) {
    console.error("Failed to restore defaults:", error);
    setFeedback("Failed to restore defaults from the server.", true);
  }
}

function importBookmarksFromFile(file) {
  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const nextState = sanitizeData(JSON.parse(String(reader.result || "")));

      bookmarkState = cloneData(nextState);
      dataSourceKind = "server";
      persistBookmarks();
      renderBookmarks();
      setFeedback("");
    } catch (error) {
      console.error("Failed to import bookmarks:", error);
      setFeedback("Failed to import bookmarks. Select a valid JSON file.", true);
    }
  });

  reader.readAsText(file);
}

function openSettingsDialog() {
  const backdrop = document.getElementById("settings-backdrop");
  const form = document.getElementById("settings-form");

  if (!backdrop || !(form instanceof HTMLFormElement)) {
    return;
  }

  rememberActiveElement();
  form.elements.showFavicons.checked = settingsState.showFavicons;
  form.elements.performanceMode.checked = settingsState.performanceMode;
  form.elements.showAnimations.checked = settingsState.showAnimations;
  form.elements.hideScrollbars.checked = settingsState.hideScrollbars;
  showModal(backdrop);

  const firstInput = form.querySelector("input");
  if (firstInput instanceof HTMLElement) {
    firstInput.focus();
  }
}

function closeSettingsDialog() {
  const backdrop = document.getElementById("settings-backdrop");

  if (!backdrop) {
    return;
  }

  hideModal(backdrop);
  restoreActiveElement();
}

function saveSettings(form) {
  settingsState = {
    showFavicons: Boolean(form.elements.showFavicons.checked),
    performanceMode: Boolean(form.elements.performanceMode.checked),
    showAnimations: Boolean(form.elements.showAnimations.checked),
    hideScrollbars: Boolean(form.elements.hideScrollbars.checked)
  };

  persistSettings();
  applySettingsToPage();
  initializeMotion();
  renderBookmarks();
  closeSettingsDialog();
}

function initializeToolbar() {
  const importButton = document.getElementById("import-button");
  const exportButton = document.getElementById("export-button");
  const resetButton = document.getElementById("reset-button");
  const settingsButton = document.getElementById("settings-button");
  const addGroupButton = document.getElementById("add-group-button");
  const importFileInput = document.getElementById("import-file-input");
  const closeEditorButton = document.getElementById("close-editor-button");
  const closeSettingsButton = document.getElementById("close-settings-button");

  if (importButton) {
    setButtonIcon(importButton, "upload");
    importButton.addEventListener("click", () => importFileInput?.click());
  }

  if (exportButton) {
    setButtonIcon(exportButton, "download");
    exportButton.addEventListener("click", exportBookmarks);
  }

  if (resetButton) {
    setButtonIcon(resetButton, "reset");
    resetButton.addEventListener("click", () => {
      openConfirmDialog("Restoring defaults will reload data/bookmarks.json and replace the current server bookmarks. Continue?", restoreDefaults);
    });
  }

  if (settingsButton) {
    setButtonIcon(settingsButton, "settings");
    settingsButton.addEventListener("click", openSettingsDialog);
  }

  if (addGroupButton) {
    setButtonIcon(addGroupButton, "add");
    addGroupButton.addEventListener("click", () => openGroupEditor());
  }

  if (closeEditorButton) {
    setButtonIcon(closeEditorButton, "close");
  }

  if (closeSettingsButton) {
    setButtonIcon(closeSettingsButton, "close");
  }

  if (importFileInput) {
    importFileInput.addEventListener("change", (event) => {
      const input = event.target;
      const file = input instanceof HTMLInputElement ? input.files?.[0] : null;

      importBookmarksFromFile(file || null);

      if (input instanceof HTMLInputElement) {
        input.value = "";
      }
    });
  }
}

function initializeEditor() {
  const closeButton = document.getElementById("close-editor-button");
  const cancelButton = document.getElementById("cancel-editor-button");
  const form = document.getElementById("editor-form");

  closeButton?.addEventListener("click", closeEditor);
  cancelButton?.addEventListener("click", closeEditor);

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!editorState) {
      return;
    }

    const formData = new FormData(form);

    if (editorState.mode === "group") {
      saveGroup(formData);
      return;
    }

    saveBookmark(formData);
  });
}

function initializeSettingsDialog() {
  const form = document.getElementById("settings-form");
  const closeButton = document.getElementById("close-settings-button");
  const cancelButton = document.getElementById("cancel-settings-button");

  closeButton?.addEventListener("click", closeSettingsDialog);
  cancelButton?.addEventListener("click", closeSettingsDialog);
  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (form instanceof HTMLFormElement) {
      saveSettings(form);
    }
  });
}

function initializeConfirmDialog() {
  const cancelButton = document.getElementById("confirm-cancel-button");
  const acceptButton = document.getElementById("confirm-accept-button");

  cancelButton?.addEventListener("click", closeConfirmDialog);
  acceptButton?.addEventListener("click", () => {
    const current = confirmState;
    closeConfirmDialog();

    if (typeof current?.onAccept === "function") {
      current.onAccept();
    }
  });
}

function initializeModalBehavior() {
  document.addEventListener("keydown", trapModalFocus);
}

async function loadBookmarks() {
  try {
    const { data, source } = await fetchBookmarks();
    bookmarkState = cloneData(data);
    dataSourceKind = source;
    renderBookmarks();
    setFeedback("");
  } catch (error) {
    bookmarkState = { groups: [] };
    dataSourceKind = "server";
    renderBookmarks();
    setFeedback("Failed to load bookmarks from the server.", true);
    console.error("Failed to load bookmarks:", error);
  }
}

applySettingsToPage();
initializeMotion();
initializeFilter();
initializeToolbar();
initializeEditor();
initializeSettingsDialog();
initializeConfirmDialog();
initializeModalBehavior();
loadBookmarks();
