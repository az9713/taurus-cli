/**
 * Documentation Types
 *
 * Type definitions for automated documentation generation
 */

export type DocumentationFormat = 'markdown' | 'html' | 'pdf' | 'json';

export type DiagramType =
  | 'sequence'
  | 'class'
  | 'flow'
  | 'architecture'
  | 'entity-relationship'
  | 'state-machine';

export interface DocumentationConfig {
  enabled: boolean;
  output: string; // Output directory
  formats: DocumentationFormat[];
  features: {
    apiReference: boolean;
    tutorials: boolean;
    examples: boolean;
    diagrams: boolean;
    changelog: boolean;
  };
  styles: {
    template: 'docusaurus' | 'vuepress' | 'mkdocs' | 'custom';
    theme: 'light' | 'dark' | 'auto';
  };
  exclude?: string[];
}

export interface FunctionDoc {
  name: string;
  signature: string;
  description: string;
  parameters: ParameterDoc[];
  returns: ReturnDoc;
  throws?: string[];
  examples?: CodeExample[];
  since?: string;
  deprecated?: boolean;
  tags?: string[];
}

export interface ParameterDoc {
  name: string;
  type: string;
  description: string;
  optional: boolean;
  defaultValue?: string;
}

export interface ReturnDoc {
  type: string;
  description: string;
}

export interface ClassDoc {
  name: string;
  description: string;
  extends?: string;
  implements?: string[];
  constructor?: FunctionDoc;
  properties: PropertyDoc[];
  methods: FunctionDoc[];
  examples?: CodeExample[];
}

export interface PropertyDoc {
  name: string;
  type: string;
  description: string;
  visibility: 'public' | 'private' | 'protected';
  readonly: boolean;
  defaultValue?: string;
}

export interface CodeExample {
  title: string;
  description: string;
  code: string;
  language: string;
  output?: string;
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters: {
    name: string;
    in: 'path' | 'query' | 'header' | 'body';
    type: string;
    required: boolean;
    description: string;
  }[];
  requestBody?: {
    contentType: string;
    schema: any;
    example: any;
  };
  responses: {
    code: number;
    description: string;
    schema?: any;
    example?: any;
  }[];
  authentication?: string;
}

export interface Tutorial {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  prerequisites: string[];
  steps: TutorialStep[];
  conclusion: string;
  nextSteps?: string[];
}

export interface TutorialStep {
  number: number;
  title: string;
  description: string;
  code?: CodeExample[];
  explanation: string;
  tips?: string[];
  commonIssues?: string[];
}

export interface Diagram {
  type: DiagramType;
  title: string;
  description: string;
  content: string; // Mermaid, PlantUML, or other diagram syntax
  format: 'mermaid' | 'plantuml' | 'graphviz';
}

export interface ChangelogEntry {
  version: string;
  date: Date;
  changes: {
    type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
    description: string;
    breaking?: boolean;
  }[];
}

export interface DocumentationProject {
  name: string;
  version: string;
  description: string;
  sections: DocumentationSection[];
  apiReference?: APIReference;
  tutorials?: Tutorial[];
  diagrams?: Diagram[];
  changelog?: ChangelogEntry[];
}

export interface DocumentationSection {
  title: string;
  slug: string;
  content: string;
  subsections?: DocumentationSection[];
  order: number;
}

export interface APIReference {
  functions: FunctionDoc[];
  classes: ClassDoc[];
  interfaces: InterfaceDoc[];
  types: TypeDoc[];
  endpoints?: APIEndpoint[];
}

export interface InterfaceDoc {
  name: string;
  description: string;
  extends?: string[];
  properties: PropertyDoc[];
  examples?: CodeExample[];
}

export interface TypeDoc {
  name: string;
  description: string;
  definition: string;
  examples?: CodeExample[];
}

export interface ExtractionResult {
  functions: FunctionDoc[];
  classes: ClassDoc[];
  interfaces: InterfaceDoc[];
  types: TypeDoc[];
  constants: {
    name: string;
    type: string;
    value: string;
    description: string;
  }[];
}
