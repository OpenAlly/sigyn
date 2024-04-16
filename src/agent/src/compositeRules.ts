// Import Third-party Dependencies
import { getConfig, SigynInitializedCompositeRule } from "@sigyn/config";

// Import Internal Dependencies
import { getDB } from "./database";
import { Logger } from ".";
import * as utils from "./utils";
import { CompositeRuleNotifier } from "./notifiers/compositeRules.notifier";

function compositeRuleHasThrottle(
  compositeRule: SigynInitializedCompositeRule,
  alertsCount: number,
  logger: Logger
): boolean {
  if (!compositeRule.throttle) {
    logger.info(`[${compositeRule.name}](throttle:none)`);

    return false;
  }

  const { interval, count, activationThreshold } = compositeRule.throttle;

  const intervalDate = utils.cron.durationOrCronToDate(interval, "subtract").valueOf();
  const { count: compositeRuleAlertsCount } = getDB()
    .prepare("SELECT COUNT(id) as count FROM compositeRuleAlerts WHERE name = ? AND createdAt >= ?")
    .get(compositeRule.name, intervalDate) as { count: number };

  if (compositeRuleAlertsCount > 0) {
    const { createdAt } = getDB()
      .prepare("SELECT createdAt FROM compositeRuleAlerts WHERE name = ? AND createdAt >= ? ORDER BY createdAt DESC")
      .get(compositeRule.name, intervalDate) as { createdAt: number };

    if (intervalDate < createdAt && alertsCount / compositeRule.notifCount < count) {
      // eslint-disable-next-line max-len
      logger.info(`[${compositeRule.name}](throttle:on|intervalDate:${intervalDate}|olderAlertTimestamp|${createdAt}|alertsCount:${alertsCount}|notifCount:${compositeRule.notifCount}|throttleCount:${count})`);

      return true;
    }
  }

  if (count === 0 && compositeRuleAlertsCount > 0) {
    logger.info(`[${compositeRule.name}](throttle:off|compositeRuleAlertsCount:${compositeRuleAlertsCount})`);

    return false;
  }
  else if (compositeRuleAlertsCount <= activationThreshold) {
    // eslint-disable-next-line max-len
    logger.info(`[${compositeRule.name}](throttle:off|compositeRuleAlertsCount:${compositeRuleAlertsCount}|activationThreshold:${activationThreshold})`);

    return false;
  }

  const hasThrottle = compositeRuleAlertsCount === 1 ? false : compositeRuleAlertsCount - activationThreshold <= count;
  // eslint-disable-next-line max-len
  logger.info(`[${compositeRule.name}](throttle:${hasThrottle ? "on" : "off"}|compositeRuleAlertsCount:${compositeRuleAlertsCount}|activationThreshold:${activationThreshold}|thresholdCount:${count})`);

  return hasThrottle;
}

export function handleCompositeRules(logger: Logger) {
  const { compositeRules } = getConfig();
  if (!compositeRules) {
    return;
  }

  for (const compositeRule of compositeRules) {
    const ruleIdsObj = getDB().prepare(
      `SELECT id FROM rules WHERE name IN (${compositeRule.rules.map(() => "?").join(",")})`
    ).all(compositeRule.rules) as { id: number }[];
    const ruleIds = ruleIdsObj.map(({ id }) => id);
    const subtractedInterval = utils.cron.durationOrCronToDate(compositeRule.interval, "subtract").valueOf();
    const { count } = getDB()
      // eslint-disable-next-line max-len
      .prepare(`SELECT COUNT(id) as count FROM alerts WHERE processed = 0 AND createdAt >= ? AND ruleId IN (${ruleIds.map(() => "?").join(",")})`)
      .get(
        subtractedInterval,
        ...ruleIds
      ) as { count: number };
    const processedRulesIdsObj = getDB()
      .prepare(`SELECT ruleId FROM alerts WHERE createdAt >= ? AND ruleId IN (${ruleIds.map(() => "?").join(",")})`)
      .all(subtractedInterval, ...ruleIds) as { ruleId: number }[];
    const processedRulesIds = [...new Set(processedRulesIdsObj.flatMap(({ ruleId }) => ruleIds.filter((id) => id === ruleId)))];

    if (count < compositeRule.notifCount) {
      logger.info(`[${compositeRule.name}](alertsCount:${count}|notifCount:${compositeRule.notifCount})`);
      continue;
    }

    const ruleIdsPlaceholder = ruleIds.map(() => "?").join(",");
    if (compositeRule.ruleCountThreshold) {
      const { distinctCount } = getDB()
      // eslint-disable-next-line max-len
        .prepare(`SELECT COUNT(DISTINCT ruleId) as distinctCount FROM alerts WHERE compositeProcessed = 0 AND createdAt >= ? AND ruleId IN (${ruleIdsPlaceholder})`)
        .get(
          utils.cron.durationOrCronToDate(compositeRule.interval, "subtract").valueOf(),
          ...ruleIds
        ) as { distinctCount: number };

      if (distinctCount < compositeRule.ruleCountThreshold) {
        logger.info(
          `[${compositeRule.name}](distinctCount:${distinctCount}|ruleCountThreshold:${compositeRule.ruleCountThreshold})`
        );
        continue;
      }
    }

    if (compositeRuleHasThrottle(compositeRule, count, logger)) {
      continue;
    }

    getDB().prepare("INSERT INTO compositeRuleAlerts (name, createdAt) VALUES (?, ?)").run(compositeRule.name, Date.now());

    const notifier = CompositeRuleNotifier.getSharedInstance(logger);
    const { notifiers } = getConfig();

    notifier.sendAlerts(
      compositeRule.notifiers.map((notifierName) => {
        return {
          notifierConfig: notifiers[notifierName],
          compositeRuleName: compositeRule.name
        };
      })
    );

    getDB().prepare(`UPDATE alerts SET processed = 1 WHERE createdAt >= ? AND ruleId IN (${ruleIdsPlaceholder})`)
      .run(
        utils.cron.durationOrCronToDate(compositeRule.interval, "subtract").valueOf(),
        ...ruleIds
      );

    getDB().prepare(`UPDATE alerts SET compositeProcessed = 1 WHERE ruleId IN (${ruleIdsPlaceholder})`)
      .run(ruleIds);

    if (!compositeRule.muteRules) {
      return;
    }

    const processedRulesIdsPlaceholder = processedRulesIds.map(() => "?").join(",");
    const placeholder = compositeRule.muteUntriggered ? ruleIdsPlaceholder : processedRulesIdsPlaceholder;
    const muteUntilTimestamp = utils.cron.durationOrCronToDate(compositeRule.muteDuration, "add").valueOf();
    getDB()
      .prepare(`UPDATE rules SET muteUntil = ? WHERE id IN (${placeholder})`)
      .run(
        muteUntilTimestamp,
        ...(compositeRule.muteUntriggered ? ruleIds : processedRulesIds)
      );
  }
}
