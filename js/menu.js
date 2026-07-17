/**
 * 共通サイドメニュー（開閉）
 */
function initSideMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const sideMenu = document.getElementById("sideMenu");
  const sideMenuBackdrop = document.getElementById("sideMenuBackdrop");
  const sideMenuClose = document.getElementById("sideMenuClose");

  if (!menuToggle || !sideMenu || !sideMenuBackdrop || !sideMenuClose) return;

  function openSideMenu() {
    sideMenu.classList.add("is-open");
    sideMenu.setAttribute("aria-hidden", "false");
    sideMenuBackdrop.hidden = false;
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
  }

  function closeSideMenu() {
    sideMenu.classList.remove("is-open");
    sideMenu.setAttribute("aria-hidden", "true");
    sideMenuBackdrop.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }

  function toggleSideMenu() {
    if (sideMenu.classList.contains("is-open")) {
      closeSideMenu();
    } else {
      openSideMenu();
    }
  }

  menuToggle.addEventListener("click", toggleSideMenu);
  sideMenuClose.addEventListener("click", closeSideMenu);
  sideMenuBackdrop.addEventListener("click", closeSideMenu);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSideMenu();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSideMenu);
} else {
  initSideMenu();
}
