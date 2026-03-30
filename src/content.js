(function () {
  const HOST_MAP = [
    { pattern: /facebook\.com$/, platform: "Facebook", limit: null },
    { pattern: /(?:^|\.)x\.com$/, platform: "X", limit: 280 },
    { pattern: /twitter\.com$/, platform: "X", limit: 280 },
    { pattern: /bsky\.app$/, platform: "Bluesky", limit: 300 },
    { pattern: /linkedin\.com$/, platform: "LinkedIn", limit: null },
    { pattern: /mastodon\./, platform: "Mastodon", limit: null }
  ];

  function detectPlatform() {
    const host = location.hostname;
    for (const entry of HOST_MAP) {
      if (entry.pattern.test(host)) {
        return entry;
      }
    }

    if (document.querySelector("a[href*='mastodon']") || host.includes("social") || host.includes("fediverse")) {
      return { platform: "Mastodon", limit: null };
    }

    return null;
  }

  function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function collectBySelectors(selectors, maxItems) {
    const texts = [];
    for (const selector of selectors) {
      const nodes = document.querySelectorAll(selector);
      for (const node of nodes) {
        const text = normalizeText(node.innerText || node.textContent);
        if (text && !texts.includes(text)) {
          texts.push(text);
          if (texts.length >= maxItems) {
            return texts;
          }
        }
      }
    }
    return texts;
  }

  function extractThread(platform, maxPosts) {
    const selectorMap = {
      Facebook: ["div[role='article']", "div[data-ad-preview='message']", "div[dir='auto']"],
      X: ["article [data-testid='tweetText']", "article"],
      Bluesky: ["div[data-testid='postText']", "div[role='article']"],
      LinkedIn: ["div.feed-shared-update-v2__description", "div.update-components-text"],
      Mastodon: ["div.status__content", "article", "div.e-content"]
    };

    const selectors = selectorMap[platform] || ["article", "main", "div[role='article']"];
    const snippets = collectBySelectors(selectors, maxPosts);

    if (!snippets.length) {
      const fallback = normalizeText(document.body?.innerText || "").slice(0, 4000);
      if (fallback) {
        snippets.push(fallback);
      }
    }

    const bounded = snippets.slice(0, maxPosts);
    const focusText = bounded[bounded.length - 1] || "";

    return [
      bounded.map((text, index) => `Beitrag ${index + 1}: ${text}`).join("\n\n"),
      "",
      `Fokusbeitrag (letzte sichtbare Nachricht): ${focusText}`
    ].join("\n");
  }

  function focusAndInsertText(text) {
    const candidates = ["div[role='textbox']", "div.public-DraftEditor-content", "textarea", "div[contenteditable='true']"];

    let target = null;
    for (const selector of candidates) {
      target = document.querySelector(selector);
      if (target) {
        break;
      }
    }

    if (!target) {
      throw new Error("Kein Antwortfeld gefunden. Bitte Antwortfeld manuell öffnen und erneut versuchen.");
    }

    target.focus();

    if (target.tagName.toLowerCase() === "textarea" || target.tagName.toLowerCase() === "input") {
      target.value = text;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    target.innerText = text;
    target.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
  }

  function clickReplyIfPossible(platform) {
    const buttonTextPatterns = [/antworten/i, /reply/i, /respond/i, /replizieren/i];
    const platformSelectors = {
      Facebook: ["div[aria-label='Kommentieren']", "div[aria-label='Kommentar schreiben']"],
      X: ["button[data-testid='reply']", "div[data-testid='reply']"],
      Bluesky: ["button[aria-label*='Reply']", "button[aria-label*='Antworten']"],
      LinkedIn: ["button[aria-label*='Kommentieren']", "button[aria-label*='Comment']"],
      Mastodon: ["button[title*='Antworten']", "button[title*='Reply']"]
    };

    const selectors = platformSelectors[platform] || [];
    for (const selector of selectors) {
      const button = document.querySelector(selector);
      if (button) {
        button.click();
        return;
      }
    }

    const buttons = Array.from(document.querySelectorAll("button, div[role='button'], a"));
    const byText = buttons.find((el) => {
      const text = normalizeText(el.innerText || el.getAttribute("aria-label") || "");
      return buttonTextPatterns.some((pattern) => pattern.test(text));
    });

    if (byText) {
      byText.click();
    }
  }

  async function run() {
    const platformInfo = detectPlatform();
    if (!platformInfo) {
      throw new Error("Diese Plattform wird aktuell nicht unterstützt.");
    }

    const settings = await browser.runtime.sendMessage({ type: "smsr:getSettings" });
    const threadText = extractThread(platformInfo.platform, settings.maxThreadPosts || 20);

    if (!threadText) {
      throw new Error("Kein Beitragstext gefunden.");
    }

    const reply = await browser.runtime.sendMessage({
      type: "smsr:generateReply",
      payload: {
        platform: platformInfo.platform,
        threadText,
        postUrl: location.href
      }
    });

    clickReplyIfPossible(platformInfo.platform);
    await new Promise((resolve) => setTimeout(resolve, 250));

    const text = platformInfo.limit ? reply.slice(0, platformInfo.limit) : reply;
    focusAndInsertText(text);

    return {
      platform: platformInfo.platform,
      insertedLength: text.length,
      truncated: Boolean(platformInfo.limit && reply.length > platformInfo.limit)
    };
  }

  browser.runtime.onMessage.addListener((message) => {
    if (message?.type === "smsr:run") {
      return run();
    }

    return undefined;
  });
})();
