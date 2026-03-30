const runButton = document.getElementById("runButton");
const statusNode = document.getElementById("status");
const openOptionsLink = document.getElementById("openOptions");
const openLogsLink = document.getElementById("openLogs");

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.style.color = isError ? "#d1242f" : "#1f2328";
}

async function withActiveTab(callback) {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.id) {
    throw new Error("Kein aktiver Tab gefunden.");
  }
  return callback(tab.id);
}

runButton.addEventListener("click", async () => {
  runButton.disabled = true;
  setStatus("Lese Thread und kontaktiere LLM ...");

  try {
    const result = await withActiveTab((tabId) =>
      browser.tabs.sendMessage(tabId, {
        type: "smsr:run"
      })
    );

    const suffix = result.truncated ? "\nHinweis: Antwort wurde auf Plattform-Limit gekürzt." : "";
    setStatus(`Erledigt auf ${result.platform}.\nZeichen eingefügt: ${result.insertedLength}.${suffix}`);
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
