const statusNode = document.getElementById("status");
const listNode = document.getElementById("list");
const refreshButton = document.getElementById("refresh");
const clearButton = document.getElementById("clear");

const I18N = {
  de: {
    title: "Protokoll generierter Antworten",
    subtitle: "Gespeichert werden URL, generierte Antwort sowie Datum/Uhrzeit der Generierung.",
    refresh: "Neu laden",
    clear: "Protokoll löschen",
    noEntries: "Noch keine Einträge vorhanden.",
    loaded: "{count} Einträge geladen.",
    deleted: "Protokoll gelöscht.",
    date: "Datum",
    url: "URL",
    llm: "LLM"
  },
  en: {
    title: "Generated reply log",
    subtitle: "Stored items: post URL, generated reply, and generation date/time.",
    refresh: "Reload",
    clear: "Clear log",
    noEntries: "No entries yet.",
    loaded: "{count} entries loaded.",
    deleted: "Log cleared.",
    date: "Date",
    url: "URL",
    llm: "LLM"
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

function setStatus(text, isError = false) {
  statusNode.textContent = text;
  statusNode.style.color = isError ? "#d1242f" : "#1f2328";
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString();
}

function createMetaLine(label, valueNode) {
  const line = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  line.appendChild(strong);
  line.appendChild(valueNode);
  return line;
}

function renderLogs(logs) {
  listNode.innerHTML = "";

  if (!logs.length) {
    const empty = document.createElement("p");
    empty.textContent = t("noEntries");
    listNode.appendChild(empty);
    return;
  }

  for (const log of logs) {
    const wrapper = document.createElement("article");
    wrapper.className = "log-item";

    const meta = document.createElement("div");
    meta.className = "meta";

    const dateText = document.createTextNode(formatDate(log.generatedAt || new Date().toISOString()));
    meta.appendChild(createMetaLine(t("date"), dateText));

    const urlLink = document.createElement("a");
    urlLink.href = log.url || "";
    urlLink.target = "_blank";
    urlLink.rel = "noopener noreferrer";
    urlLink.textContent = log.url || "(no URL)";
    meta.appendChild(createMetaLine(t("url"), urlLink));

    const llmText = document.createTextNode(`${log.provider || "-"} / ${log.model || "-"}`);
    meta.appendChild(createMetaLine(t("llm"), llmText));

    const response = document.createElement("pre");
    response.className = "response";
    response.textContent = log.generatedText || "";

    wrapper.appendChild(meta);
    wrapper.appendChild(response);
    listNode.appendChild(wrapper);
  }
}

async function loadLogs() {
  try {
    const logs = await browser.runtime.sendMessage({ type: "smsr:getLogs" });
    renderLogs(logs);
    setStatus(t("loaded").replace("{count}", logs.length));
  } catch (error) {
    setStatus(error.message || String(error), true);
  }
}

refreshButton.addEventListener("click", loadLogs);
clearButton.addEventListener("click", async () => {
  try {
    await browser.runtime.sendMessage({ type: "smsr:clearLogs" });
    await loadLogs();
    setStatus(t("deleted"));
  } catch (error) {
    setStatus(error.message || String(error), true);
  }
});

(async () => {
  try {
    const settings = await browser.runtime.sendMessage({ type: "smsr:getSettings" });
    currentLanguage = settings.uiLanguage || "de";
  } catch (_error) {
    currentLanguage = "de";
  }
  applyI18n();
  await loadLogs();
})();
