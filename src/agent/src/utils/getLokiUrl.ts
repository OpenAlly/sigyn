// Import Third-party Dependencies
import dayjs from "dayjs";
import { type SigynInitializedRule, getConfig } from "@sigyn/config";

// Import Internal Dependencies
import { Datasource } from "../datasource.js";
import { durationOrCronToDate } from "./cron.js";
import { type RuleNotifierAlert } from "../notifiers/rules.notifier.js";

export async function getLokiUrl(
  rule: RuleNotifierAlert["rule"],
  config: SigynInitializedRule
): Promise<string> {
  const { grafana } = getConfig();
  const { uid, orgId } = await Datasource.Loki(grafana.apiUrl);

  const from = config.alert.on.label ? String(rule.oldestLabelTimestamp) : String(
    durationOrCronToDate(config.alert.on.interval!, "subtract").valueOf()
  );
  const to = String(dayjs().valueOf());

  const url = new URL("explore", grafana.apiUrl);
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
