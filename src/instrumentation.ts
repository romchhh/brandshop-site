export async function register() {
  // Keep this file free of Node built-ins. Scheduler (fs) loads only on Node.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node");
  }
}
