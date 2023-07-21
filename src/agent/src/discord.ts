// NOTE: This will be redesigned & moved to @sigyn/discord.

// Import Third-party Dependencies
import pupa from "pupa";

// CONSTANTS
const kWebhookUsername = "Sigyn Agent";

export const discord = {
  executeWebhook: async function execute(options) {
    const { webhookUrl, ruleConfig, rule } = options;

    function webhookStructure() {
      const counter = rule.counter;
      const { count, interval } = ruleConfig.alert.on;
      const ruleName = ruleConfig.name;
      const polling = ruleConfig.polling;
      const logql = ruleConfig.logql.replaceAll("`", "'");
      const lokiUrl = "https://todo.com";

      const content: any[] = ruleConfig.alert.template.content.map((content) => pupa(
        content,
        { ruleName, count, counter, interval, polling, logql, lokiUrl }
      ));
      if (ruleConfig.alert.template.title) {
        content.unshift(pupa(ruleConfig.alert.template.title, { ruleName, count, counter, interval, polling, logql, lokiUrl }));
      }

      return {
        content: content.join("\n"),
        username: kWebhookUsername
      };
    }

    await fetch(webhookUrl, {
      method: "POST",
      body: JSON.stringify(webhookStructure()),
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
