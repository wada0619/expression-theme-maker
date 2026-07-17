/**
 * 表情お題メーカー
 *
 * お題共有の例: ?expression=にっこり笑顔&emotion=眠い&situation=旅行中
 */

const CATEGORIES = {
  expression: { id: "expression", label: "表情", file: "data/expressions.txt" },
  emotion: { id: "emotion", label: "感情", file: "data/emotions.txt" },
  situation: { id: "situation", label: "状況", file: "data/situations.txt" },
};

const ENABLED_CATEGORIES_KEY = "enabledCategories_v2";

const categoryData = {};
const enabledCategories = {
  expression: true,
  emotion: false,
  situation: false,
};
const promptHistory = [];
const lastSelections = {
  expression: "",
  emotion: "",
  situation: "",
};
let currentPrompt = "";

let promptTextEl;
let promptMetaEl;
let generateBtn;
let copyBtn;
let shareBtn;
let historyList;
let categoryChips;

function bindDomElements() {
  promptTextEl = document.getElementById("promptText");
  promptMetaEl = document.getElementById("promptMeta");
  generateBtn = document.getElementById("generateBtn");
  copyBtn = document.getElementById("copyBtn");
  shareBtn = document.getElementById("shareBtn");
  historyList = document.getElementById("historyList");
  categoryChips = document.getElementById("categoryChips");

  return (
    promptTextEl &&
    promptMetaEl &&
    generateBtn &&
    copyBtn &&
    shareBtn &&
    historyList &&
    categoryChips
  );
}

