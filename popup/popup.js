const runButton = document.getElementById("runButton");
const statusNode = document.getElementById("status");
const openOptionsLink = document.getElementById("openOptions");
const openLogsLink = document.getElementById("openLogs");

const I18N = {
  de: {
    title: "Stress Reliever FF",
    hint: "Öffne einen Beitrag auf Facebook, X, Bluesky, Mastodon oder LinkedIn und starte die Analyse.",
    run: "Analysieren & Antwort einfügen",
    openOptions: "Einstellungen öffnen",
    openLogs: "Protokoll öffnen",
    busy: "Lese Thread und kontaktiere LLM ...",
    done: "Erledigt auf {platform}.\nZeichen eingefügt: {count}.",
    truncated: "\nHinweis: Antwort wurde auf Plattform-Limit gekürzt.",
    noTab: "Kein aktiver Tab gefunden."
  },
  en: {
    title: "Stress Reliever FF",
    hint: "Open a post on Facebook, X, Bluesky, Mastodon, or LinkedIn and start the analysis.",
    run: "Analyze & insert reply",
    openOptions: "Open settings",
    openLogs: "Open log",
    busy: "Reading thread and contacting LLM ...",
    done: "Done on {platform}.\nCharacters inserted: {count}.",
    truncated: "\nNote: reply was truncated to the platform limit.",
    noTab: "No active tab found."
  }
};

let currentLanguage = "de";

function t(key) {
  return (I18N[currentLanguage] && I18N[currentLanguage][key]) || I18N.de[key] || key;
}

function applyI18n() {
  document.documentElement.lang = currentLanguage;
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = t(node.dataset.i18n);
  }
}

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.style.color = isError ? "#d1242f" : "#1f2328";
}

async function withActiveTab(callback) {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.id) {
    throw new Error(t("noTab"));
  }
  return callback(tab.id);
}

runButton.addEventListener("click", async () => {
  runButton.disabled = true;
  setStatus(t("busy"));

  try {
    const result = await withActiveTab((tabId) =>
      browser.tabs.sendMessage(tabId, {
        type: "smsr:run"
      })
    );

    const suffix = result.truncated ? t("truncated") : "";
    setStatus(t("done").replace("{platform}", result.platform).replace("{count}", result.insertedLength) + suffix);
  } catch (error) {
    setStatus(error.message || String(error), true);
  } finally {
    runButton.disabled = false;
  }
});

openOptionsLink.addEventListener("click", (event) => {
  event.preventDefault();
  browser.runtime.openOptionsPage();
});

openLogsLink.addEventListener("click", (event) => {
  event.preventDefault();
  browser.tabs.create({ url: browser.runtime.getURL("logs/logs.html") });
});

(async () => {
  try {
    const settings = await browser.runtime.sendMessage({ type: "smsr:getSettings" });
    currentLanguage = settings.uiLanguage || "de";
  } catch (_error) {
    currentLanguage = "de";
  }
  applyI18n();
})();
