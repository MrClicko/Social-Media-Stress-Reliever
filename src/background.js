const storage = browser.storage.local;
const MAX_LOG_ITEMS = 200;

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

function buildUserPrompt({ platform, threadText, postUrl }) {
  return [
    `Plattform: ${platform}`,
    `Beitrags-URL: ${postUrl}`,
    "",
    "Analysiere den folgenden Beitrag / Thread und formuliere eine passende Antwort nach den Regeln des System-Prompts.",
    "Beziehe dich insbesondere auf den Fokusbeitrag (letzte sichtbare Nachricht).",
    "",
    threadText
  ].join("\n");
}

async function callOpenAICompat({ baseUrl, apiKey, model, systemPrompt, userPrompt }) {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const response = await fetch(`${normalizedBase}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    throw new Error(`API Fehler (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim();
}

async function callAnthropic({ apiKey, model, systemPrompt, userPrompt }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      max_tokens: 500,
      messages: [{ role: "user", content: userPrompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API Fehler (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  return data?.content?.find((item) => item.type === "text")?.text?.trim();
}

async function callGoogle({ apiKey, model, systemPrompt, userPrompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.2 }
    })
  });

  if (!response.ok) {
    throw new Error(`Google API Fehler (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

async function callMistral({ apiKey, model, systemPrompt, userPrompt }) {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    throw new Error(`Mistral API Fehler (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim();
}

async function callProvider({ settings, platform, threadText, postUrl }) {
  const provider = settings.provider || "openai";
  const userPrompt = buildUserPrompt({ platform, threadText, postUrl });

  if (provider !== "local_openai" && !settings.apiKey) {
    throw new Error("Kein API-Key hinterlegt. Bitte in den Einstellungen setzen.");
  }

  let text = "";
  if (provider === "openai") {
    text = await callOpenAICompat({
      baseUrl: "https://api.openai.com",
      apiKey: settings.apiKey,
      model: settings.model,
      systemPrompt: settings.systemPrompt,
      userPrompt
    });
  } else if (provider === "local_openai") {
    if (!settings.endpoint) {
      throw new Error("Bitte lokale Netzwerkadresse für das lokale LLM eintragen.");
    }
    text = await callOpenAICompat({
      baseUrl: settings.endpoint,
      apiKey: settings.apiKey,
      model: settings.model,
      systemPrompt: settings.systemPrompt,
      userPrompt
    });
  } else if (provider === "anthropic") {
    text = await callAnthropic({
      apiKey: settings.apiKey,
      model: settings.model,
      systemPrompt: settings.systemPrompt,
      userPrompt
    });
  } else if (provider === "google") {
    text = await callGoogle({
      apiKey: settings.apiKey,
      model: settings.model,
      systemPrompt: settings.systemPrompt,
      userPrompt
    });
  } else if (provider === "mistral") {
    text = await callMistral({
      apiKey: settings.apiKey,
      model: settings.model,
      systemPrompt: settings.systemPrompt,
      userPrompt
    });
  } else {
    throw new Error("Unbekannter LLM-Provider.");
  }

  if (!text) {
    throw new Error("Keine Antwort vom LLM erhalten.");
  }

  return text;
}

async function appendLog(entry) {
  const result = await storage.get("logs");
  const logs = Array.isArray(result.logs) ? result.logs : [];
  const updated = [entry, ...logs].slice(0, MAX_LOG_ITEMS);
  await storage.set({ logs: updated });
}

async function getLogs() {
  const result = await storage.get("logs");
  return Array.isArray(result.logs) ? result.logs : [];
}

async function clearLogs() {
  await storage.set({ logs: [] });
}

browser.runtime.onMessage.addListener((message) => {
  if (message?.type === "smsr:getSettings") {
    return getSettings();
  }

  if (message?.type === "smsr:saveSettings") {
    return saveSettings(message.payload || {});
  }

  if (message?.type === "smsr:getLogs") {
    return getLogs();
  }

  if (message?.type === "smsr:clearLogs") {
    return clearLogs();
  }

  if (message?.type === "smsr:generateReply") {
    return (async () => {
      const settings = await getSettings();
      const generatedText = await callProvider({
        settings,
        platform: message.payload.platform,
        threadText: message.payload.threadText,
        postUrl: message.payload.postUrl
      });

      await appendLog({
        url: message.payload.postUrl,
        platform: message.payload.platform,
        provider: settings.provider,
        model: settings.model,
        generatedText,
        generatedAt: new Date().toISOString()
      });

      return generatedText;
    })();
  }

  return undefined;
});
