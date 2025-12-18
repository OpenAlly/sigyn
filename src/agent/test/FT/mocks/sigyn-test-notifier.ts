// Import Node.js Dependencies
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

// This is the notifier execute function that will be called by the agent
export function execute(...fnArgs: any[]) {
  const testingNotifier = TestingNotifier.getInstance();
  testingNotifier.push(fnArgs);
}

export class TestingNotifier {
  static instance: TestingNotifier | null = null;

  get notifArguments() {
    const filePath = path.join(os.tmpdir(), "sigyn-notif-args.json");

    if (fs.existsSync(filePath)) {
      return JSON.parse(
        fs.readFileSync(filePath, "utf-8")
      );
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

  push(call: any[]) {
    const cache = [];
    const filePath = path.join(os.tmpdir(), "sigyn-notif-args.json");

    if (fs.existsSync(filePath)) {
      cache.push(...JSON.parse(fs.readFileSync(filePath, "utf-8")));
    }
    cache.push(call[0]);
    fs.writeFileSync(filePath, JSON.stringify(cache));
  }

  clear() {
    const filePath = path.join(os.tmpdir(), "sigyn-notif-args.json");
    fs.rmSync(filePath, { force: true });
  }

  toHaveBeenCalledWith(data: Record<string, any>) {
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
