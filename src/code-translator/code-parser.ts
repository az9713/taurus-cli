/**
 * Code Parser
 *
 * Parses source code to extract structure for translation
 */

import {
  SupportedLanguage,
  CodeStructure,
  Import,
  ClassDefinition,
  FunctionDefinition,
  VariableDefinition,
  Export,
} from './types.js';

export class CodeParser {
  /**
   * Parse code into structured format
   */
  parse(code: string, language: SupportedLanguage): CodeStructure {
    switch (language) {
      case 'typescript':
      case 'javascript':
        return this.parseTypeScript(code);
      case 'python':
        return this.parsePython(code);
      case 'java':
        return this.parseJava(code);
      default:
        return this.parseGeneric(code, language);
    }
  }

  /**
   * Parse TypeScript/JavaScript code
   */
  private parseTypeScript(code: string): CodeStructure {
    const structure: CodeStructure = {
      language: 'typescript',
      imports: [],
      classes: [],
      functions: [],
      variables: [],
      exports: [],
    };

    const lines = code.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Parse imports
      if (trimmed.startsWith('import ')) {
        const importMatch = trimmed.match(/import\s+(.+?)\s+from\s+['"](.+?)['"]/);
        if (importMatch) {
          structure.imports.push({
            module: importMatch[2],
            items: importMatch[1].split(',').map(i => i.trim()),
          });
        }
      }

      // Parse class definitions
      if (trimmed.match(/^(export\s+)?class\s+\w+/)) {
        const classMatch = trimmed.match(/class\s+(\w+)(?:\s+extends\s+(\w+))?/);
        if (classMatch) {
          structure.classes.push({
            name: classMatch[1],
            extends: classMatch[2],
            properties: [],
            methods: [],
            constructors: [],
            visibility: 'public',
          });
        }
      }

      // Parse function definitions
      if (trimmed.match(/^(export\s+)?(async\s+)?function\s+\w+/)) {
        const funcMatch = trimmed.match(/function\s+(\w+)\s*\((.*?)\)/);
        if (funcMatch) {
          structure.functions.push({
            name: funcMatch[1],
            parameters: this.parseParameters(funcMatch[2]),
            returnType: 'any',
            isAsync: trimmed.includes('async'),
            isStatic: false,
            visibility: 'public',
            body: '',
          });
        }
      }

      // Parse variable declarations
      if (trimmed.match(/^(export\s+)?(const|let|var)\s+\w+/)) {
        const varMatch = trimmed.match(/(const|let|var)\s+(\w+)/);
        if (varMatch) {
          structure.variables.push({
            name: varMatch[2],
            type: 'any',
            isConst: varMatch[1] === 'const',
          });
        }
      }

      // Parse exports
      if (trimmed.startsWith('export ')) {
        const exportMatch = trimmed.match(/export\s+(?:default\s+)?(\w+)/);
        if (exportMatch) {
          structure.exports.push({
            name: exportMatch[1],
            type: 'function',
            isDefault: trimmed.includes('default'),
          });
        }
      }
    }

    return structure;
  }

  /**
   * Parse Python code
   */
  private parsePython(code: string): CodeStructure {
    const structure: CodeStructure = {
      language: 'python',
      imports: [],
      classes: [],
      functions: [],
      variables: [],
      exports: [],
    };

    const lines = code.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Parse imports
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
        if (trimmed.startsWith('from')) {
          const match = trimmed.match(/from\s+(\S+)\s+import\s+(.+)/);
          if (match) {
            structure.imports.push({
              module: match[1],
              items: match[2].split(',').map(i => i.trim()),
            });
          }
        } else {
          const match = trimmed.match(/import\s+(\S+)(?:\s+as\s+(\w+))?/);
          if (match) {
            structure.imports.push({
              module: match[1],
              items: [match[1]],
              alias: match[2],
            });
          }
        }
      }

      // Parse class definitions
      if (trimmed.match(/^class\s+\w+/)) {
        const classMatch = trimmed.match(/class\s+(\w+)(?:\((\w+)\))?/);
        if (classMatch) {
          structure.classes.push({
            name: classMatch[1],
            extends: classMatch[2],
            properties: [],
            methods: [],
            constructors: [],
            visibility: 'public',
          });
        }
      }

      // Parse function definitions
      if (trimmed.match(/^(async\s+)?def\s+\w+/)) {
        const funcMatch = trimmed.match(/def\s+(\w+)\s*\((.*?)\)/);
        if (funcMatch) {
          structure.functions.push({
            name: funcMatch[1],
            parameters: this.parsePythonParameters(funcMatch[2]),
            returnType: 'Any',
            isAsync: trimmed.includes('async'),
            isStatic: false,
            visibility: funcMatch[1].startsWith('_') ? 'private' : 'public',
            body: '',
          });
        }
      }
    }

