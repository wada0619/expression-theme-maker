/**
 * 今日のお題
 * 日本時間(Asia/Tokyo)の日付をシードに、全員同じお題を決定的に生成する。
 */

const DAILY_CATEGORIES = {
  expression: { id: "expression", label: "表情", file: "data/expressions.txt" },
  emotion: { id: "emotion", label: "感情", file: "data/emotions.txt" },
  situation: { id: "situation", label: "状況", file: "data/situations.txt" },
};

function getJstDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatJstDateLabel(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

function hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWithRng(items, rng) {
  if (!items || items.length === 0) return "";
  return items[Math.floor(rng() * items.length)];
}

async function loadLines(file) {
  const response = await fetch(file);
  if (!response.ok) {
    throw new Error(`Failed to load ${file} (${response.status})`);
  }

  return (await response.text())
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function buildDailyPrompt(pools, dateKey) {
  const rng = createRng(hashString(`expression-theme-maker:${dateKey}`));
  const selections = {};

  for (const category of Object.values(DAILY_CATEGORIES)) {
    selections[category.id] = pickWithRng(pools[category.id], rng);
  }

  const prompt = Object.values(DAILY_CATEGORIES)
    .map((category) => `${category.label}：${selections[category.id]}`)
    .join("\n");

  return { prompt, selections };
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

async function initDaily() {
  const dateEl = document.getElementById("dailyDate");
  const promptEl = document.getElementById("dailyPrompt");
  const metaEl = document.getElementById("dailyMeta");
  const copyBtn = document.getElementById("dailyCopyBtn");

  if (!dateEl || !promptEl || !metaEl || !copyBtn) return;

  const dateKey = getJstDateKey();
  dateEl.textContent = formatJstDateLabel(dateKey);

  try {
    const pools = {};
    await Promise.all(
      Object.values(DAILY_CATEGORIES).map(async (category) => {
        pools[category.id] = await loadLines(category.file);
      })
    );

    const { prompt, selections } = buildDailyPrompt(pools, dateKey);
    promptEl.textContent = prompt;
    promptEl.classList.remove("is-placeholder");

    metaEl.hidden = false;
    metaEl.innerHTML = Object.values(DAILY_CATEGORIES)
      .filter((category) => selections[category.id])
      .map((category) => `<span class="meta-pill">${category.label}</span>`)
      .join("");

    copyBtn.disabled = false;
    copyBtn.addEventListener("click", () => {
      copyText(prompt, copyBtn, "コピーしました", "お題をコピー");
    });
  } catch (error) {
    console.error(error);
    promptEl.textContent =
      "データの読み込みに失敗しました。ローカルサーバーで起動してください。";
    promptEl.classList.add("is-placeholder");
    copyBtn.disabled = true;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDaily);
} else {
  initDaily();
}
