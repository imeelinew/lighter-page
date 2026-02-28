const SEARCH_URL = "https://www.google.com/search?q=";
const BOOKMARKS_URL = "./data/bookmarks.json";
const STORAGE_KEY = "lighter-page-bookmarks";
const DEFAULT_SIGNATURE_KEY = "lighter-page-default-signature";
const EXPORT_FILE_NAME = "lighter-page-bookmarks.json";
const GOOGLE_FAVICON_URL = "https://www.google.com/s2/favicons?sz=64&domain_url=";
const GREETINGS = [
  "Let the morning open like silk",
  "Begin where the light rests",
  "May this hour move gently",
  "Follow the hush of bright things",
  "Let calm find its shape today",
  "Take the first step softly",
  "Where light falls work may bloom",
  "Let the day unfold in gold",
  "Start with the quietest courage",
  "Keep close to what matters",
  "May the small hours shine kindly",
  "Begin beneath a tender sky",
  "Let wonder guide your hands",
  "Move slowly and make beauty",
  "May clarity arrive like dawn",
  "Hold steady and enter the day",
  "Let your thoughts gather like birds",
  "Start where your heart is clear",
  "May good work find you easily",
  "Let this page open into light"
];

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
  up: {
    viewBox: "0 0 24 24",
    paths: [
      { d: "m7.5 14.5 4.5-5 4.5 5", fill: "none", stroke: "currentColor" }
    ]
  },
  down: {
    viewBox: "0 0 24 24",
    paths: [
      { d: "m7.5 9.5 4.5 5 4.5-5", fill: "none", stroke: "currentColor" }
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
  }
};

let bookmarkState = { groups: [] };
let editorState = null;
let confirmState = null;
let lastActiveElement = null;
let dragState = null;
let activeModalBackdrop = null;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initializeGreeting() {
  const title = document.getElementById("page-title");

  if (!title) {
    return;
  }

  const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  title.textContent = greeting;

  if (prefersReducedMotion()) {
    return;
  }

  title.classList.add("is-smooth-enter");
  requestAnimationFrame(() => {
    title.classList.add("is-visible");
  });
}

function initializeMotion() {
  if (prefersReducedMotion()) {
    return;
  }

  document.body.classList.add("motion-enabled");
  requestAnimationFrame(() => {
    document.body.classList.add("motion-active");
  });
}

function initializeSearch() {
  const form = document.getElementById("search-form");
  const input = document.getElementById("search-input");

  if (!form || !input) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim();

    if (!query) {
      input.focus();
      return;
    }

    window.location.href = `${SEARCH_URL}${encodeURIComponent(query)}`;
  });

  document.addEventListener("keydown", (event) => {
    const activeElement = document.activeElement;
    const isTypingTarget =
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      activeElement instanceof HTMLSelectElement ||
      activeElement?.getAttribute("contenteditable") === "true";

    if (isModalOpen()) {
      return;
    }

    if (event.key === "/" && !isTypingTarget && activeElement !== input) {
      event.preventDefault();
      input.focus();
    }

    if (event.key === "Escape" && document.activeElement === input) {
      input.value = "";
    }
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

function serializeData(data) {
  return JSON.stringify(sanitizeData(cloneData(data)));
}

function normalizeBookmark(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const name = typeof item.name === "string" ? item.name.trim() : "";
  const url = typeof item.url === "string" ? item.url.trim() : "";

  if (!name || !url) {
    return null;
  }

  return { name, url };
}

function normalizeGroup(group) {
  if (!group || typeof group !== "object") {
    return null;
  }

  const title = typeof group.title === "string" && group.title.trim() ? group.title.trim() : "未命名分组";
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

function persistBookmarks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarkState));
}

function persistDefaultSignature(signature) {
  localStorage.setItem(DEFAULT_SIGNATURE_KEY, signature);
}

function markBookmarksCustomized() {
  persistDefaultSignature("");
}

function clearStoredBookmarks() {
  localStorage.removeItem(STORAGE_KEY);
}

function readDefaultSignature() {
  return localStorage.getItem(DEFAULT_SIGNATURE_KEY) || "";
}

function readStoredBookmarks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return sanitizeData(JSON.parse(raw));
  } catch (error) {
    console.error("Failed to parse stored bookmarks:", error);
    return null;
  }
}