    return structure;
  }

  /**
   * Parse Java code
   */
  private parseJava(code: string): CodeStructure {
    const structure: CodeStructure = {
      language: 'java',
      imports: [],
      classes: [],
      functions: [],
      variables: [],
      exports: [],
    };

    const lines = code.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Parse imports
      if (trimmed.startsWith('import ')) {
        const match = trimmed.match(/import\s+(.+?);/);
        if (match) {
          structure.imports.push({
            module: match[1],
            items: [match[1].split('.').pop() || ''],
          });
        }
      }

      // Parse class definitions
      if (trimmed.match(/^(public\s+)?class\s+\w+/)) {
        const classMatch = trimmed.match(/class\s+(\w+)(?:\s+extends\s+(\w+))?/);
        if (classMatch) {
          structure.classes.push({
            name: classMatch[1],
            extends: classMatch[2],
            properties: [],
            methods: [],
            constructors: [],
            visibility: trimmed.startsWith('public') ? 'public' : 'private',
          });
        }
      }

      // Parse method definitions
      if (trimmed.match(/(public|private|protected)\s+\w+\s+\w+\s*\(/)) {
        const methodMatch = trimmed.match(/(public|private|protected)\s+(\w+)\s+(\w+)\s*\((.*?)\)/);
        if (methodMatch) {
          structure.functions.push({
            name: methodMatch[3],
            parameters: this.parseJavaParameters(methodMatch[4]),
            returnType: methodMatch[2],
            isAsync: false,
            isStatic: trimmed.includes('static'),
            visibility: methodMatch[1] as any,
            body: '',
          });
        }
      }
    }

    return structure;
  }

  /**
   * Parse generic code structure
   */
  private parseGeneric(code: string, language: SupportedLanguage): CodeStructure {
    return {
      language,
      imports: [],
      classes: [],
      functions: [],
      variables: [],
      exports: [],
    };
  }

  /**
   * Parse TypeScript/JavaScript parameters
   */
  private parseParameters(params: string): any[] {
    if (!params || params.trim().length === 0) {
      return [];
    }

    return params.split(',').map(p => {
      const trimmed = p.trim();
      const match = trimmed.match(/(\w+)(?::\s*(\w+))?(?:\s*=\s*(.+))?/);

      if (match) {
        return {
          name: match[1],
          type: match[2] || 'any',
          optional: !!match[3],
          defaultValue: match[3],
        };
      }

      return {
        name: trimmed,
        type: 'any',
        optional: false,
      };
    });
  }

  /**
   * Parse Python parameters
   */
  private parsePythonParameters(params: string): any[] {
    if (!params || params.trim().length === 0) {
      return [];
    }

    return params.split(',').map(p => {
      const trimmed = p.trim();
      if (trimmed === 'self') {
        return null;
      }

      const match = trimmed.match(/(\w+)(?::\s*(\w+))?(?:\s*=\s*(.+))?/);

      if (match) {
        return {
          name: match[1],
          type: match[2] || 'Any',
          optional: !!match[3],
          defaultValue: match[3],
        };
      }

      return {
        name: trimmed,
        type: 'Any',
        optional: false,
      };
    }).filter(p => p !== null);
  }

  /**
   * Parse Java parameters
   */
  private parseJavaParameters(params: string): any[] {
    if (!params || params.trim().length === 0) {
      return [];
    }

    return params.split(',').map(p => {
      const trimmed = p.trim();
      const match = trimmed.match(/(\w+)\s+(\w+)/);

      if (match) {
        return {
          name: match[2],
          type: match[1],
          optional: false,
        };
      }

      return {
        name: trimmed,
        type: 'Object',
        optional: false,
      };
    });
  }
}
