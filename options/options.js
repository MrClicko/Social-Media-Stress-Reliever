const providerInput = document.getElementById("provider");
const credentialLabel = document.getElementById("credentialLabel");
const modelInput = document.getElementById("model");
const apiKeyInput = document.getElementById("apiKey");
const endpointGroup = document.getElementById("endpointGroup");
const endpointInput = document.getElementById("endpoint");
const maxThreadPostsInput = document.getElementById("maxThreadPosts");
const systemPromptInput = document.getElementById("systemPrompt");
const saveButton = document.getElementById("save");
const resetButton = document.getElementById("reset");
const openLogsButton = document.getElementById("openLogs");
const statusNode = document.getElementById("status");

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.style.color = isError ? "#d1242f" : "#1f2328";
}

function applyProviderUI(provider) {
  const meta = SMSR_PROVIDERS[provider] || SMSR_PROVIDERS.openai;
  const isLocal = provider === "local_openai";

  credentialLabel.textContent = isLocal ? "Optionaler API-Schlüssel" : `API-Schlüssel (${meta.label})`;
  apiKeyInput.placeholder = isLocal ? "Optional" : "API-Key";

  endpointGroup.classList.toggle("hidden", !isLocal);

  if (!modelInput.value.trim()) {
    modelInput.value = meta.defaultModel;
  }
}

async function loadSettings() {
  const settings = await browser.runtime.sendMessage({ type: "smsr:getSettings" });
  providerInput.value = settings.provider;
  modelInput.value = settings.model;
  apiKeyInput.value = settings.apiKey;
  endpointInput.value = settings.endpoint || SMSR_DEFAULT_SETTINGS.endpoint;
  maxThreadPostsInput.value = String(settings.maxThreadPosts);
  systemPromptInput.value = settings.systemPrompt;
  applyProviderUI(settings.provider);
}

function validateSettings(payload) {
  const maxThreadPosts = Number(payload.maxThreadPosts);
  if (!Number.isFinite(maxThreadPosts) || maxThreadPosts < 1) {
    throw new Error("Max. Beiträge pro Thread muss mindestens 1 sein.");
  }

  payload.maxThreadPosts = maxThreadPosts;

  if (!payload.model) {
    throw new Error("Bitte ein Modell eintragen.");
  }

  if (!payload.systemPrompt) {
    throw new Error("System-Prompt darf nicht leer sein.");
  }

  if (payload.provider !== "local_openai" && !payload.apiKey) {
    throw new Error("Bitte API-Schlüssel eintragen.");
  }

  if (payload.provider === "local_openai" && !payload.endpoint) {
    throw new Error("Bitte lokale Netzwerkadresse eintragen.");
  }

  if (payload.endpoint && !/^https?:\/\//i.test(payload.endpoint)) {
    throw new Error("Netzwerkadresse muss mit http:// oder https:// beginnen.");
  }
}

async function saveSettings() {
  const payload = {
    provider: providerInput.value,
    model: modelInput.value.trim(),
    apiKey: apiKeyInput.value.trim(),
    endpoint: endpointInput.value.trim(),
    maxThreadPosts: maxThreadPostsInput.value,
    systemPrompt: systemPromptInput.value.trim()
  };

  validateSettings(payload);

  await browser.runtime.sendMessage({
    type: "smsr:saveSettings",
    payload
  });
}

providerInput.addEventListener("change", () => {
  const selected = providerInput.value;
  modelInput.value = SMSR_PROVIDERS[selected].defaultModel;
  applyProviderUI(selected);
});

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
  providerInput.value = SMSR_DEFAULT_SETTINGS.provider;
  modelInput.value = SMSR_DEFAULT_SETTINGS.model;
  apiKeyInput.value = SMSR_DEFAULT_SETTINGS.apiKey;
  endpointInput.value = SMSR_DEFAULT_SETTINGS.endpoint;
  maxThreadPostsInput.value = String(SMSR_DEFAULT_SETTINGS.maxThreadPosts);
  systemPromptInput.value = SMSR_DEFAULT_SETTINGS.systemPrompt;
  applyProviderUI(providerInput.value);
  setStatus("Standardwerte geladen. Zum Übernehmen auf Speichern klicken.");
});

openLogsButton.addEventListener("click", () => {
  browser.tabs.create({ url: browser.runtime.getURL("logs/logs.html") });
});

loadSettings().catch((error) => {
  setStatus(error.message || String(error), true);
});
