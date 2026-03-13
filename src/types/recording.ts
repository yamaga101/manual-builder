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
