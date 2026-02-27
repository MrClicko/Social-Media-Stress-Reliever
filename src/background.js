const storage = browser.storage.local;

async function getSettings() {
  const result = await storage.get("settings");
  return { ...SMSR_DEFAULT_SETTINGS, ...(result.settings || {}) };
}

async function saveSettings(partialSettings) {
  const current = await getSettings();
  const merged = { ...current, ...partialSettings };
  await storage.set({ settings: merged });
  return merged;
}

async function callOpenAI({ settings, platform, threadText }) {
  if (!settings.apiKey) {
    throw new Error("Kein API-Key hinterlegt. Bitte in den Einstellungen setzen.");
  }

  const userPrompt = [
    `Plattform: ${platform}`,
    "",
    "Analysiere den folgenden Beitrag / Thread und formuliere eine passende Antwort nach den Regeln des System-Prompts:",
    "",
    threadText
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: "system", content: settings.systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API Fehler (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Keine Antwort vom LLM erhalten.");
  }
  return text;
}

browser.runtime.onMessage.addListener((message) => {
  if (message?.type === "smsr:getSettings") {
    return getSettings();
  }

  if (message?.type === "smsr:saveSettings") {
    return saveSettings(message.payload || {});
  }

  if (message?.type === "smsr:generateReply") {
    return (async () => {
      const settings = await getSettings();
      return callOpenAI({
        settings,
        platform: message.payload.platform,
        threadText: message.payload.threadText
      });
    })();
  }

  return undefined;
});
