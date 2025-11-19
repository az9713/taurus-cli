/**
 * Documentation Manager
 *
 * Main orchestrator for automated documentation generation
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';
import { DocumentationConfig, DocumentationProject, Tutorial, Diagram } from './types.js';
import { CodeExtractor } from './extractors/code-extractor.js';
import { MarkdownGenerator } from './generators/markdown-generator.js';

export class DocumentationManager extends EventEmitter {
  private config: DocumentationConfig;
  private projectRoot: string;
  private codeExtractor: CodeExtractor;
  private markdownGenerator: MarkdownGenerator;

  constructor(projectRoot: string, config: DocumentationConfig) {
    super();
    this.projectRoot = projectRoot;
    this.config = config;
    this.codeExtractor = new CodeExtractor();
    this.markdownGenerator = new MarkdownGenerator();
  }

  /**
   * Generate all documentation
   */
  async generateAll(): Promise<void> {
    this.emit('generation-started');

    try {
      // Create output directory
      await fs.mkdir(this.config.output, { recursive: true });

      // Generate API reference
      if (this.config.features.apiReference) {
        await this.generateAPIReference();
      }

      // Generate tutorials
      if (this.config.features.tutorials) {
        await this.generateTutorials();
      }

      // Generate examples
      if (this.config.features.examples) {
        await this.generateExamples();
      }

      // Generate changelog
      if (this.config.features.changelog) {
        await this.generateChangelog();
      }

      this.emit('generation-completed');
    } catch (error: any) {
      this.emit('generation-failed', error);
      throw error;
    }
  }

  /**
   * Generate API reference documentation
   */
  async generateAPIReference(): Promise<void> {
    this.emit('api-reference-started');

    // Find all source files
    const sourceFiles = await this.findSourceFiles();

    // Extract documentation from each file
    const allDocs = {
      functions: [] as any[],
      classes: [] as any[],
      interfaces: [] as any[],
      types: [] as any[],
    };

    for (const file of sourceFiles) {
      try {
        const extracted = await this.codeExtractor.extractFromFile(file);

        allDocs.functions.push(...extracted.functions);
        allDocs.classes.push(...extracted.classes);
        allDocs.interfaces.push(...extracted.interfaces);
        allDocs.types.push(...extracted.types);
      } catch (error) {
        // Skip files that can't be parsed
      }
    }

    // Generate markdown
    let md = '# API Reference\n\n';

    // Functions
    if (allDocs.functions.length > 0) {
      md += '## Functions\n\n';
      for (const func of allDocs.functions) {
        md += this.markdownGenerator.generateFunctionDoc(func);
      }
    }

    // Classes
    if (allDocs.classes.length > 0) {
      md += '## Classes\n\n';
      for (const cls of allDocs.classes) {
        md += this.markdownGenerator.generateClassDoc(cls);
      }
    }

    // Interfaces
    if (allDocs.interfaces.length > 0) {
      md += '## Interfaces\n\n';
      for (const iface of allDocs.interfaces) {
        md += this.markdownGenerator.generateInterfaceDoc(iface);
      }
    }

    // Types
    if (allDocs.types.length > 0) {
      md += '## Types\n\n';
      for (const type of allDocs.types) {
        md += this.markdownGenerator.generateTypeDoc(type);
      }
    }

    // Write to file
    const outputPath = join(this.config.output, 'api-reference.md');
    await fs.writeFile(outputPath, md);

    this.emit('api-reference-completed', outputPath);
  }

  /**
   * Generate tutorials
   */
  async generateTutorials(): Promise<void> {
    // This would auto-generate tutorials based on code structure
    // For now, create a template

    const tutorial: Tutorial = {
      title: 'Getting Started',
      description: 'Learn how to use this project',
      difficulty: 'beginner',
      estimatedTime: '15 minutes',
      prerequisites: ['Node.js 18+', 'npm or yarn'],
      steps: [
        {
          number: 1,
          title: 'Installation',
          description: 'Install the package using npm',
          code: [{
            title: 'Install',
            description: '',
            code: 'npm install your-package',
            language: 'bash',
          }],
          explanation: 'This will install the package and all its dependencies',
        },
        {
          number: 2,
          title: 'Basic Usage',
          description: 'Import and use the main functionality',
          code: [{
            title: 'Basic Example',
            description: '',
            code: 'import { feature } from "your-package";\n\nconst result = feature();',
            language: 'typescript',
          }],
          explanation: 'This shows the basic usage pattern',
        },
      ],
      conclusion: 'You have successfully completed the getting started tutorial!',
      nextSteps: ['Read the API reference', 'Explore advanced features'],
    };

    const md = this.markdownGenerator.generateTutorial(tutorial);
    const outputPath = join(this.config.output, 'tutorials', 'getting-started.md');

    await fs.mkdir(dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, md);
  }

  /**
   * Generate code examples
   */
  async generateExamples(): Promise<void> {
    const examplesDir = join(this.config.output, 'examples');
    await fs.mkdir(examplesDir, { recursive: true });

    // Create basic examples
    const examples = [
      {
        name: 'basic-usage.md',
        content: '# Basic Usage\n\nExamples of basic usage patterns.\n',
      },
      {
        name: 'advanced.md',
        content: '# Advanced Usage\n\nExamples of advanced features.\n',
      },
    ];

    for (const example of examples) {
      await fs.writeFile(join(examplesDir, example.name), example.content);
    }
  }

  /**
   * Generate changelog from git history
   */
  async generateChangelog(): Promise<void> {
    // This would parse git commits and generate changelog
    // For now, create a basic template

    const changelog = this.markdownGenerator.generateChangelog([
      {
        version: '1.0.0',
        date: new Date(),
        changes: [
          { type: 'added', description: 'Initial release' },
        ],
      },
    ]);

    const outputPath = join(this.config.output, 'CHANGELOG.md');
    await fs.writeFile(outputPath, changelog);
  }

  /**
   * Validate documentation
   */
  async validate(): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if API reference has code examples
    const apiRefPath = join(this.config.output, 'api-reference.md');

    try {
      const content = await fs.readFile(apiRefPath, 'utf-8');

      // Count code examples
      const exampleCount = (content.match(/```/g) || []).length / 2;

      if (exampleCount === 0) {
        warnings.push('API reference has no code examples');
      }

      // Check for broken links
      const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];

      for (const link of links) {
        const match = link.match(/\(([^)]+)\)/);
        if (match) {
          const href = match[1];

          // Check if internal link exists
          if (href.startsWith('#')) {
            // Anchor link - would need to check if it exists
          } else if (!href.startsWith('http')) {
            // Relative link - check if file exists
            const linkPath = join(this.config.output, href);
            try {
              await fs.access(linkPath);
            } catch {
              errors.push(`Broken link: ${href}`);
            }
          }
        }
      }
    } catch (error) {
      errors.push('Could not read API reference');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Find all source files
   */
  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];

    async function scanDir(dir: string): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name)) {
              await scanDir(fullPath);
            }
          } else if (entry.isFile()) {
            if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignore errors
      }
    }

    const srcDir = join(this.projectRoot, 'src');
    try {
      await scanDir(srcDir);
    } catch (error) {
      // src directory might not exist
    }

    return files;
  }

  /**
   * Watch for changes and regenerate
   */
  async watch(): Promise<void> {
    // This would set up file watchers and regenerate on changes
    // Not implemented in this basic version
    this.emit('watch-started');
  }

  /**
   * Export documentation to different formats
   */
  async export(format: 'html' | 'pdf'): Promise<void> {
    // This would convert markdown to other formats
    // Not implemented in this basic version
    this.emit('export-started', format);
  }
}
