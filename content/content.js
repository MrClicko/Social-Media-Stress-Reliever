const FEED_SELECTORS = [
  "[aria-label='Timeline: Your Home Timeline']",
  "[role='feed']",
  "div[data-pagelet='FeedUnit_{n}']",
  "main section",
  "ytd-rich-grid-renderer",
  "shreddit-feed"
];

const STYLE_ID = "stress-reliever-feed-style";

function injectStyle() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .stress-reliever-dimmed {
      filter: blur(6px) grayscale(0.9);
      pointer-events: none;
      user-select: none;
      transition: filter 0.2s ease-in-out;
    }

    .stress-reliever-banner {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      background: #1f2937;
      color: #f9fafb;
      border-radius: 10px;
      padding: 12px 14px;
      font-family: system-ui, sans-serif;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      max-width: 280px;
      line-height: 1.4;
    }
  `;
  document.head.appendChild(style);
}

function removeBanner() {
  const existing = document.querySelector(".stress-reliever-banner");
  if (existing) {
    existing.remove();
  }
}

function showBanner() {
  removeBanner();
  const banner = document.createElement("aside");
  banner.className = "stress-reliever-banner";
  banner.textContent = "Feed hidden for focus mode. Disable in the extension popup any time.";
  document.body.appendChild(banner);
}

function applyFeedFilter(hideFeeds) {
  injectStyle();

  FEED_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      node.classList.toggle("stress-reliever-dimmed", hideFeeds);
    });
  });

  if (hideFeeds) {
    showBanner();
  } else {
    removeBanner();
  }
}

function refreshFromSettings() {
  browser.runtime.sendMessage({ type: "GET_SETTINGS" }).then((settings) => {
    if (!settings.enabled) {
      applyFeedFilter(false);
      return;
    }

    applyFeedFilter(Boolean(settings.hideFeeds));
  });
}

const observer = new MutationObserver(() => {
  refreshFromSettings();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && (changes.enabled || changes.hideFeeds)) {
    refreshFromSettings();
  }
});

refreshFromSettings();
