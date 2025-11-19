/**
 * API Generator Types
 *
 * Type definitions for API client generation and testing
 */

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type AuthType = 'none' | 'basic' | 'bearer' | 'api-key' | 'oauth2';

export type ClientLanguage = 'typescript' | 'javascript' | 'python' | 'java' | 'go' | 'rust';

export interface APIGeneratorConfig {
  enabled: boolean;
  defaultLanguage: ClientLanguage;
  generateTests: boolean;
  generateDocs: boolean;
  authentication: {
    type: AuthType;
    location?: 'header' | 'query' | 'cookie';
    name?: string;
  };
  client: {
    includeTypes: boolean;
    includeValidation: boolean;
    includeRetry: boolean;
    timeout: number;
  };
  testing: {
    framework: string;
    includeMocks: boolean;
    coverageTarget: number;
  };
}

export interface APISpecification {
  openapi?: string;
  info: APIInfo;
  servers: Server[];
  paths: Record<string, PathItem>;
  components?: Components;
}

export interface APIInfo {
  title: string;
  version: string;
  description?: string;
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
}

export interface Server {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  default: string;
  enum?: string[];
  description?: string;
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
  patch?: Operation;
  parameters?: Parameter[];
}

export interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  tags?: string[];
  security?: SecurityRequirement[];
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required?: boolean;
  schema: Schema;
  description?: string;
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, MediaType>;
}

export interface MediaType {
  schema: Schema;
  example?: any;
  examples?: Record<string, Example>;
}

export interface Response {
  description: string;
  content?: Record<string, MediaType>;
  headers?: Record<string, Header>;
}

export interface Header {
  description?: string;
  schema: Schema;
}

export interface Schema {
  type?: string;
  format?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
  enum?: any[];
  $ref?: string;
}

export interface Example {
  summary?: string;
  description?: string;
  value: any;
}

export interface Components {
  schemas?: Record<string, Schema>;
  responses?: Record<string, Response>;
  parameters?: Record<string, Parameter>;
  securitySchemes?: Record<string, SecurityScheme>;
}

export interface SecurityScheme {
  type: string;
  scheme?: string;
  bearerFormat?: string;
  in?: string;
  name?: string;
}

export interface SecurityRequirement {
  [key: string]: string[];
}

export interface GeneratedClient {
  language: ClientLanguage;
  files: GeneratedFile[];
  tests?: GeneratedFile[];
  documentation?: string;
  metadata: ClientMetadata;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'client' | 'types' | 'test' | 'config';
}

export interface ClientMetadata {
  generatedAt: Date;
  apiVersion: string;
  clientVersion: string;
  endpoints: number;
  types: number;
  hasAuth: boolean;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
  setup?: string;
  teardown?: string;
}

export interface TestCase {
  name: string;
  method: HTTPMethod;
  path: string;
  description?: string;
  request?: {
    headers?: Record<string, string>;
    query?: Record<string, any>;
    body?: any;
  };
  expectedResponse?: {
    status: number;
    body?: any;
    headers?: Record<string, string>;
  };
  assertions: string[];
}

export interface MockServer {
  baseURL: string;
  routes: MockRoute[];
}

export interface MockRoute {
  method: HTTPMethod;
  path: string;
  response: {
    status: number;
    body: any;
    headers?: Record<string, string>;
    delay?: number;
  };
}

export interface ClientGenerationOptions {
  includeAuth?: boolean;
  includeRetry?: boolean;
  includeValidation?: boolean;
  includeTypes?: boolean;
  targetFramework?: string;
  customTemplates?: string;
}
