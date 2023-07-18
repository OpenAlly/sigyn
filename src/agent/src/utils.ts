// Import Third-party Dependencies
import dayjs, { type Dayjs } from "dayjs";
import ms from "ms";

export function durationToDate(duration: string, operation: "subtract" | "add"): Dayjs {
  const durationMs = ms(duration);

  return dayjs()[operation](durationMs, "ms");
}
