// NOTE: This will be redesigned & moved to @sigyn/discord.

// CONSTANTS
const kWebhookUsername = "Sigyn Agent";

export async function executeWebhook(options) {
  // pupa is ESM only, need a dynamic import for CommonJS.
  const { default: pupa } = await import("pupa");
  const { webhookUrl, ruleConfig, rule } = options;

  function webhookStructure() {
    const counter = rule.counter;
    const { count, interval } = ruleConfig.alert.on;
    const ruleName = ruleConfig.name;
    const polling = ruleConfig.polling;
    const logql = ruleConfig.logql.replaceAll("`", "'");
    const lokiUrl = "https://todo.com";
    const templateData = { ruleName, count, counter, interval, polling, logql, lokiUrl };

    const content: any[] = ruleConfig.alert.template.content.map((content) => pupa(
      content,
      templateData
    ));
    if (ruleConfig.alert.template.title) {
      content.unshift(pupa(ruleConfig.alert.template.title, templateData));
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
