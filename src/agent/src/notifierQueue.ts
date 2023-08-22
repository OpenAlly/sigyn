// Import Node.js Dependencies
import EventEmitter from "node:events";

// Import Internal Dependencies
import { NotifierAlert } from "./notifier";

// CONSTANTS
const kNotifsConcurrency = 10;

// TODO: handle 2 (or more) same alert in the queue.
export class NotifierQueue extends EventEmitter {
  static DEQUEUE = Symbol("dequeue");

  #notificationAlerts: NotifierAlert[] = [];
  #inProgress = 0;

  push(...notifications: NotifierAlert[]) {
    this.#notificationAlerts.push(...notifications);

    if (this.#inProgress === 0) {
      this.emit(NotifierQueue.DEQUEUE, [...this.#dequeue()]);
    }
  }

  done() {
    this.#inProgress = Math.max(0, this.#inProgress - 1);

    if (this.#inProgress === 0 && this.#notificationAlerts.length > 0) {
      this.emit(NotifierQueue.DEQUEUE, [...this.#dequeue()]);
    }
  }

  * #dequeue() {
    for (let i = 0; i < kNotifsConcurrency; i++) {
      if (this.#notificationAlerts.length === 0) {
        break;
      }

      this.#inProgress++;
      yield this.#notificationAlerts.shift();
    }
  }
}
