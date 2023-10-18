// Import Node.js Dependencies
import EventEmitter from "node:events";

// CONSTANTS
const kNotifsConcurrency = 10;
const kPrivateInstancier = Symbol("instancier");

type NotifierQueueAlert<T> = T & {
  _id: symbol;
  _nonUniqueMatcher: (notification: T, newNotifications: T) => boolean;
}

export class NotifierQueue<T = any> extends EventEmitter {
  /**
   * This is the global notifier queue.
   * We don't want a notifier queue per notifier but a global queue shared with each notifier.
   */
  private static shared: NotifierQueue;

  #notificationAlerts: NotifierQueueAlert<T>[] = [];
  #inProgress = 0;

  constructor(instancier: symbol) {
    if (instancier !== kPrivateInstancier) {
      throw new Error("Cannot instanciate NotifierQueue, use NotifierQueue.getSharedInstance instead");
    }

    super();
  }

  static getSharedInstance<T>(): NotifierQueue<T> {
    this.shared ??= new NotifierQueue<T>(kPrivateInstancier);

    return this.shared;
  }

  push(...notifications: NotifierQueueAlert<T>[]) {
    for (const newNotification of notifications) {
      const { _id } = newNotification;
      const alreadyInQueue = this.#notificationAlerts
        .find((notification) => notification._id === _id && notification._nonUniqueMatcher(newNotification, notification));

      if (alreadyInQueue === undefined) {
        this.#notificationAlerts.push(newNotification);
      }
    }

    if (this.#inProgress === 0) {
      process.nextTick(() => {
        this.#dequeue();
      });
    }
  }

  done() {
    this.#inProgress = Math.max(0, this.#inProgress - 1);

    if (this.#inProgress === 0 && this.#notificationAlerts.length > 0) {
      process.nextTick(() => {
        this.#dequeue();
      });
    }
  }

  #dequeue() {
    const identifiersNotifications = new Map();
    for (let i = 0; i < kNotifsConcurrency; i++) {
      if (this.#notificationAlerts.length === 0) {
        break;
      }

      this.#inProgress++;
      const nextAlert = this.#notificationAlerts.shift()!;
      if (identifiersNotifications.has(nextAlert._id)) {
        identifiersNotifications.set(nextAlert._id, [
          ...identifiersNotifications.get(nextAlert._id),
          nextAlert]
        );
      }
      else {
        identifiersNotifications.set(nextAlert._id, [nextAlert]);
      }
    }

    for (const [identifier, notifications] of identifiersNotifications) {
      this.emit(identifier, notifications);
    }
  }
}
