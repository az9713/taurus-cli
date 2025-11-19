/**
 * Code Extractor
 *
 * Extracts documentation from source code
 */

import { promises as fs } from 'fs';
import { ExtractionResult, FunctionDoc, ClassDoc, InterfaceDoc, TypeDoc } from '../types.js';

export class CodeExtractor {
  /**
   * Extract documentation from a TypeScript/JavaScript file
   */
  async extractFromFile(filePath: string): Promise<ExtractionResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    return this.extractFromCode(content, filePath);
  }

  /**
   * Extract documentation from code string
   */
  extractFromCode(code: string, filePath: string = 'unknown'): ExtractionResult {
    const result: ExtractionResult = {
      functions: [],
      classes: [],
      interfaces: [],
      types: [],
      constants: [],
    };

    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Extract functions
      if (/export\s+(async\s+)?function\s+(\w+)/.test(line)) {
        const func = this.extractFunction(lines, i);
        if (func) result.functions.push(func);
      }

      // Extract classes
      if (/export\s+class\s+(\w+)/.test(line)) {
        const cls = this.extractClass(lines, i);
        if (cls) result.classes.push(cls);
      }

      // Extract interfaces
      if (/export\s+interface\s+(\w+)/.test(line)) {
        const iface = this.extractInterface(lines, i);
        if (iface) result.interfaces.push(iface);
      }

      // Extract types
      if (/export\s+type\s+(\w+)/.test(line)) {
        const type = this.extractType(lines, i);
        if (type) result.types.push(type);
      }

      // Extract constants
      if (/export\s+const\s+(\w+)/.test(line) && !/=\s*\(|=>/.test(line)) {
        const constant = this.extractConstant(lines, i);
        if (constant) result.constants.push(constant);
      }
    }

    return result;
  }

  /**
   * Extract function documentation
   */
  private extractFunction(lines: string[], startIndex: number): FunctionDoc | null {
    // Get JSDoc comment above function
    const jsdoc = this.extractJSDoc(lines, startIndex);

    // Get function signature
    const funcLine = lines[startIndex];
    const match = funcLine.match(/export\s+(async\s+)?function\s+(\w+)\s*\(([^)]*)\)/);

    if (!match) return null;

    const name = match[2];
    const paramsStr = match[3];

    // Parse parameters
    const parameters = this.parseParameters(paramsStr, jsdoc);

    // Extract return type from JSDoc or TypeScript
    const returns = this.extractReturnInfo(funcLine, jsdoc);

    return {
      name,
      signature: funcLine.trim(),
      description: jsdoc.description,
      parameters,
      returns,
      examples: jsdoc.examples,
      deprecated: jsdoc.tags.includes('@deprecated'),
      tags: jsdoc.tags,
    };
  }

  /**
   * Extract class documentation
   */
  private extractClass(lines: string[], startIndex: number): ClassDoc | null {
    const jsdoc = this.extractJSDoc(lines, startIndex);
    const classLine = lines[startIndex];
    const match = classLine.match(/export\s+class\s+(\w+)/);

    if (!match) return null;

    const name = match[1];

    // Find class body
    let braceCount = 0;
    let inClass = false;
    const methods: FunctionDoc[] = [];
    const properties: any[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('{')) {
        braceCount += (line.match(/\{/g) || []).length;
        inClass = true;
      }

      if (inClass) {
        // Extract methods
        if (/^\s*(public|private|protected)?\s*(async\s+)?(\w+)\s*\([^)]*\)/.test(line)) {
          const methodDoc = this.extractMethod(lines, i);
          if (methodDoc) methods.push(methodDoc);
        }

        // Extract properties
        if (/^\s*(public|private|protected)?\s*(\w+)\s*:\s*(.+);/.test(line)) {
          const propDoc = this.extractProperty(lines, i);
          if (propDoc) properties.push(propDoc);
        }
      }

      if (line.includes('}')) {
        braceCount -= (line.match(/\}/g) || []).length;
        if (braceCount === 0) break;
      }
    }

    return {
      name,
      description: jsdoc.description,
      constructor: undefined,
      properties,
      methods,
    };
  }

  /**
   * Extract interface documentation
   */
  private extractInterface(lines: string[], startIndex: number): InterfaceDoc | null {
    const jsdoc = this.extractJSDoc(lines, startIndex);
    const interfaceLine = lines[startIndex];
    const match = interfaceLine.match(/export\s+interface\s+(\w+)/);

    if (!match) return null;

    const name = match[1];
    const properties: any[] = [];

    // Find interface body
    let braceCount = 0;
    let inInterface = false;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('{')) {
        braceCount++;
        inInterface = true;
        continue;
      }

      if (inInterface && line.includes('}')) {
        braceCount--;
        if (braceCount === 0) break;
      }

      if (inInterface) {
        const propMatch = line.match(/^\s*(\w+)(\?)?:\s*(.+);/);
        if (propMatch) {
          const propJsdoc = this.extractJSDoc(lines, i);
          properties.push({
            name: propMatch[1],
            type: propMatch[3],
            description: propJsdoc.description || '',
            visibility: 'public',
            readonly: false,
          });
        }
      }
    }

    return {
      name,
      description: jsdoc.description,
      properties,
    };
  }

  /**
   * Extract type documentation
   */
  private extractType(lines: string[], startIndex: number): TypeDoc | null {
    const jsdoc = this.extractJSDoc(lines, startIndex);
    const typeLine = lines[startIndex];
    const match = typeLine.match(/export\s+type\s+(\w+)\s*=\s*(.+);/);

    if (!match) return null;

    return {
      name: match[1],
      description: jsdoc.description,
      definition: match[2],
    };
  }

  /**
   * Extract constant documentation
   */
  private extractConstant(lines: string[], startIndex: number): any | null {
    const jsdoc = this.extractJSDoc(lines, startIndex);
    const constLine = lines[startIndex];
    const match = constLine.match(/export\s+const\s+(\w+):\s*([^=]+)\s*=\s*(.+);/);

    if (!match) return null;

    return {
      name: match[1],
      type: match[2].trim(),
      value: match[3].trim(),
      description: jsdoc.description,
    };
  }

  /**
   * Extract method from class
   */
  private extractMethod(lines: string[], startIndex: number): FunctionDoc | null {
    const jsdoc = this.extractJSDoc(lines, startIndex);
    const methodLine = lines[startIndex];
    const match = methodLine.match(/^\s*(public|private|protected)?\s*(async\s+)?(\w+)\s*\(([^)]*)\)/);

    if (!match) return null;

    const name = match[3];
    const paramsStr = match[4];

    const parameters = this.parseParameters(paramsStr, jsdoc);
    const returns = this.extractReturnInfo(methodLine, jsdoc);

    return {
      name,
      signature: methodLine.trim(),
      description: jsdoc.description,
      parameters,
      returns,
    };
  }

  /**
   * Extract property from class
   */
  private extractProperty(lines: string[], startIndex: number): any | null {
    const jsdoc = this.extractJSDoc(lines, startIndex);
    const propLine = lines[startIndex];
    const match = propLine.match(/^\s*(public|private|protected)?\s*(readonly\s+)?(\w+)\s*:\s*(.+);/);

    if (!match) return null;

    return {
      name: match[3],
      type: match[4].trim(),
      description: jsdoc.description,
      visibility: match[1] || 'public',
      readonly: !!match[2],
    };
  }

  /**
   * Extract JSDoc comment
   */
  private extractJSDoc(lines: string[], endIndex: number): {
    description: string;
    tags: string[];
    examples: any[];
  } {
    const jsdoc = { description: '', tags: [] as string[], examples: [] as any[] };

    // Look backwards for JSDoc comment
    let commentLines: string[] = [];
    for (let i = endIndex - 1; i >= 0; i--) {
      const line = lines[i].trim();

      if (line === '*/') {
        // Found end of JSDoc
        continue;
      } else if (line.startsWith('/**')) {
        // Found start of JSDoc
        break;
      } else if (line.startsWith('*')) {
        // Comment line
        commentLines.unshift(line.substring(1).trim());
      } else if (line === '') {
        // Empty line, might be outside comment
        continue;
      } else {
        // Not a comment line, stop
        break;
      }
    }

    // Parse JSDoc lines
    let currentDescription = '';

    for (const line of commentLines) {
      if (line.startsWith('@')) {
        jsdoc.tags.push(line);

        // Parse example
        if (line.startsWith('@example')) {
          // Extract example code
        }
      } else if (!line.startsWith('@')) {
        currentDescription += line + ' ';
      }
    }

    jsdoc.description = currentDescription.trim();

    return jsdoc;
  }

  /**
   * Parse function parameters
   */
  private parseParameters(paramsStr: string, jsdoc: any): any[] {
    const params: any[] = [];

    if (!paramsStr.trim()) return params;

    const paramList = paramsStr.split(',');

    for (const param of paramList) {
      const match = param.trim().match(/(\w+)(\?)?:\s*(.+?)(\s*=\s*(.+))?$/);

      if (match) {
        params.push({
          name: match[1],
          type: match[3],
          description: '',
          optional: !!match[2] || !!match[4],
          defaultValue: match[5],
        });
      }
    }

    return params;
  }

  /**
   * Extract return information
   */
  private extractReturnInfo(line: string, jsdoc: any): any {
    // Try to extract from TypeScript syntax
    const match = line.match(/:\s*([^{=]+)\s*[{=]/);

    return {
      type: match?.[1]?.trim() || 'void',
      description: '',
    };
  }
}
