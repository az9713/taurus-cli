/**
 * Markdown Generator
 *
 * Generates markdown documentation
 */

import {
  FunctionDoc,
  ClassDoc,
  InterfaceDoc,
  TypeDoc,
  Tutorial,
  CodeExample,
  APIEndpoint,
} from '../types.js';

export class MarkdownGenerator {
  /**
   * Generate function documentation
   */
  generateFunctionDoc(func: FunctionDoc): string {
    let md = `## ${func.name}\n\n`;

    if (func.deprecated) {
      md += '> ⚠️ **Deprecated**\n\n';
    }

    md += `${func.description}\n\n`;

    // Signature
    md += '### Signature\n\n';
    md += '```typescript\n';
    md += `${func.signature}\n`;
    md += '```\n\n';

    // Parameters
    if (func.parameters.length > 0) {
      md += '### Parameters\n\n';
      md += '| Name | Type | Required | Description |\n';
      md += '|------|------|----------|-------------|\n';

      for (const param of func.parameters) {
        const required = param.optional ? 'No' : 'Yes';
        const defaultVal = param.defaultValue ? ` (default: \`${param.defaultValue}\`)` : '';
        md += `| \`${param.name}\` | \`${param.type}\` | ${required} | ${param.description}${defaultVal} |\n`;
      }

      md += '\n';
    }

    // Returns
    md += '### Returns\n\n';
    md += `\`${func.returns.type}\` - ${func.returns.description}\n\n`;

    // Examples
    if (func.examples && func.examples.length > 0) {
      md += '### Examples\n\n';

      for (const example of func.examples) {
        md += `#### ${example.title}\n\n`;
        if (example.description) {
          md += `${example.description}\n\n`;
        }
        md += '```' + example.language + '\n';
        md += example.code + '\n';
        md += '```\n\n';

        if (example.output) {
          md += '**Output:**\n```\n';
          md += example.output + '\n';
          md += '```\n\n';
        }
      }
    }

    return md;
  }

  /**
   * Generate class documentation
   */
  generateClassDoc(cls: ClassDoc): string {
    let md = `## ${cls.name}\n\n`;

    md += `${cls.description}\n\n`;

    // Properties
    if (cls.properties.length > 0) {
      md += '### Properties\n\n';
      md += '| Name | Type | Visibility | Description |\n';
      md += '|------|------|------------|-------------|\n';

      for (const prop of cls.properties) {
        md += `| \`${prop.name}\` | \`${prop.type}\` | ${prop.visibility} | ${prop.description} |\n`;
      }

      md += '\n';
    }

    // Methods
    if (cls.methods.length > 0) {
      md += '### Methods\n\n';

      for (const method of cls.methods) {
        md += this.generateFunctionDoc(method);
      }
    }

    return md;
  }

  /**
   * Generate interface documentation
   */
  generateInterfaceDoc(iface: InterfaceDoc): string {
    let md = `## ${iface.name}\n\n`;

    md += `${iface.description}\n\n`;

    if (iface.properties.length > 0) {
      md += '### Properties\n\n';
      md += '| Name | Type | Description |\n';
      md += '|------|------|-------------|\n';

      for (const prop of iface.properties) {
        md += `| \`${prop.name}\` | \`${prop.type}\` | ${prop.description} |\n`;
      }

      md += '\n';
    }

    return md;
  }

  /**
   * Generate type documentation
   */
  generateTypeDoc(type: TypeDoc): string {
    let md = `## ${type.name}\n\n`;

    md += `${type.description}\n\n`;

    md += '### Definition\n\n';
    md += '```typescript\n';
    md += `type ${type.name} = ${type.definition}\n`;
    md += '```\n\n';

    return md;
  }

