const providerInput = document.getElementById("provider");
const uiLanguageInput = document.getElementById("uiLanguage");
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

const I18N = {
  de: {
    appTitle: "Social Media Stress Reliever FF",
    safetyHint: "Safety-First: Die Erweiterung sendet nie automatisch. Sie fügt nur einen Entwurf ins Antwortfeld ein.",
    uiLanguage: "Sprache / Language",
    provider: "LLM-Provider",
    localEndpoint: "Lokale Netzwerkadresse",
    model: "Modell",
    maxPosts: "Max. Beiträge pro Thread",
    systemPrompt: "System-Prompt (vollständig editierbar)",
    save: "Speichern",
    reset: "Auf Standard zurücksetzen",
    openLogs: "Protokoll öffnen",
    about: "Per Vibe-Coding hergestellt durch Matthias Schüssler, matthias@clickomania.ch",
    statusSaved: "Einstellungen gespeichert.",
    statusReset: "Standardwerte geladen. Zum Übernehmen auf Speichern klicken.",
    errMaxPosts: "Max. Beiträge pro Thread muss mindestens 1 sein.",
    errModel: "Bitte ein Modell eintragen.",
    errPrompt: "System-Prompt darf nicht leer sein.",
    errApi: "Bitte API-Schlüssel eintragen.",
    errEndpoint: "Bitte lokale Netzwerkadresse eintragen.",
    errEndpointScheme: "Netzwerkadresse muss mit http:// oder https:// beginnen.",
    apiLabel: "API-Schlüssel",
    optionalApiLabel: "Optionaler API-Schlüssel"
  },
  en: {
    appTitle: "Social Media Stress Reliever FF",
    safetyHint: "Safety first: this extension never sends automatically. It only inserts a draft into the reply field.",
    uiLanguage: "Language / Sprache",
    provider: "LLM provider",
    localEndpoint: "Local network endpoint",
    model: "Model",
    maxPosts: "Max posts per thread",
    systemPrompt: "System prompt (fully editable)",
    save: "Save",
    reset: "Reset to defaults",
    openLogs: "Open log",
    about: "Built via vibe coding by Matthias Schüssler, matthias@clickomania.ch",
    statusSaved: "Settings saved.",
    statusReset: "Default values loaded. Click Save to apply.",
    errMaxPosts: "Max posts per thread must be at least 1.",
    errModel: "Please enter a model.",
    errPrompt: "System prompt must not be empty.",
    errApi: "Please enter an API key.",
    errEndpoint: "Please enter the local endpoint.",
    errEndpointScheme: "Endpoint must start with http:// or https://.",
    apiLabel: "API key",
    optionalApiLabel: "Optional API key"
  }
};

let currentLanguage = "de";

function t(key) {
  return (I18N[currentLanguage] && I18N[currentLanguage][key]) || I18N.de[key] || key;
}

function applyStaticI18n() {
  document.documentElement.lang = currentLanguage;
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = t(node.dataset.i18n);
  }
}

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.style.color = isError ? "#d1242f" : "#1f2328";
}

function applyProviderUI(provider) {
  const meta = SMSR_PROVIDERS[provider] || SMSR_PROVIDERS.openai;
  const isLocal = provider === "local_openai";

  credentialLabel.textContent = isLocal ? t("optionalApiLabel") : `${t("apiLabel")} (${meta.label})`;
  apiKeyInput.placeholder = isLocal ? "Optional" : "API-Key";

  endpointGroup.classList.toggle("hidden", !isLocal);

  if (!modelInput.value.trim()) {
    modelInput.value = meta.defaultModel;
  }
}

function maybeApplyDefaultPromptForLanguage(previousLanguage, nextLanguage) {
  const currentPrompt = systemPromptInput.value.trim();
  const wasOldDefault = currentPrompt === SMSR_PROMPTS[previousLanguage];
  if (wasOldDefault) {
    systemPromptInput.value = SMSR_PROMPTS[nextLanguage];
  }
}

async function loadSettings() {
  const settings = await browser.runtime.sendMessage({ type: "smsr:getSettings" });
  currentLanguage = settings.uiLanguage || "de";
  uiLanguageInput.value = currentLanguage;

  applyStaticI18n();

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
    throw new Error(t("errMaxPosts"));
  }

  payload.maxThreadPosts = maxThreadPosts;

  if (!payload.model) {
    throw new Error(t("errModel"));
  }

  if (!payload.systemPrompt) {
    throw new Error(t("errPrompt"));
  }

  if (payload.provider !== "local_openai" && !payload.apiKey) {
    throw new Error(t("errApi"));
  }

  if (payload.provider === "local_openai" && !payload.endpoint) {
    throw new Error(t("errEndpoint"));
  }

  if (payload.endpoint && !/^https?:\/\//i.test(payload.endpoint)) {
    throw new Error(t("errEndpointScheme"));
  }
}

async function saveSettings() {
  const payload = {
    provider: providerInput.value,
    model: modelInput.value.trim(),
    apiKey: apiKeyInput.value.trim(),
    endpoint: endpointInput.value.trim(),
    maxThreadPosts: maxThreadPostsInput.value,
    uiLanguage: uiLanguageInput.value,
    systemPrompt: systemPromptInput.value.trim()
  };

  validateSettings(payload);

  await browser.runtime.sendMessage({
    type: "smsr:saveSettings",
    payload
  });
}

uiLanguageInput.addEventListener("change", () => {
  const previousLanguage = currentLanguage;
  currentLanguage = uiLanguageInput.value;
  applyStaticI18n();
  maybeApplyDefaultPromptForLanguage(previousLanguage, currentLanguage);
  applyProviderUI(providerInput.value);
});

providerInput.addEventListener("change", () => {
  const selected = providerInput.value;
  modelInput.value = SMSR_PROVIDERS[selected].defaultModel;
  applyProviderUI(selected);
});

saveButton.addEventListener("click", async () => {
  saveButton.disabled = true;

  try {
    await saveSettings();
    setStatus(t("statusSaved"));
  } catch (error) {
    setStatus(error.message || String(error), true);
  } finally {
    saveButton.disabled = false;
  }
});

resetButton.addEventListener("click", () => {
  currentLanguage = uiLanguageInput.value;
  providerInput.value = SMSR_DEFAULT_SETTINGS.provider;
  modelInput.value = SMSR_PROVIDERS[providerInput.value].defaultModel;
  apiKeyInput.value = SMSR_DEFAULT_SETTINGS.apiKey;
  endpointInput.value = SMSR_DEFAULT_SETTINGS.endpoint;
  maxThreadPostsInput.value = String(SMSR_DEFAULT_SETTINGS.maxThreadPosts);
  systemPromptInput.value = SMSR_PROMPTS[currentLanguage] || SMSR_PROMPTS.de;
  applyStaticI18n();
  applyProviderUI(providerInput.value);
  setStatus(t("statusReset"));
});

openLogsButton.addEventListener("click", () => {
  browser.tabs.create({ url: browser.runtime.getURL("logs/logs.html") });
});

loadSettings().catch((error) => {
  setStatus(error.message || String(error), true);
});
