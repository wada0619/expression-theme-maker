/**
 * Google Analytics 4
 *
 * 測定IDの取得手順:
 * 1. https://analytics.google.com/ でアカウント・プロパティを作成
 * 2. データストリーム（ウェブ）を追加
 * 3. 測定ID（G- で始まる文字列）をコピー
 * 4. 下の GA_MEASUREMENT_ID に貼り付けて保存・公開する
 */
const GA_MEASUREMENT_ID = "G-S9DB3BD8KW";

(function initGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || !GA_MEASUREMENT_ID.startsWith("G-")) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
})();
