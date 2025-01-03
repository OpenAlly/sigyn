// Import Internal Dependencies
import type { SigynAlertTemplate, SigynConfig, SigynInitializedTemplate } from "../types.js";

export function extendsTemplates(template: SigynAlertTemplate, config: SigynConfig): SigynInitializedTemplate {
  const configTemplates = config.templates!;

  function getBaseTemplate(key: string): SigynInitializedTemplate {
    const baseTemplate = configTemplates[key];

    if (baseTemplate.extends) {
      return extendsTemplates(baseTemplate, config);
    }

    return baseTemplate as SigynInitializedTemplate;
  }

  if (template.extends === undefined) {
    return template as SigynInitializedTemplate;
  }

  const baseTemplate = getBaseTemplate(template.extends);
  const templateContent = baseTemplate.content ? [...baseTemplate.content] : [];

  if (Array.isArray(template.content)) {
    templateContent.push(...template.content);
  }
  else {
    if (template.content?.after) {
      templateContent.push(...template.content.after);
    }
    if (template.content?.before) {
      templateContent.unshift(...template.content.before);
    }
    if (template.content?.at) {
      for (const { index, value } of Object.values(template.content.at)) {
        templateContent.splice(Number(index), 0, value);
      }
    }
  }

  return {
    title: template.title ?? baseTemplate?.title,
    content: templateContent
  };
}
