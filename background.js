const DEFAULT_SETTINGS = {
  enabled: true,
  breakIntervalMinutes: 20,
  hideFeeds: true
};

function ensureDefaults() {
  browser.storage.local.get().then((saved) => {
    const merged = { ...DEFAULT_SETTINGS, ...saved };
    return browser.storage.local.set(merged);
  });
}

function scheduleBreakReminder(minutes) {
  browser.alarms.clear("mindful-break");
  if (minutes > 0) {
    browser.alarms.create("mindful-break", { periodInMinutes: minutes });
  }
}

browser.runtime.onInstalled.addListener(() => {
  ensureDefaults();
  scheduleBreakReminder(DEFAULT_SETTINGS.breakIntervalMinutes);
});

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  if (changes.breakIntervalMinutes) {
    scheduleBreakReminder(changes.breakIntervalMinutes.newValue);
  }
});

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== "mindful-break") {
    return;
  }

  browser.storage.local.get(DEFAULT_SETTINGS).then(({ enabled }) => {
    if (!enabled) {
      return;
    }

    browser.notifications.create({
      type: "basic",
      iconUrl: "",
      title: "Mindful Break",
      message: "Take 60 seconds to breathe and reset before continuing.",
    });
  });
});

browser.runtime.onMessage.addListener((message) => {
  if (message?.type === "GET_SETTINGS") {
    return browser.storage.local.get(DEFAULT_SETTINGS);
  }

  if (message?.type === "UPDATE_SETTINGS") {
    const payload = {
      enabled: message.enabled,
      hideFeeds: message.hideFeeds,
      breakIntervalMinutes: Number(message.breakIntervalMinutes)
    };

    return browser.storage.local.set(payload).then(() => payload);
  }

  return undefined;
});