async function loadCategoryFile(category) {
  const response = await fetch(category.file);
  if (!response.ok) {
    throw new Error(`Failed to load ${category.file} (${response.status})`);
  }

  return (await response.text())
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function loadEnabledCategories() {
  try {
    const raw = localStorage.getItem(ENABLED_CATEGORIES_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;

    for (const id of Object.keys(CATEGORIES)) {
      enabledCategories[id] = Boolean(parsed[id]);
    }
  } catch {
    // keep defaults
  }
}

function saveEnabledCategories() {
  localStorage.setItem(ENABLED_CATEGORIES_KEY, JSON.stringify(enabledCategories));
}

async function loadAllCategories() {
  await Promise.all(
    Object.values(CATEGORIES).map(async (category) => {
      categoryData[category.id] = await loadCategoryFile(category);
    })
  );
}

function readSelectionsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const selections = {};
  let hasAny = false;

  for (const category of Object.values(CATEGORIES)) {
    const value = params.get(category.id);
    if (value && value.trim()) {
      selections[category.id] = value.trim();
      hasAny = true;
    }
  }

  return hasAny ? selections : null;
}

function clearShareUrlFromAddressBar() {
  if (!window.location.search) return;
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.hash}`
  );
}

function isPageReload() {
  const nav = performance.getEntriesByType("navigation")[0];
  return Boolean(nav && nav.type === "reload");
}

function getSiteUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function getShareUrl() {
  if (!currentPrompt) return getSiteUrl();

  const params = new URLSearchParams();
  for (const category of Object.values(CATEGORIES)) {
    const value = lastSelections[category.id];
    if (value) params.set(category.id, value);
  }

  const query = params.toString();
  return query ? `${getSiteUrl()}?${query}` : getSiteUrl();
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function pickRandomDifferent(items, avoid) {
  if (!items || items.length === 0) return "";
  if (items.length === 1) return items[0];

  const alternatives = items.filter((item) => item !== avoid);
  return pickRandom(alternatives.length > 0 ? alternatives : items);
}

function countPossiblePrompts() {
  let total = 1;
  let hasEnabled = false;

  for (const category of Object.values(CATEGORIES)) {
    if (!enabledCategories[category.id]) continue;
    const items = categoryData[category.id];
    if (!items || items.length === 0) continue;
    hasEnabled = true;
    total *= items.length;
  }

  return hasEnabled ? total : 0;
}

function getRecentPrompts() {
  const recent = [];
  if (currentPrompt) recent.push(currentPrompt);
  for (const item of promptHistory) {
    if (!recent.includes(item)) recent.push(item);
    if (recent.length >= 5) break;
  }
  return recent;
}

function combinePrompt(selections) {
  return Object.values(CATEGORIES)
    .filter((category) => selections[category.id])
    .map((category) => `${category.label}：${selections[category.id]}`)
    .join("\n");
}

function buildSelections() {
  const selections = {};

  for (const category of Object.values(CATEGORIES)) {
    if (!enabledCategories[category.id]) continue;
    const items = categoryData[category.id];
    if (!items || items.length === 0) continue;
    selections[category.id] = pickRandomDifferent(items, lastSelections[category.id]);
  }

  return selections;
}

function rememberSelections(selections) {
  lastSelections.expression = selections.expression || "";
  lastSelections.emotion = selections.emotion || "";
  lastSelections.situation = selections.situation || "";
}

function generatePrompt() {
  const maxAttempts = 50;
  const recent = getRecentPrompts();
  const possible = countPossiblePrompts();
  let prompt = "";
  let selections = {};

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    selections = buildSelections();
    prompt = combinePrompt(selections);

    if (!prompt) return "";

    if (possible <= 1 || !recent.includes(prompt)) {
      rememberSelections(selections);
      return prompt;
    }
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    selections = buildSelections();
    prompt = combinePrompt(selections);
    if (prompt && prompt !== currentPrompt) {
      rememberSelections(selections);
      return prompt;
    }
  }

  rememberSelections(selections);
  return prompt;
}

function updatePromptMeta(selections) {
  const pills = Object.values(CATEGORIES)
    .filter((category) => selections[category.id])
    .map((category) => `<span class="meta-pill">${category.label}</span>`)
    .join("");

  if (!pills) {
    promptMetaEl.hidden = true;
    promptMetaEl.innerHTML = "";
    return;
  }

  promptMetaEl.hidden = false;
  promptMetaEl.innerHTML = pills;
}

function displayPrompt(prompt) {
  currentPrompt = prompt;
  promptTextEl.classList.remove("is-new", "is-placeholder");
  void promptTextEl.offsetWidth;
  promptTextEl.textContent = prompt;
  promptTextEl.classList.add("is-new");
  copyBtn.disabled = !prompt;
  updatePromptMeta(lastSelections);
}

function clearPromptDisplay(message) {
  currentPrompt = "";
  rememberSelections({});
  promptTextEl.classList.remove("is-new");
  promptTextEl.classList.add("is-placeholder");
  promptTextEl.textContent = message;
  promptMetaEl.hidden = true;
  promptMetaEl.innerHTML = "";
  copyBtn.disabled = true;
}

function addToHistory(prompt) {
  if (!prompt) return;
  promptHistory.unshift(prompt);
  if (promptHistory.length > 10) promptHistory.pop();
  renderHistory();
}

function renderHistory() {
  if (promptHistory.length === 0) {
    historyList.innerHTML = `<li class="history__empty">まだ履歴はありません</li>`;
    return;
  }

  historyList.innerHTML = promptHistory
    .map((item) => `<li class="history__item">${escapeHtml(item)}</li>`)
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function copyText(text, button, successLabel, idleLabel) {
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = successLabel;
    setTimeout(() => {
      button.textContent = idleLabel;
    }, 1500);
  } catch {
    button.textContent = "コピー失敗";
    setTimeout(() => {
      button.textContent = idleLabel;
    }, 1500);
  }
}

async function copyPrompt() {
  if (!currentPrompt) return;
  await copyText(currentPrompt, copyBtn, "コピーしました", "お題をコピー");
}

async function copyShareLink() {
  await copyText(getShareUrl(), shareBtn, "コピーしました", "リンクをコピー");
}

function applySharedSelections(selections) {
  rememberSelections(selections);

  for (const id of Object.keys(CATEGORIES)) {
    enabledCategories[id] = Boolean(selections[id]);
  }
  saveEnabledCategories();
  syncCategoryCheckboxes();

  const prompt = combinePrompt(selections);
  if (!prompt) return;

  displayPrompt(prompt);
  addToHistory(prompt);
}

function syncCategoryCheckboxes() {
  for (const id of Object.keys(CATEGORIES)) {
    const checkbox = document.querySelector(`[data-category-toggle="${id}"]`);
    if (checkbox) checkbox.checked = Boolean(enabledCategories[id]);
  }
}

function handlePickerChange(event) {
  const toggle = event.target.closest("[data-category-toggle]");
  if (!toggle) return;

  const categoryId = toggle.dataset.categoryToggle;
  if (!CATEGORIES[categoryId]) return;

  enabledCategories[categoryId] = toggle.checked;
  saveEnabledCategories();
}

function handleGenerate() {
  const prompt = generatePrompt();

  if (!prompt) {
    clearPromptDisplay("上の項目で、表情・感情・状況にチェックを入れてください。");
    return;
  }

  displayPrompt(prompt);
  addToHistory(prompt);
}

async function init() {
  if (!bindDomElements()) {
    console.error("Required DOM elements are missing.");
    return;
  }

  generateBtn.addEventListener("click", handleGenerate);
  copyBtn.addEventListener("click", copyPrompt);
  shareBtn.addEventListener("click", copyShareLink);
  categoryChips.addEventListener("change", handlePickerChange);

  const reloaded = isPageReload();
  if (reloaded) clearShareUrlFromAddressBar();

  const sharedSelections = reloaded ? null : readSelectionsFromUrl();
  if (!sharedSelections) loadEnabledCategories();

  syncCategoryCheckboxes();
  renderHistory();

  try {
    await loadAllCategories();
    if (sharedSelections) applySharedSelections(sharedSelections);
  } catch (error) {
    console.error(error);
    clearPromptDisplay(
      "データの読み込みに失敗しました。ローカルサーバーで起動してください。"
    );
    generateBtn.disabled = true;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
