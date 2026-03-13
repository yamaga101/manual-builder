import { useEffect, useState, useCallback } from "react";
import type { RecordingState, StorageData, RecordingPayload } from "../types";

export function App() {
  const [state, setState] = useState<RecordingState>("IDLE");
  const [stepCount, setStepCount] = useState(0);
  const [steps, setSteps] = useState<StorageData["steps"]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const result = await chrome.storage.local.get("recording");
    const data = result.recording as StorageData | undefined;
    if (data) {
      setState(data.state);
      setStepCount(data.steps.length);
      setSteps(data.steps);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Poll for updates while recording
    const id = setInterval(refresh, 500);
    return () => clearInterval(id);
  }, [refresh]);

  const send = async (action: string) => {
    setBusy(true);
    try {
      await chrome.runtime.sendMessage({ action });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleExportJSON = () => {
    if (steps.length === 0) return;
    const payload: RecordingPayload = {
      type: "MANUAL_BUILDER_IMPORT",
      version: 1,
      title: `Recording ${new Date().toLocaleDateString("ja-JP")}`,
      steps,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 font-sans text-sm">
      <h1 className="text-base font-bold mb-3">Manual Builder Recorder</h1>

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${
            state === "RECORDING"
              ? "bg-red-500 animate-pulse"
              : state === "DONE"
                ? "bg-green-500"
                : "bg-gray-400"
          }`}
        />
        <span className="text-gray-600">
          {state === "IDLE" && "待機中"}
          {state === "RECORDING" && `録画中 — ${stepCount} ステップ`}
          {state === "DONE" && `完了 — ${stepCount} ステップ`}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {state === "IDLE" && (
          <button
            onClick={() => send("START_RECORDING")}
            disabled={busy}
            className="w-full py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 font-medium"
          >
            録画開始
          </button>
        )}

        {state === "RECORDING" && (
          <button
            onClick={() => send("STOP_RECORDING")}
            disabled={busy}
            className="w-full py-2 px-4 bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:opacity-50 font-medium"
          >
            録画停止
          </button>
        )}

        {state === "DONE" && (
          <>
            {/* Step thumbnails */}
            {steps.length > 0 && (
              <div className="mb-2 max-h-48 overflow-y-auto border rounded-md divide-y">
                {steps.map((s) => (
                  <div key={s.stepNumber} className="flex items-center gap-2 p-2">
                    <img
                      src={s.screenshot}
                      alt={`Step ${s.stepNumber}`}
                      className="w-16 h-10 object-cover rounded border"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs">
                        Step {s.stepNumber}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {s.pageTitle}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => send("SEND_TO_BUILDER")}
              disabled={busy}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              Manual Builder に送信
            </button>

            <button
              onClick={handleExportJSON}
              className="w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 font-medium text-gray-700"
            >
              JSON エクスポート
            </button>

            <button
              onClick={() => send("RESET")}
              disabled={busy}
              className="w-full py-1.5 px-4 text-gray-500 hover:text-gray-700 text-xs"
            >
              リセット
            </button>
          </>
        )}
      </div>
    </div>
  );
}
