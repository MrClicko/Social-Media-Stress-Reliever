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

function renderLogs(logs) {
  listNode.innerHTML = "";

  if (!logs.length) {
    listNode.innerHTML = "<p>Noch keine Einträge vorhanden.</p>";
    return;
  }

  for (const log of logs) {
    const wrapper = document.createElement("article");
    wrapper.className = "log-item";

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <div><strong>Datum:</strong> ${formatDate(log.generatedAt)}</div>
      <div><strong>URL:</strong> <a href="${log.url}" target="_blank" rel="noopener noreferrer">${log.url}</a></div>
      <div><strong>LLM:</strong> ${log.provider} / ${log.model}</div>
    `;

    const response = document.createElement("pre");
    response.className = "response";
    response.textContent = log.generatedText;

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
