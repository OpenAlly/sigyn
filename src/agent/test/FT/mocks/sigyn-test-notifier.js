let calls = 0;
let args = null;

// This is the notifier execute function that will be called by the agent
export function execute(...fnArgs) {
  calls++;
  args = fnArgs;
}

export function resetCalls() {
  calls = 0;
}

export function getCalls() {
  return calls;
}

export function getArgs() {
  return args;
}
