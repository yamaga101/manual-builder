import type { RecordingPayload, StorageData } from "../types";

// This content script runs only on manual-builder pages.
// It bridges chrome.storage.local → window.postMessage for the import flow.

window.addEventListener("message", async (event) => {
  if (event.data?.type !== "MANUAL_BUILDER_READY") return;

  const result = await chrome.storage.local.get("recording");
  const data = result.recording as StorageData | undefined;

  if (!data || data.state !== "DONE" || data.steps.length === 0) {
    console.warn("[MB Recorder] No recording data available for transfer");
    return;
  }

  const payload: RecordingPayload = {
    type: "MANUAL_BUILDER_IMPORT",
    version: 1,
    title: `Recording ${new Date().toLocaleDateString("ja-JP")}`,
    steps: data.steps,
  };

  window.postMessage(payload, "*");

  // Clear recording data after successful transfer
  await chrome.storage.local.set({
    recording: { state: "IDLE", steps: [], recordingTabId: null },
  });
});