async function fetchDefaultBookmarks() {
  const response = await fetch(BOOKMARKS_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return sanitizeData(await response.json());
}

function setFeedback(message, isError = false) {
  const feedback = document.getElementById("bookmark-feedback");

  if (!feedback) {
    return;
  }

  feedback.textContent = message;
  feedback.classList.toggle("is-error", isError);
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
  const faviconCandidates = [...getDirectFaviconCandidates(item.url), getFaviconUrl(item.url)].filter(Boolean);

  if (faviconCandidates.length === 0) {
    return null;
  }

  const icon = document.createElement("span");
  const image = document.createElement("img");
  let currentIndex = 0;

  icon.className = "bookmark-icon";
  icon.hidden = true;

  image.className = "bookmark-favicon";
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.referrerPolicy = "no-referrer";

  function tryNextFavicon() {
    if (currentIndex >= faviconCandidates.length) {
      icon.hidden = true;
      link.classList.remove("has-icon");
      return;
    }

    image.src = faviconCandidates[currentIndex];
    currentIndex += 1;
  }

  image.addEventListener("load", () => {
    icon.hidden = false;
    link.classList.add("has-icon");
  });

  image.addEventListener("error", () => {
    tryNextFavicon();
  });

  icon.appendChild(image);
  tryNextFavicon();

  return icon;
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
  ghostElement.style.setProperty("--ghost-pointer-events", "none");
  document.body.appendChild(ghostElement);

  dragState = {
    sourceGroupIndex: groupIndex,
    sourceItemIndex: itemIndex,
    sourceElement: wrapper,
    sourceName: item.name,
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
  if (!prefersReducedMotion()) {
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
    createIconButton("编辑书签", "edit", "icon-action-button", () => openBookmarkEditor(groupIndex, itemIndex))
  );
  actions.appendChild(
    createIconButton("删除书签", "trash", "icon-action-button danger", () => deleteBookmark(groupIndex, itemIndex))
  );

  dragHandle.type = "button";
  dragHandle.className = "bookmark-drag-handle";
  dragHandle.setAttribute("aria-label", "拖动排序");
  dragHandle.title = "拖动排序";
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
  const items = Array.isArray(group.items) ? group.items : [];

  article.className = "bookmark-group";
  article.style.setProperty("--enter-delay", `${220 + groupIndex * 90}ms`);
  if (!prefersReducedMotion()) {
    article.classList.add("is-entering");
  }
  header.className = "bookmark-group-header";
  list.className = "bookmark-list";
  list.dataset.groupIndex = String(groupIndex);
  actions.className = "group-actions";

  title.textContent = group.title;
  header.appendChild(title);

  actions.appendChild(
    createIconButton("新增书签", "add", "icon-action-button", () => openBookmarkEditor(groupIndex))
  );
  actions.appendChild(
    createIconButton("编辑分组", "edit", "icon-action-button", () => openGroupEditor(groupIndex))
  );
  actions.appendChild(
    createIconButton("删除分组", "trash", "icon-action-button danger", () => deleteGroup(groupIndex))
  );

  if (items.length === 0) {
    const emptyState = document.createElement("div");

    emptyState.className = "bookmark-empty";
    emptyState.textContent = "这个分组里还没有可用书签。";
    list.appendChild(emptyState);
  } else {
    items.forEach((item, itemIndex) => {
      list.appendChild(createBookmarkElement(item, groupIndex, itemIndex));
    });
  }

  article.appendChild(header);
  article.appendChild(list);
  article.appendChild(actions);

  return article;
}

function renderBookmarks() {
  const container = document.getElementById("bookmark-groups");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (bookmarkState.groups.length === 0) {
    setFeedback("当前还没有书签分组，先新建一个吧。");
    return;
  }

  bookmarkState.groups.forEach((group, groupIndex) => {
    container.appendChild(createGroupElement(group, groupIndex));
  });

  setFeedback("");
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
    title: group ? "编辑分组" : "新建分组",
    groupIndex,
    fields: [
      {
        id: "group-title",
        name: "title",
        label: "分组名称",
        value: group ? group.title : "",
        placeholder: "例如 常用"
      }
    ]
  });
}

