/**
 * 表情お題メーカー
 *
 * カテゴリ設定を追加するだけで、新しいテキストファイルを
 * 同じ仕組みで読み込めるように設計しています。
 *
 * 例: situations.txt を有効にする場合
 *   enabled: true に変更し、combinePrompt() のロジックを拡張
 */

// ========================================
// Category configuration
// ========================================
const CATEGORIES = {
  expression: {
    id: "expression",
    label: "Expression",
    file: "data/expressions.txt",
    enabled: true,
  },
  situation: {
    id: "situation",
    label: "Situation",
    file: "data/situations.txt",
    enabled: false, // 将来有効化: true に変更
  },
  // 将来の拡張例:
  // pose: { id: "pose", label: "Pose", file: "data/poses.txt", enabled: false },
  // dialogue: { id: "dialogue", label: "Dialogue", file: "data/dialogues.txt", enabled: false },
};

// ========================================
// State
// ========================================
const categoryData = {};
const promptHistory = [];
let currentPrompt = "";

// ========================================
// DOM elements
// ========================================
let promptTextEl;
let generateBtn;
let copyBtn;
let historyList;

function bindDomElements() {
  promptTextEl = document.getElementById("promptText");
  generateBtn = document.getElementById("generateBtn");
  copyBtn = document.getElementById("copyBtn");
  historyList = document.getElementById("historyList");

  return promptTextEl && generateBtn && copyBtn && historyList;
}

// ========================================
// Text file loader
// ========================================

/**
 * Load items from a text file.
 * Each non-empty line becomes one prompt item.
 * Lines starting with # are treated as comments.
 */
async function loadCategoryFile(category) {
  const response = await fetch(category.file);

  if (!response.ok) {
    throw new Error(`Failed to load ${category.file} (${response.status})`);
  }

  const text = await response.text();

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

/**
 * Load all enabled categories from their text files.
 */
async function loadAllCategories() {
  const enabledCategories = Object.values(CATEGORIES).filter((cat) => cat.enabled);

  await Promise.all(
    enabledCategories.map(async (category) => {
      categoryData[category.id] = await loadCategoryFile(category);
    })
  );
}

// ========================================
// Prompt generation
// ========================================

/** Pick a random item from an array. */
function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Build a combined prompt from enabled categories.
 *
 * Current: expression only → "Happy"
 * Future (situation enabled):
 *   → "Embarrassed after receiving unexpected praise"
 *   → "Nervous when meeting a crush unexpectedly"
 */
function combinePrompt(selections) {
  const expression = selections.expression;
  const situation = selections.situation;

  if (expression && situation) {
    const situationLower = situation.charAt(0).toLowerCase() + situation.slice(1);
    return `${expression} when ${situationLower}`;
  }

  if (expression) {
    return expression;
  }

  if (situation) {
    return situation;
  }

  return "";
}

/** Generate a new random prompt from loaded category data. */
function generatePrompt() {
  const selections = {};

  for (const category of Object.values(CATEGORIES)) {
    if (!category.enabled) continue;

    const items = categoryData[category.id];
    if (!items || items.length === 0) continue;

    selections[category.id] = pickRandom(items);
  }

  return combinePrompt(selections);
}

// ========================================
// UI updates
// ========================================

/** Display prompt with fade-in animation. */
function displayPrompt(prompt) {
  currentPrompt = prompt;

  promptTextEl.classList.remove("is-new", "is-placeholder");
  // Force reflow so the animation replays on each update
  void promptTextEl.offsetWidth;
  promptTextEl.textContent = prompt;
  promptTextEl.classList.add("is-new");

  copyBtn.disabled = !prompt;
}

/** Add prompt to history list (newest first, max 10). */
function addToHistory(prompt) {
  if (!prompt) return;

  promptHistory.unshift(prompt);
  if (promptHistory.length > 10) {
    promptHistory.pop();
  }

  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = promptHistory
    .map((item) => `<li class="history-item">${escapeHtml(item)}</li>`)
    .join("");
}

/** Prevent XSS when rendering history items. */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/** Copy current prompt to clipboard. */
async function copyPrompt() {
  if (!currentPrompt) return;

  try {
    await navigator.clipboard.writeText(currentPrompt);
    const originalLabel = copyBtn.textContent;
    copyBtn.textContent = "コピーしました";
    setTimeout(() => {
      copyBtn.textContent = originalLabel;
    }, 1500);
  } catch {
    copyBtn.textContent = "コピー失敗";
    setTimeout(() => {
      copyBtn.textContent = "コピー";
    }, 1500);
  }
}

// ========================================
// Event handlers
// ========================================

function handleGenerate() {
  const prompt = generatePrompt();

  if (!prompt) {
    promptTextEl.textContent = "お題が見つかりません。data フォルダを確認してください。";
    copyBtn.disabled = true;
    return;
  }

  displayPrompt(prompt);
  addToHistory(prompt);
}

// ========================================
// Initialization
// ========================================

async function init() {
  if (!bindDomElements()) {
    console.error("Required DOM elements are missing.");
    return;
  }

  generateBtn.addEventListener("click", handleGenerate);
  copyBtn.addEventListener("click", copyPrompt);
  renderHistory();

  try {
    await loadAllCategories();
  } catch (error) {
    console.error(error);
    promptTextEl.textContent =
      "データの読み込みに失敗しました。ローカルサーバーで起動してください。";
    generateBtn.disabled = true;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
