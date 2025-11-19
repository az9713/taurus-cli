/**
 * Template Manager
 *
 * Manages code generation templates
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { Template, TargetLanguage, CodePattern } from './types.js';

export class TemplateManager {
  private templates: Map<string, Template>;
  private templatesPath: string;

  constructor(templatesPath: string = './templates') {
    this.templates = new Map();
    this.templatesPath = templatesPath;
    this.loadBuiltInTemplates();
  }

  /**
   * Load built-in templates
   */
  private loadBuiltInTemplates(): void {
    // TypeScript Class Template
    this.registerTemplate({
      name: 'typescript-class',
      language: 'typescript',
      pattern: 'class',
      template: `/**
 * {{className}}
 *
 * {{description}}
 */
export class {{className}} {
  {{#properties}}
  private {{name}}: {{type}};
  {{/properties}}

  constructor({{#constructorParams}}{{name}}: {{type}}{{#unless @last}}, {{/unless}}{{/constructorParams}}) {
    {{#properties}}
    this.{{name}} = {{name}};
    {{/properties}}
  }

  {{#methods}}
  /**
   * {{description}}
   */
  {{name}}({{#params}}{{name}}: {{type}}{{#unless @last}}, {{/unless}}{{/params}}): {{returnType}} {
    // TODO: Implement {{name}}
    throw new Error('Not implemented');
  }
  {{/methods}}
}`,
      variables: [
        { name: 'className', type: 'string', description: 'Class name', required: true },
        { name: 'description', type: 'string', description: 'Class description', required: true },
        { name: 'properties', type: 'array', description: 'Class properties', required: false },
        { name: 'methods', type: 'array', description: 'Class methods', required: false },
      ],
      description: 'TypeScript class template with properties and methods',
    });

    // TypeScript Function Template
    this.registerTemplate({
      name: 'typescript-function',
      language: 'typescript',
      pattern: 'function',
      template: `/**
 * {{functionName}}
 *
 * {{description}}
 *
 * @param {{#params}}{{name}} - {{description}}
 * @param {{/params}}
 * @returns {{returnDescription}}
 */
export function {{functionName}}({{#params}}{{name}}: {{type}}{{#unless @last}}, {{/unless}}{{/params}}): {{returnType}} {
  // TODO: Implement {{functionName}}
  throw new Error('Not implemented');
}`,
      variables: [
        { name: 'functionName', type: 'string', description: 'Function name', required: true },
        { name: 'description', type: 'string', description: 'Function description', required: true },
        { name: 'params', type: 'array', description: 'Function parameters', required: false },
        { name: 'returnType', type: 'string', description: 'Return type', required: true },
        { name: 'returnDescription', type: 'string', description: 'Return description', required: false },
      ],
      description: 'TypeScript function template with JSDoc',
    });

    // Python Class Template
    this.registerTemplate({
      name: 'python-class',
      language: 'python',
      pattern: 'class',
      template: `class {{className}}:
    """
    {{description}}
    """

    def __init__(self{{#constructorParams}}, {{name}}: {{type}}{{/constructorParams}}):
        """Initialize {{className}}"""
        {{#properties}}
        self.{{name}} = {{name}}
        {{/properties}}

    {{#methods}}
    def {{name}}(self{{#params}}, {{name}}: {{type}}{{/params}}) -> {{returnType}}:
        """{{description}}"""
        raise NotImplementedError("{{name}} not implemented")
    {{/methods}}`,
      variables: [
        { name: 'className', type: 'string', description: 'Class name', required: true },
        { name: 'description', type: 'string', description: 'Class description', required: true },
        { name: 'properties', type: 'array', description: 'Class properties', required: false },
        { name: 'methods', type: 'array', description: 'Class methods', required: false },
      ],
      description: 'Python class template with docstrings',
    });

    // API Endpoint Template
    this.registerTemplate({
      name: 'express-endpoint',
      language: 'typescript',
      pattern: 'api-endpoint',
      template: `/**
 * {{method}} {{path}}
 *
 * {{description}}
 */
router.{{methodLower}}('{{path}}', async (req: Request, res: Response) => {
  try {
    {{#validateParams}}
    if (!req.{{location}}.{{name}}) {
      return res.status(400).json({ error: '{{name}} is required' });
    }
    {{/validateParams}}

    // TODO: Implement endpoint logic

    res.json({ message: 'Success' });
  } catch (error) {
    console.error('Error in {{method}} {{path}}:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});`,
      variables: [
        { name: 'method', type: 'string', description: 'HTTP method (GET, POST, etc.)', required: true },
        { name: 'methodLower', type: 'string', description: 'HTTP method lowercase', required: true },
        { name: 'path', type: 'string', description: 'Endpoint path', required: true },
        { name: 'description', type: 'string', description: 'Endpoint description', required: true },
        { name: 'validateParams', type: 'array', description: 'Parameters to validate', required: false },
      ],
      description: 'Express.js API endpoint template',
    });
  }

  /**
   * Register a template
   */
  registerTemplate(template: Template): void {
    this.templates.set(template.name, template);
  }

  /**
   * Get template by name
   */
  getTemplate(name: string): Template | undefined {
    return this.templates.get(name);
  }

  /**
   * Get templates for language and pattern
   */
  getTemplates(language?: TargetLanguage, pattern?: CodePattern): Template[] {
    const templates = Array.from(this.templates.values());

    return templates.filter(t => {
      if (language && t.language !== language) return false;
      if (pattern && t.pattern !== pattern) return false;
      return true;
    });
  }

  /**
   * Apply template with variables
   */
  applyTemplate(templateName: string, variables: Record<string, any>): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return this.renderTemplate(template.template, variables);
  }

  /**
   * Render template with variables (simple Mustache-like syntax)
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let result = template;

    // Replace simple variables: {{variableName}}
    result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });

    // Handle arrays: {{#arrayName}}...{{/arrayName}}
    result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, arrayName, content) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) return '';

      return array.map((item, index) => {
        let itemContent = content;

        // Replace item properties
        itemContent = itemContent.replace(/\{\{(\w+)\}\}/g, (m: string, prop: string) => {
          return item[prop] !== undefined ? String(item[prop]) : m;
        });

        // Handle {{#unless @last}}
        itemContent = itemContent.replace(/\{\{#unless @last\}\}(.*?)\{\{\/unless\}\}/g, (m: string, ifContent: string) => {
          return index < array.length - 1 ? ifContent : '';
        });

        return itemContent;
      }).join('');
    });

    return result;
  }

  /**
   * Load custom templates from file system
   */
  async loadCustomTemplates(customPath?: string): Promise<void> {
    const path = customPath || this.templatesPath;

    try {
      const files = await fs.readdir(path);

      for (const file of files) {
        if (file.endsWith('.template.json')) {
          try {
            const content = await fs.readFile(join(path, file), 'utf-8');
            const template = JSON.parse(content) as Template;
            this.registerTemplate(template);
          } catch (error) {
            console.error(`Failed to load template ${file}:`, error);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read, skip
    }
  }

  /**
   * Save template to file
   */
  async saveTemplate(template: Template, path?: string): Promise<void> {
    const savePath = path || join(this.templatesPath, `${template.name}.template.json`);
    await fs.writeFile(savePath, JSON.stringify(template, null, 2), 'utf-8');
  }

  /**
   * List all templates
   */
  listTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  /**
   * Validate template variables
   */
  validateTemplateVariables(templateName: string, variables: Record<string, any>): string[] {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const errors: string[] = [];

    for (const varDef of template.variables) {
      if (varDef.required && variables[varDef.name] === undefined) {
        errors.push(`Required variable missing: ${varDef.name}`);
      }

      if (variables[varDef.name] !== undefined) {
        const actualType = Array.isArray(variables[varDef.name]) ? 'array' : typeof variables[varDef.name];
        if (actualType !== varDef.type && varDef.type !== 'object') {
          errors.push(`Variable ${varDef.name} has wrong type: expected ${varDef.type}, got ${actualType}`);
        }
      }
    }

    return errors;
  }
}
