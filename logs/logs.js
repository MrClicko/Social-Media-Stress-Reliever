const statusNode = document.getElementById("status");
const listNode = document.getElementById("list");
const refreshButton = document.getElementById("refresh");
const clearButton = document.getElementById("clear");

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
    empty.textContent = "Noch keine Einträge vorhanden.";
    listNode.appendChild(empty);
    return;
  }

  for (const log of logs) {
    const wrapper = document.createElement("article");
    wrapper.className = "log-item";

    const meta = document.createElement("div");
    meta.className = "meta";

    const dateText = document.createTextNode(formatDate(log.generatedAt || new Date().toISOString()));
    meta.appendChild(createMetaLine("Datum", dateText));

    const urlLink = document.createElement("a");
    urlLink.href = log.url || "";
    urlLink.target = "_blank";
    urlLink.rel = "noopener noreferrer";
    urlLink.textContent = log.url || "(keine URL)";
    meta.appendChild(createMetaLine("URL", urlLink));

    const llmText = document.createTextNode(`${log.provider || "-"} / ${log.model || "-"}`);
    meta.appendChild(createMetaLine("LLM", llmText));

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
    setStatus(`${logs.length} Einträge geladen.`);
  } catch (error) {
    setStatus(error.message || String(error), true);
  }
}

refreshButton.addEventListener("click", loadLogs);
clearButton.addEventListener("click", async () => {
  try {
    await browser.runtime.sendMessage({ type: "smsr:clearLogs" });
    await loadLogs();
    setStatus("Protokoll gelöscht.");
  } catch (error) {
    setStatus(error.message || String(error), true);
  }
});

loadLogs();
