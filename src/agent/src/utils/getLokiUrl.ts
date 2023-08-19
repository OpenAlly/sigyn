// Import Third-party Dependencies
import dayjs from "dayjs";
import { SigynRule, getConfig } from "@sigyn/config";

// Import Internal Dependencies
import { Datasource } from "../datasource";
import { durationOrCronToDate } from "./cron";

export async function getLokiUrl(config: SigynRule): Promise<string> {
  const { loki } = getConfig();
  const { uid, orgId } = await Datasource.Loki(loki.apiUrl);

  const from = String(
    durationOrCronToDate(config.alert.on.interval, "subtract").valueOf()
  );
  const to = dayjs().valueOf();

  const url = new URL("explore", loki.apiUrl);
  url.searchParams.append("orgId", String(orgId));
  url.searchParams.append("left", JSON.stringify({
    datasource: uid,
    queries: [
      {
        datasource: {
          type: "loki",
          uid
        },
        editorMode: "builder",
        expr: config.logql,
        queryType: "range"
      }
    ],
    range: {
      from,
      to
    }
  }));

  return url.href;
}