  /**
   * Generate tutorial
   */
  generateTutorial(tutorial: Tutorial): string {
    let md = `# ${tutorial.title}\n\n`;

    md += `> **Difficulty**: ${tutorial.difficulty} | **Estimated Time**: ${tutorial.estimatedTime}\n\n`;

    md += `${tutorial.description}\n\n`;

    // Prerequisites
    if (tutorial.prerequisites.length > 0) {
      md += '## Prerequisites\n\n';
      for (const prereq of tutorial.prerequisites) {
        md += `- ${prereq}\n`;
      }
      md += '\n';
    }

    // Steps
    md += '## Steps\n\n';

    for (const step of tutorial.steps) {
      md += `### Step ${step.number}: ${step.title}\n\n`;
      md += `${step.description}\n\n`;

      if (step.code && step.code.length > 0) {
        for (const code of step.code) {
          md += '```' + code.language + '\n';
          md += code.code + '\n';
          md += '```\n\n';
        }
      }

      md += `${step.explanation}\n\n`;

      if (step.tips && step.tips.length > 0) {
        md += '**Tips:**\n\n';
        for (const tip of step.tips) {
          md += `- 💡 ${tip}\n`;
        }
        md += '\n';
      }

      if (step.commonIssues && step.commonIssues.length > 0) {
        md += '**Common Issues:**\n\n';
        for (const issue of step.commonIssues) {
          md += `- ⚠️ ${issue}\n`;
        }
        md += '\n';
      }
    }

    // Conclusion
    md += '## Conclusion\n\n';
    md += `${tutorial.conclusion}\n\n`;

    // Next steps
    if (tutorial.nextSteps && tutorial.nextSteps.length > 0) {
      md += '## Next Steps\n\n';
      for (const next of tutorial.nextSteps) {
        md += `- ${next}\n`;
      }
      md += '\n';
    }

    return md;
  }

  /**
   * Generate API endpoint documentation
   */
  generateAPIDoc(endpoint: APIEndpoint): string {
    let md = `## ${endpoint.method} ${endpoint.path}\n\n`;

    md += `${endpoint.description}\n\n`;

    // Parameters
    if (endpoint.parameters.length > 0) {
      md += '### Parameters\n\n';
      md += '| Name | In | Type | Required | Description |\n';
      md += '|------|-------|------|----------|-------------|\n';

      for (const param of endpoint.parameters) {
        const required = param.required ? 'Yes' : 'No';
        md += `| \`${param.name}\` | ${param.in} | \`${param.type}\` | ${required} | ${param.description} |\n`;
      }

      md += '\n';
    }

    // Request body
    if (endpoint.requestBody) {
      md += '### Request Body\n\n';
      md += `**Content-Type**: \`${endpoint.requestBody.contentType}\`\n\n`;
      md += '```json\n';
      md += JSON.stringify(endpoint.requestBody.example, null, 2) + '\n';
      md += '```\n\n';
    }

    // Responses
    md += '### Responses\n\n';

    for (const response of endpoint.responses) {
      md += `#### ${response.code} ${response.description}\n\n`;

      if (response.example) {
        md += '```json\n';
        md += JSON.stringify(response.example, null, 2) + '\n';
        md += '```\n\n';
      }
    }

    return md;
  }

  /**
   * Generate table of contents
   */
  generateTableOfContents(sections: { title: string; slug: string }[]): string {
    let md = '## Table of Contents\n\n';

    for (const section of sections) {
      md += `- [${section.title}](#${section.slug})\n`;
    }

    md += '\n';

    return md;
  }

  /**
   * Generate changelog
   */
  generateChangelog(entries: any[]): string {
    let md = '# Changelog\n\n';

    for (const entry of entries) {
      md += `## ${entry.version} - ${entry.date.toISOString().split('T')[0]}\n\n`;

      // Group by type
      const grouped = new Map<string, any[]>();

      for (const change of entry.changes) {
        if (!grouped.has(change.type)) {
          grouped.set(change.type, []);
        }
        grouped.get(change.type)!.push(change);
      }

      // Output by type
      const typeOrder = ['security', 'breaking', 'added', 'changed', 'deprecated', 'removed', 'fixed'];

      for (const type of typeOrder) {
        const changes = grouped.get(type);
        if (!changes || changes.length === 0) continue;

        md += `### ${type.charAt(0).toUpperCase() + type.slice(1)}\n\n`;

        for (const change of changes) {
          const icon = change.breaking ? '⚠️ ' : '';
          md += `- ${icon}${change.description}\n`;
        }

        md += '\n';
      }
    }

    return md;
  }
}
