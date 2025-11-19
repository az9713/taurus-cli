/**
 * API Spec Parser
 *
 * Parses OpenAPI/Swagger specifications
 */

import { APISpecification, Operation, PathItem } from './types.js';

export class APISpecParser {
  /**
   * Parse OpenAPI specification
   */
  parse(spec: any): APISpecification {
    return {
      openapi: spec.openapi || spec.swagger,
      info: spec.info || {
        title: 'API',
        version: '1.0.0',
      },
      servers: spec.servers || [{ url: 'http://localhost' }],
      paths: spec.paths || {},
      components: spec.components,
    };
  }

  /**
   * Extract all endpoints
   */
  extractEndpoints(spec: APISpecification): Array<{
    path: string;
    method: string;
    operation: Operation;
  }> {
    const endpoints: Array<{ path: string; method: string; operation: Operation }> = [];

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem as PathItem)) {
        if (method in ['get', 'post', 'put', 'delete', 'patch']) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            operation: operation as Operation,
          });
        }
      }
    }

    return endpoints;
  }

  /**
   * Validate specification
   */
  validate(spec: APISpecification): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!spec.info) {
      errors.push('Missing info section');
    }

    if (!spec.paths || Object.keys(spec.paths).length === 0) {
      errors.push('No paths defined');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
