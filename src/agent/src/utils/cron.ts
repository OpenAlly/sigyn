// Import Third-party Dependencies
import dayjs, { type Dayjs } from "dayjs";
import ms from "ms";
import { CronExpressionParser } from "cron-parser";

const kCronExpressionRegExp = /(((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,6}/;

export function isCron(strValue: string): boolean {
  return kCronExpressionRegExp.test(strValue);
}

export function durationOrCronToDate(
  durationOrCron: string,
  operation: "subtract" | "add"
): Dayjs {
  if (isCron(durationOrCron)) {
    const cron = CronExpressionParser.parse(durationOrCron).next();

    return dayjs(cron[operation === "subtract" ? "prev" : "next"]().toString());
  }

  return dayjs()[operation](ms(durationOrCron), "ms");
}
