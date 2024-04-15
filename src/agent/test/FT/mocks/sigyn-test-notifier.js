import { EventEmitter } from "node:events";

// This is the notifier execute function that will be called by the agent
export function execute(...fnArgs) {
  const testingNotifier = TestingNotifier.getInstance();
  testingNotifier.push(fnArgs);
  testingNotifier.emit("notif");
}

export class TestingNotifier extends EventEmitter {
  notifArguments = [];
  static instance;

  static getInstance() {
    TestingNotifier.instance ??= new TestingNotifier();

    return TestingNotifier.instance;
  }

  get lastNotifArguments() {
    return this.notifArguments.at(-1);
  }

  get notifCount() {
    return this.notifArguments.length;
  }

  push(call) {
    this.notifArguments.push(call[0]);
  }

  clear() {
    this.notifArguments = [];
  }

  toHaveBeenCalledWith(data) {
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof RegExp) {
        if (!value.test(this.lastNotifArguments.data[key])) {
          throw new Error(`Expected ${key} to match ${value}, got ${this.lastNotifArguments.data[key]}`);
        }

        continue;
      }

      if (this.lastNotifArguments.data[key] !== value) {
        throw new Error(`Expected ${key} to be ${value}, got ${this.lastNotifArguments.data[key]}`);
      }
    }

    return true;
  }
}
