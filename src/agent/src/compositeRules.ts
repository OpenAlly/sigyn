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
  const { compositeRules, rules } = getConfig();
  if (!compositeRules) {
    return;
  }

  for (const compositeRule of compositeRules) {
    const matchRules = rules.filter(({ name }) => compositeRule.include.includes(name) && !compositeRule.exclude.includes(name));
    if (matchRules.length === 0) {
      // TODO: this should be checked upon config initialization
      continue;
    }

    const ruleIds = getDB().prepare(
      `SELECT id FROM rules WHERE name IN (${matchRules.map(() => "?").join(",")})`
    ).all(matchRules.map((rule) => rule.name)) as { id: number }[];
    const { count } = getDB()
      // eslint-disable-next-line max-len
      .prepare(`SELECT COUNT(id) as count FROM alerts WHERE processed = 0 AND createdAt >= ? AND ruleId IN (${ruleIds.map(() => "?").join(",")})`)
      .get(
        utils.cron.durationOrCronToDate(compositeRule.interval, "subtract").valueOf(),
        ...ruleIds.map(({ id }) => id)
      ) as { count: number };

    if (count < compositeRule.notifCount) {
      logger.info(`[${compositeRule.name}](alertsCount:${count}|notifCount:${compositeRule.notifCount})`);
      continue;
    }

    if (compositeRule.ruleCountThreshold) {
      const { distinctCount } = getDB()
      // eslint-disable-next-line max-len
        .prepare(`SELECT COUNT(DISTINCT ruleId) as distinctCount FROM alerts WHERE processed = 0 AND createdAt >= ? AND ruleId IN (${ruleIds.map(() => "?").join(",")})`)
        .get(
          utils.cron.durationOrCronToDate(compositeRule.interval, "subtract").valueOf(),
          ...ruleIds.map(({ id }) => id)
        ) as { distinctCount: number };

      if (distinctCount < compositeRule.ruleCountThreshold) {
        logger.info(
          `[${compositeRule.name}](distinctCount:${distinctCount}|ruleCountThreshold:${compositeRule.ruleCountThreshold})`
        );
        continue;
      }
    }

    if (compositeRule.throttle) {
      if (compositeRuleHasThrottle(compositeRule, count, logger)) {
        continue;
      }
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

    getDB().prepare(`UPDATE alerts SET processed = 1 WHERE createdAt >= ? AND ruleId IN (${ruleIds.map(() => "?").join(",")})`)
      .run(
        utils.cron.durationOrCronToDate(compositeRule.interval, "subtract").valueOf(),
        ...ruleIds.map(({ id }) => id)
      );
  }
}
