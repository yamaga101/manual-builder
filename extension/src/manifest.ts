import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Manual Builder Recorder",
  version: "0.1.0",
  description: "Record browser actions and generate manuals in Manual Builder",
  permissions: ["activeTab", "tabs", "storage", "unlimitedStorage", "webNavigation"],
  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module",
  },
  action: {
    default_popup: "src/popup/index.html",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/recorder.ts"],
      run_at: "document_idle",
    },
    {
      matches: [
        "https://yamaga101.github.io/manual-builder/*",
        "http://localhost:3000/*",
      ],
      js: ["src/content/transfer.ts"],
      run_at: "document_idle",
    },
  ],
});
