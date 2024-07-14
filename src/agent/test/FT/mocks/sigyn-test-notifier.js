import os from "node:os";
import fs from "node:fs";
import path from "node:path";

// This is the notifier execute function that will be called by the agent
export function execute(...fnArgs) {
  const testingNotifier = TestingNotifier.getInstance();
  testingNotifier.push(fnArgs);
}

export class TestingNotifier {
  static instance;

  get notifArguments() {
    if (fs.existsSync(path.join(os.tmpdir(), "sigyn-notif-args.json"))) {
      return JSON.parse(fs.readFileSync(path.join(os.tmpdir(), "sigyn-notif-args.json")));
    }

    return [];
  }

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
    const cache = [];
    if (fs.existsSync(path.join(os.tmpdir(), "sigyn-notif-args.json"))) {
      cache.push(...JSON.parse(fs.readFileSync(path.join(os.tmpdir(), "sigyn-notif-args.json"))));
    }
    cache.push(call[0]);
    fs.writeFileSync(path.join(os.tmpdir(), "sigyn-notif-args.json"), JSON.stringify(cache));
  }

  clear() {
    fs.rmSync(path.join(os.tmpdir(), "sigyn-notif-args.json"), { force: true });
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
