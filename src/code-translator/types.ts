/**
 * Code Translator Types
 *
 * Type definitions for multi-language code translation
 */

export type SupportedLanguage =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'java'
  | 'go'
  | 'rust'
  | 'csharp'
  | 'ruby'
  | 'php'
  | 'kotlin'
  | 'swift'
  | 'cpp';

export type TranslationQuality = 'fast' | 'balanced' | 'accurate';

export interface CodeTranslatorConfig {
  enabled: boolean;
  quality: TranslationQuality;
  preserveComments: boolean;
  preserveStyles: boolean;
  validation: {
    enabled: boolean;
    compileCheck: boolean;
  };
  optimization: {
    idiomaticCode: boolean;
    modernSyntax: boolean;
  };
}

export interface TranslationRequest {
  sourceCode: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  options?: TranslationOptions;
}

export interface TranslationOptions {
  preserveComments?: boolean;
  preserveStructure?: boolean;
  targetFramework?: string;
  optimizeForPerformance?: boolean;
  includeTests?: boolean;
}

export interface TranslationResult {
  success: boolean;
  translatedCode: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  metadata: TranslationMetadata;
  warnings: TranslationWarning[];
  suggestions: string[];
}

export interface TranslationMetadata {
  translatedAt: Date;
  quality: TranslationQuality;
  linesOfCode: number;
  preservedFeatures: string[];
  addedDependencies: string[];
  removedFeatures: string[];
  confidence: number; // 0-100
}

export interface TranslationWarning {
  type: 'feature-mismatch' | 'syntax-difference' | 'library-unavailable' | 'manual-review';
  severity: 'high' | 'medium' | 'low';
  message: string;
  location?: {
    line: number;
    column: number;
  };
  suggestion?: string;
}

export interface LanguageFeature {
  name: string;
  availability: Map<SupportedLanguage, boolean>;
  equivalents: Map<SupportedLanguage, string>;
}

export interface LanguageMapping {
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  typeMap: Map<string, string>;
  syntaxMap: Map<string, string>;
  idiomMap: Map<string, string>;
  libraryMap: Map<string, string>;
}

export interface TranslationStrategy {
  name: string;
  description: string;
  supportedPairs: Array<{
    from: SupportedLanguage;
    to: SupportedLanguage;
  }>;
  apply: (code: string, options?: TranslationOptions) => Promise<string>;
}

export interface CodeStructure {
  language: SupportedLanguage;
  imports: Import[];
  classes: ClassDefinition[];
  functions: FunctionDefinition[];
  variables: VariableDefinition[];
  exports: Export[];
}

export interface Import {
  module: string;
  items: string[];
  alias?: string;
  isDefault?: boolean;
}

export interface ClassDefinition {
  name: string;
  extends?: string;
  implements?: string[];
  properties: PropertyDefinition[];
  methods: FunctionDefinition[];
  constructors: FunctionDefinition[];
  visibility: 'public' | 'private' | 'protected';
}

export interface PropertyDefinition {
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'protected';
  isStatic: boolean;
  isReadonly: boolean;
  defaultValue?: string;
}

export interface FunctionDefinition {
  name: string;
  parameters: ParameterDefinition[];
  returnType: string;
  isAsync: boolean;
  isStatic: boolean;
  visibility: 'public' | 'private' | 'protected';
  body: string;
}

export interface ParameterDefinition {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
}

export interface VariableDefinition {
  name: string;
  type: string;
  isConst: boolean;
  value?: string;
}

export interface Export {
  name: string;
  type: 'function' | 'class' | 'variable' | 'type';
  isDefault: boolean;
}

export interface TranslationContext {
  sourceStructure: CodeStructure;
  targetLanguage: SupportedLanguage;
  options: TranslationOptions;
  availableLibraries: string[];
}

export interface DependencyMapping {
  source: string;
  target: string | null;
  alternative?: string;
  manual: boolean;
}