function openBookmarkEditor(groupIndex, itemIndex) {
  const group = bookmarkState.groups[groupIndex];
  const item = Number.isInteger(itemIndex) ? group?.items[itemIndex] : null;

  openEditor({
    mode: "bookmark",
    title: item ? "编辑书签" : "新增书签",
    groupIndex,
    itemIndex,
    fields: [
      {
        id: "bookmark-name",
        name: "name",
        label: "名称",
        value: item ? item.name : "",
        placeholder: "例如 GitHub"
      },
      {
        id: "bookmark-url",
        name: "url",
        label: "链接",
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
    setEditorError("分组名称不能为空");
    return;
  }

  if (Number.isInteger(editorState.groupIndex)) {
    bookmarkState.groups[editorState.groupIndex].title = title;
  } else {
    bookmarkState.groups.push({ title, items: [] });
  }

  markBookmarksCustomized();
  persistBookmarks();
  renderBookmarks();
  closeEditor();
}

function saveBookmark(formData) {
  const name = (formData.get("name") || "").toString().trim();
  const url = normalizeUrl((formData.get("url") || "").toString());
  const groupIndex = editorState.groupIndex;

  if (!bookmarkState.groups[groupIndex]) {
    setEditorError("当前分组不可用");
    return;
  }

  if (!name) {
    setEditorError("书签名称不能为空");
    return;
  }

  if (!url) {
    setEditorError("链接不能为空");
    return;
  }

  const record = { name, url };

  if (Number.isInteger(editorState.itemIndex)) {
    bookmarkState.groups[groupIndex].items.splice(editorState.itemIndex, 1, record);
  } else {
    bookmarkState.groups[groupIndex].items.push(record);
  }

  markBookmarksCustomized();
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

  if (insertionIndex < 0) {
    insertionIndex = 0;
  }

  if (insertionIndex > targetItems.length) {
    insertionIndex = targetItems.length;
  }

  targetItems.splice(insertionIndex, 0, item);
  markBookmarksCustomized();
  persistBookmarks();
  renderBookmarks();
}

function deleteGroup(groupIndex) {
  const group = bookmarkState.groups[groupIndex];

  if (!group) {
    return;
  }

  openConfirmDialog(`确定删除分组「${group.title}」吗`, () => {
    bookmarkState.groups.splice(groupIndex, 1);
    markBookmarksCustomized();
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

  openConfirmDialog(`确定删除书签「${item.name}」吗`, () => {
    items.splice(itemIndex, 1);
    markBookmarksCustomized();
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
    const defaults = await fetchDefaultBookmarks();
    const defaultSignature = serializeData(defaults);

    bookmarkState = cloneData(defaults);
    clearStoredBookmarks();
    persistBookmarks();
    persistDefaultSignature(defaultSignature);
    renderBookmarks();
  } catch (error) {
    console.error("Failed to restore defaults:", error);
    setFeedback("恢复默认失败，请检查配置文件。", true);
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
      markBookmarksCustomized();
      persistBookmarks();
      renderBookmarks();
    } catch (error) {
      console.error("Failed to import bookmarks:", error);
      setFeedback("导入失败，请选择格式正确的 JSON 文件。", true);
    }
  });

  reader.readAsText(file);
}

function initializeToolbar() {
  const importButton = document.getElementById("import-button");
  const exportButton = document.getElementById("export-button");
  const resetButton = document.getElementById("reset-button");
  const addGroupButton = document.getElementById("add-group-button");
  const importFileInput = document.getElementById("import-file-input");
  const closeEditorButton = document.getElementById("close-editor-button");

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
      openConfirmDialog("恢复默认后会覆盖当前本地书签，确定继续吗", restoreDefaults);
    });
  }

  if (addGroupButton) {
    setButtonIcon(addGroupButton, "add");
    addGroupButton.addEventListener("click", () => openGroupEditor());
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

  if (closeEditorButton) {
    setButtonIcon(closeEditorButton, "close");
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
  const stored = readStoredBookmarks();
  const previousDefaultSignature = readDefaultSignature();

  try {
    const defaults = await fetchDefaultBookmarks();
    const defaultSignature = serializeData(defaults);

    if (!stored) {
      bookmarkState = cloneData(defaults);
      persistBookmarks();
      persistDefaultSignature(defaultSignature);
      renderBookmarks();
      return;
    }

    const storedSignature = serializeData(stored);

    if (previousDefaultSignature && storedSignature === previousDefaultSignature && storedSignature !== defaultSignature) {
      bookmarkState = cloneData(defaults);
      persistBookmarks();
      persistDefaultSignature(defaultSignature);
      renderBookmarks();
      return;
    }

    bookmarkState = cloneData(stored);
    persistDefaultSignature(defaultSignature);
    renderBookmarks();
  } catch (error) {
    if (stored) {
      bookmarkState = cloneData(stored);
      renderBookmarks();
      setFeedback("当前使用的是本地书签，默认配置文件读取失败。", true);
      console.error("Failed to refresh defaults:", error);
      return;
    }

    bookmarkState = { groups: [] };
    renderBookmarks();
    setFeedback("书签加载失败，请检查 data/bookmarks.json 是否存在且格式正确。", true);
    setFeedback("默认书签加载失败，请检查 data/bookmarks.json 是否存在且格式正确。", true);
    console.error("Failed to load bookmarks:", error);
  }
}

initializeGreeting();
initializeMotion();
initializeSearch();
initializeToolbar();
initializeEditor();
initializeConfirmDialog();
initializeModalBehavior();
loadBookmarks();
