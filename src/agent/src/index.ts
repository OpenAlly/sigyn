
export async function start(
  location = process.cwd()
) {
  console.log(`Starting sigyn agent at '${location}'`);

  /**
   * TODO:
   * 1. read config (containing rules & alerts)
   *  ! problem: how to assign an unique ID to a rule (using the name?)
   *
   * 2. schedule rules interval (using node-schedule package)
   *  ! problem: how to convert duration?
   *  2.1. store last run timestamp
   *  2.1. store for each interval: timestamp + log count
   *
   * 3. schedule alerting interval
   *  3.1 looking in DB, if matching condition -> alert (delete proceeded rows)
   *  3.2 store in DB the alert, send event notification to notifiers
   */
}

