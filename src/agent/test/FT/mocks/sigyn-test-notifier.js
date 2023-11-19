let calls = 0;

// This is the notifier execute function that will be called by the agent
export function execute() {
  calls++;
}

export function resetCalls() {
  calls = 0;
}

export function getCalls() {
  return calls;
}
