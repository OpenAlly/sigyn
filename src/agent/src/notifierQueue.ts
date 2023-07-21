// Import Node.js Dependencies
import EventEmitter from "node:events";
import { NotifierAlert } from "./notifier";

// CONSTANTS
const kNotifsConcurrency = 10;
const kReadyEvent = Symbol("ready");

export const NOTIFIER_QUEUE_EVENTS = {
  DEQUEUE: Symbol("dequeue"),
  DONE: Symbol("done")
};

// TODO: handle 2 (or more) same alert in the queue.
export class NotifierQueue extends EventEmitter {
  #queue: NotifierAlert[] = [];
  #inProgress = 0;

  constructor() {
    super();

    this.on(NOTIFIER_QUEUE_EVENTS.DONE, this.#notifHandled);
  }

  push(notifs: NotifierAlert) {
    this.#queue.push(notifs);

    if (this.#inProgress > 0) {
      this.removeAllListeners(kReadyEvent);

      this.once(kReadyEvent, () => {
        this.emit(NOTIFIER_QUEUE_EVENTS.DEQUEUE, [...this.#dequeue()]);
      });

      return;
    }

    this.emit(NOTIFIER_QUEUE_EVENTS.DEQUEUE, [...this.#dequeue()]);
  }

  #notifHandled() {
    this.#inProgress--;

    if (this.#inProgress === 0 && this.#queue.length > 0) {
      this.emit(NOTIFIER_QUEUE_EVENTS.DEQUEUE, [...this.#dequeue()]);
    }
  }

  * #dequeue() {
    for (let i = 0; i < kNotifsConcurrency; i++) {
      if (this.#queue.length === 0) {
        break;
      }

      yield this.#queue.shift();
    }
  }
}
