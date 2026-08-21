export function toast(message: string, tone: "success" | "error" | "info" = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("tracehire:toast", { detail: { message, tone } }));
}
