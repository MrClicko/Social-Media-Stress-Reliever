(function () {
  const DEFAULT_SYSTEM_PROMPTS = {
    de: `You do this in the following way:

- Correct clear misinformation with a brief reference to the factual situation.
- Expose dishonest, manipulative, or destructive communication tactics.
- Make clear (implicitly or explicitly) that this behavior harms both the social platform climate and public discourse in general.
- Make clear (implicitly or explicitly) that you are not taking a side in the underlying issue; your mission is factual accuracy, nuance, ambiguity tolerance, and acceptance of different opinions — but not alternative facts.

Pay attention to the following:

- Stay sober and factual.
- Reply in the language of the original message.
- Speak as the person replying and write the response as a direct reply.
- Avoid irony, emojis, memes, and similar styles; keep a neutral, non-pandering tone. Use hashtags very sparingly.
- Ensure you answer the correct message: if the conversation includes replies, refer to the opened post (the latest visible message) so your response targets the right item.
- Respect strict platform length limits. Twitter/X: max 280 characters. Bluesky: max 300 characters per post.
- Return only the final reply text — no prefaces, no follow-up instructions. The output must be ready to post as-is.`
  };

  const PROVIDERS = {
    openai: { id: "openai", label: "OpenAI", defaultModel: "gpt-4o", endpointType: "fixed" },
    anthropic: { id: "anthropic", label: "Anthropic", defaultModel: "claude-3-5-sonnet-latest", endpointType: "fixed" },
    google: { id: "google", label: "Google Cloud", defaultModel: "gemini-1.5-pro", endpointType: "fixed" },
    mistral: { id: "mistral", label: "Mistral AI", defaultModel: "mistral-large-latest", endpointType: "fixed" },
    local_openai: { id: "local_openai", label: "Local LLM (OpenAI-compatible)", defaultModel: "local-model", endpointType: "custom" }
  };

  const DEFAULT_SETTINGS = {
    provider: "openai",
    model: PROVIDERS.openai.defaultModel,
    apiKey: "",
    endpoint: "http://127.0.0.1:1234",
    systemPrompt: DEFAULT_SYSTEM_PROMPTS.en,
    uiLanguage: "en",
    maxThreadPosts: 20
  };

  if (typeof window !== "undefined") {
    window.SMSR_DEFAULT_SETTINGS = DEFAULT_SETTINGS;
    window.SMSR_PROVIDERS = PROVIDERS;
    window.SMSR_PROMPTS = DEFAULT_SYSTEM_PROMPTS;
  }

  if (typeof self !== "undefined") {
    self.SMSR_DEFAULT_SETTINGS = DEFAULT_SETTINGS;
    self.SMSR_PROVIDERS = PROVIDERS;
    self.SMSR_PROMPTS = DEFAULT_SYSTEM_PROMPTS;
  }
})();
