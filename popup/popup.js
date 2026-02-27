const formFields = {
  enabled: document.getElementById("enabled"),
  hideFeeds: document.getElementById("hideFeeds"),
  breakIntervalMinutes: document.getElementById("breakIntervalMinutes")
};
const saveButton = document.getElementById("saveButton");
const statusNode = document.getElementById("status");

function renderStatus(message) {
  statusNode.textContent = message;
  setTimeout(() => {
    if (statusNode.textContent === message) {
      statusNode.textContent = "";
    }
  }, 2000);
}

function loadSettings() {
  browser.runtime.sendMessage({ type: "GET_SETTINGS" }).then((settings) => {
    formFields.enabled.checked = Boolean(settings.enabled);
    formFields.hideFeeds.checked = Boolean(settings.hideFeeds);
    formFields.breakIntervalMinutes.value = Number(settings.breakIntervalMinutes || 20);
  });
}

function saveSettings() {
  const breakIntervalMinutes = Math.max(5, Math.min(90, Number(formFields.breakIntervalMinutes.value)));

  browser.runtime
    .sendMessage({
      type: "UPDATE_SETTINGS",
      enabled: formFields.enabled.checked,
      hideFeeds: formFields.hideFeeds.checked,
      breakIntervalMinutes
    })
    .then(() => {
      renderStatus("Saved.");
      formFields.breakIntervalMinutes.value = breakIntervalMinutes;
    });
}

saveButton.addEventListener("click", saveSettings);
loadSettings();
