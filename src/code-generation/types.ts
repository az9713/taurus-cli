/**
 * Code Generation Types
 *
 * Type definitions for AI-powered code generation from specifications
 */

export type TargetLanguage =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'java'
  | 'go'
  | 'rust'
  | 'csharp'
  | 'ruby'
  | 'php';

export type CodePattern =
  | 'class'
  | 'function'
  | 'api-endpoint'
  | 'data-model'
  | 'service'
  | 'component'
  | 'test'
  | 'utility';

export type GenerationQuality = 'fast' | 'balanced' | 'thorough';

export interface CodeGenerationConfig {
  enabled: boolean;
  defaultLanguage: TargetLanguage;
  quality: GenerationQuality;
  templates: {
    enabled: boolean;
    customTemplatesPath?: string;
  };
  validation: {
    syntaxCheck: boolean;
    linting: boolean;
    typeChecking: boolean;
  };
  testing: {
    generateTests: boolean;
    testFramework: string;
    coverageTarget: number;
  };
  documentation: {
    generateDocs: boolean;
    docStyle: 'jsdoc' | 'sphinx' | 'javadoc' | 'godoc' | 'inline';
  };
}

export interface GenerationSpec {
  name: string;
  description: string;
  language: TargetLanguage;
  pattern: CodePattern;
  requirements: string[];
  constraints?: string[];
  examples?: SpecExample[];
  dependencies?: string[];
}

export interface SpecExample {
  input: string;
  output: string;
  description: string;
}

export interface GeneratedCode {
  language: TargetLanguage;
  pattern: CodePattern;
  code: string;
  tests?: string;
  documentation?: string;
  metadata: CodeMetadata;
}

export interface CodeMetadata {
  generatedAt: Date;
  spec: GenerationSpec;
  quality: GenerationQuality;
  linesOfCode: number;
  estimatedComplexity: 'low' | 'medium' | 'high';
  dependencies: string[];
  exports: string[];
  validated: boolean;
  validationResults?: ValidationResult[];
}

export interface ValidationResult {
  type: 'syntax' | 'lint' | 'type' | 'style';
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error';
  code?: string;
}

export interface ValidationWarning {
  line: number;
  column: number;
  message: string;
  severity: 'warning';
  code?: string;
}

export interface Template {
  name: string;
  language: TargetLanguage;
  pattern: CodePattern;
  template: string;
  variables: TemplateVariable[];
  description: string;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface GenerationContext {
  projectRoot: string;
  language: TargetLanguage;
  existingCode?: string[];
  codeStyle?: CodeStyle;
  testFramework?: string;
}

export interface CodeStyle {
  indentation: 'tabs' | 'spaces';
  indentSize: number;
  quotes: 'single' | 'double';
  semicolons: boolean;
  trailingComma: boolean;
  maxLineLength: number;
}

export interface GenerationResult {
  success: boolean;
  generated: GeneratedCode[];
  errors: string[];
  warnings: string[];
  suggestions: string[];
  executionTime: number;
}

export interface SpecParser {
  parse(text: string): GenerationSpec;
  validate(spec: GenerationSpec): ValidationResult;
}

export interface CodeValidator {
  validate(code: string, language: TargetLanguage): Promise<ValidationResult>;
}

export interface TestGenerator {
  generate(code: string, spec: GenerationSpec): Promise<string>;
}
