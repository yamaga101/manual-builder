import type {
  RecordedStep,
  StorageData,
  ToBackgroundMessage,
  ToContentMessage,
} from "../types";

const DEFAULT_STORAGE: StorageData = {
  state: "IDLE",
  steps: [],
  recordingTabId: null,
};

async function getStorage(): Promise<StorageData> {
  const result = await chrome.storage.local.get("recording");
  return (result.recording as StorageData) ?? DEFAULT_STORAGE;
}

async function setStorage(data: Partial<StorageData>): Promise<void> {
  const current = await getStorage();
  await chrome.storage.local.set({ recording: { ...current, ...data } });
}

async function captureScreenshot(): Promise<string> {
  return chrome.tabs.captureVisibleTab({ format: "jpeg", quality: 80 });
}

async function sendToTab(tabId: number, message: ToContentMessage): Promise<void> {
  await chrome.tabs.sendMessage(tabId, message);
}

chrome.runtime.onMessage.addListener(
  (message: ToBackgroundMessage, sender, sendResponse) => {
    handleMessage(message, sender).then(sendResponse);
    return true; // async response
  },
);

async function handleMessage(
  message: ToBackgroundMessage,
  sender: chrome.runtime.MessageSender,
): Promise<unknown> {
  switch (message.action) {
    case "GET_STATE": {
      const data = await getStorage();
      return { state: data.state, stepCount: data.steps.length };
    }

    case "START_RECORDING": {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return { error: "No active tab" };

      await setStorage({ state: "RECORDING", steps: [], recordingTabId: tab.id });
      await sendToTab(tab.id, { action: "START_RECORDING" });

      return { ok: true };
    }

    case "STOP_RECORDING": {
      const data = await getStorage();
      if (data.recordingTabId) {
        await sendToTab(data.recordingTabId, { action: "STOP_RECORDING" });
      }
      await setStorage({ state: "DONE" });
      return { ok: true };
    }

    case "CLICK": {
      const data = await getStorage();
      if (data.state !== "RECORDING") return { error: "Not recording" };

      // Small delay to let visual feedback appear before capture
      await new Promise((r) => setTimeout(r, 100));

      const screenshot = await captureScreenshot();
      const step: RecordedStep = {
        stepNumber: data.steps.length + 1,
        screenshot,
        clickX: message.x,
        clickY: message.y,
        viewportWidth: message.viewportWidth,
        viewportHeight: message.viewportHeight,
        url: message.url,
        pageTitle: message.pageTitle,
        timestamp: Date.now(),
      };

      await setStorage({ steps: [...data.steps, step] });
      return { ok: true, stepNumber: step.stepNumber };
    }

    case "SEND_TO_BUILDER": {
      const data = await getStorage();
      if (data.state !== "DONE" || data.steps.length === 0) {
        return { error: "No recording data" };
      }

      // Determine Manual Builder URL
      const builderUrl = await getBuilderUrl();
      await chrome.tabs.create({ url: `${builderUrl}/editor#import` });

      return { ok: true };
    }

    case "RESET": {
      await setStorage(DEFAULT_STORAGE);
      return { ok: true };
    }

    default:
      return { error: "Unknown action" };
  }
}

async function getBuilderUrl(): Promise<string> {
  // Check if local dev server is running
  try {
    const resp = await fetch("http://localhost:3000/", { method: "HEAD" });
    if (resp.ok) return "http://localhost:3000";
  } catch {
    // not running
  }
  return "https://yamaga101.github.io/manual-builder";
}

// Re-send START_RECORDING after navigation within the recorded tab
chrome.webNavigation?.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return; // main frame only
  const data = await getStorage();
  if (data.state !== "RECORDING" || data.recordingTabId !== details.tabId) return;

  await sendToTab(details.tabId, { action: "START_RECORDING" });
});
