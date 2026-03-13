export interface RecordedStep {
  stepNumber: number;
  screenshot: string; // base64 data URL (JPEG)
  clickX: number;
  clickY: number;
  viewportWidth: number;
  viewportHeight: number;
  url: string;
  pageTitle: string;
  timestamp: number;
}

export interface RecordingPayload {
  type: "MANUAL_BUILDER_IMPORT";
  version: 1;
  title: string;
  steps: RecordedStep[];
}

export type RecordingState = "IDLE" | "RECORDING" | "DONE";

export interface StorageData {
  state: RecordingState;
  steps: RecordedStep[];
  recordingTabId: number | null;
}

// Messages from popup/content → service worker
export type ToBackgroundMessage =
  | { action: "START_RECORDING" }
  | { action: "STOP_RECORDING" }
  | { action: "SEND_TO_BUILDER" }
  | { action: "GET_STATE" }
  | { action: "RESET" }
  | { action: "CLICK"; x: number; y: number; url: string; pageTitle: string; viewportWidth: number; viewportHeight: number };

// Messages from service worker → content script
export type ToContentMessage =
  | { action: "START_RECORDING" }
  | { action: "STOP_RECORDING" };
