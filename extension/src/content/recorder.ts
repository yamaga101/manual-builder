import type { ToContentMessage } from "../types";

let recording = false;

function handleClick(e: MouseEvent): void {
  if (!recording) return;

  chrome.runtime.sendMessage({
    action: "CLICK",
    x: e.clientX,
    y: e.clientY,
    url: window.location.href,
    pageTitle: document.title,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });
}

chrome.runtime.onMessage.addListener((message: ToContentMessage) => {
  if (message.action === "START_RECORDING") {
    recording = true;
    document.addEventListener("click", handleClick, { capture: true });
  }

  if (message.action === "STOP_RECORDING") {
    recording = false;
    document.removeEventListener("click", handleClick, { capture: true });
  }
});
