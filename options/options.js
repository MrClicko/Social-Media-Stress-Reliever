const providerInput = document.getElementById("provider");
const modelInput = document.getElementById("model");
const apiKeyInput = document.getElementById("apiKey");
const maxThreadPostsInput = document.getElementById("maxThreadPosts");
const systemPromptInput = document.getElementById("systemPrompt");
const saveButton = document.getElementById("save");
const resetButton = document.getElementById("reset");
const statusNode = document.getElementById("status");

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.style.color = isError ? "#d1242f" : "#1f2328";
}

async function loadSettings() {
  const settings = await browser.runtime.sendMessage({ type: "smsr:getSettings" });
  providerInput.value = settings.provider;
  modelInput.value = settings.model;
  apiKeyInput.value = settings.apiKey;
  maxThreadPostsInput.value = String(settings.maxThreadPosts);
  systemPromptInput.value = settings.systemPrompt;
}

async function saveSettings() {
  const maxThreadPosts = Number(maxThreadPostsInput.value);
  if (!Number.isFinite(maxThreadPosts) || maxThreadPosts < 1) {
    throw new Error("Max. Beiträge pro Thread muss mindestens 1 sein.");
  }

  const payload = {
    provider: providerInput.value,
    model: modelInput.value.trim(),
    apiKey: apiKeyInput.value.trim(),
    maxThreadPosts,
    systemPrompt: systemPromptInput.value.trim()
  };

  if (!payload.model) {
    throw new Error("Bitte ein Modell eintragen.");
  }

  if (!payload.systemPrompt) {
    throw new Error("System-Prompt darf nicht leer sein.");
  }

  await browser.runtime.sendMessage({
    type: "smsr:saveSettings",
    payload
  });
}

saveButton.addEventListener("click", async () => {
  saveButton.disabled = true;

  try {
    await saveSettings();
    setStatus("Einstellungen gespeichert.");
  } catch (error) {
    setStatus(error.message || String(error), true);
  } finally {
    saveButton.disabled = false;
  }
});

resetButton.addEventListener("click", () => {
  modelInput.value = SMSR_DEFAULT_SETTINGS.model;
  apiKeyInput.value = SMSR_DEFAULT_SETTINGS.apiKey;
  maxThreadPostsInput.value = String(SMSR_DEFAULT_SETTINGS.maxThreadPosts);
  systemPromptInput.value = SMSR_DEFAULT_SETTINGS.systemPrompt;
  setStatus("Standardwerte geladen. Zum Übernehmen auf Speichern klicken.");
});

loadSettings().catch((error) => {
  setStatus(error.message || String(error), true);
});
