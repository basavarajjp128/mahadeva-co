export type AttemptState = "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";

export function transitionAttemptState(
  current: AttemptState | undefined,
  incoming: AttemptState,
): AttemptState {
  if (current === "REFUNDED" || incoming === "REFUNDED") return "REFUNDED";
  if (current === "PARTIALLY_REFUNDED" || incoming === "PARTIALLY_REFUNDED") {
    return "PARTIALLY_REFUNDED";
  }
  if (current === "CAPTURED") return current;
  if (incoming === "CAPTURED") return incoming;
  if (current === "AUTHORIZED" && incoming === "FAILED") return incoming;
  return current ?? incoming;
}
