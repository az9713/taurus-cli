/**
 * Q&A Engine
 *
 * Answers questions about the codebase using AI and semantic search
 */

import { ClaudeClient } from '../api/claude.js';
import { SemanticSearch } from './semantic-search.js';
import { Question, Answer, CodebaseIndex } from './types.js';

export class QAEngine {
  private client: ClaudeClient;
  private search: SemanticSearch;
  private index: CodebaseIndex | null;

  constructor(client: ClaudeClient) {
    this.client = client;
    this.search = new SemanticSearch(client);
    this.index = null;
  }

  /**
   * Set the codebase index
   */
  setIndex(index: CodebaseIndex): void {
    this.index = index;
    this.search.setIndex(index);
  }

  /**
   * Answer a question about the codebase
   */
  async answer(question: Question): Promise<Answer> {
    if (!this.index) {
      throw new Error('Index not loaded');
    }

    // Search for relevant code
    const searchResults = await this.search.search({
      query: question.text,
      type: 'hybrid',
      maxResults: 5,
    });

    // Build context from search results
    const context = this.buildContext(searchResults);

    // Generate answer using AI
    const prompt = this.buildPrompt(question, context);
    const response = await this.client.generateText(prompt);

    // Parse response
    const answer = this.parseAnswer(response, searchResults);

    return answer;
  }

  /**
   * Answer multiple related questions
   */
  async answerMultiple(questions: Question[]): Promise<Answer[]> {
    const answers: Answer[] = [];

    for (const question of questions) {
      const answer = await this.answer(question);
      answers.push(answer);
    }

    return answers;
  }

  /**
   * Explain code element
   */
  async explainCode(code: string, language?: string): Promise<string> {
    const prompt = `Explain the following ${language || ''} code in detail:\n\n\`\`\`\n${code}\n\`\`\`\n\nProvide a clear explanation of what this code does, how it works, and any important details.`;

    return await this.client.generateText(prompt);
  }

  /**
   * Suggest improvements for code
   */
  async suggestImprovements(code: string, language?: string): Promise<string[]> {
    const prompt = `Analyze the following ${language || ''} code and suggest improvements:\n\n\`\`\`\n${code}\n\`\`\`\n\nProvide specific, actionable suggestions for improving this code. Format as a numbered list.`;

    const response = await this.client.generateText(prompt);

    // Parse numbered list
    const suggestions = response
      .split('\n')
      .filter((line: string) => /^\d+\./.test(line.trim()))
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());

    return suggestions;
  }

  /**
   * Find usage examples
   */
  async findUsageExamples(functionName: string): Promise<Answer> {
    if (!this.index) {
      throw new Error('Index not loaded');
    }

    // Search for the function
    const results = await this.search.search({
      query: functionName,
      type: 'keyword',
      maxResults: 10,
      filters: {
        elementTypes: ['function', 'method'],
      },
    });

    if (results.length === 0) {
      return {
        text: `No function found with name: ${functionName}`,
        confidence: 0,
        sources: [],
      };
    }

    // Find usages (simplified - would need full reference tracking)
    const usages = results.filter(r =>
      r.element.code.includes(functionName) && r.element.name !== functionName
    );

    const examples = usages.slice(0, 3).map(r => r.element.code).join('\n\n---\n\n');

    return {
      text: `Found ${usages.length} usage examples for ${functionName}`,
      confidence: 0.8,
      sources: usages,
      code: examples,
      explanation: `Usage examples of ${functionName} in the codebase`,
    };
  }

  /**
   * Build context from search results
   */
  private buildContext(results: any[]): string {
    let context = '';

    results.forEach((result, i) => {
      context += `\n[Source ${i + 1}: ${result.element.file}:${result.element.line}]\n`;
      context += `${result.element.code}\n`;

      if (result.element.documentation) {
        context += `Documentation: ${result.element.documentation}\n`;
      }
    });

    return context;
  }

  /**
   * Build prompt for Q&A
   */
  private buildPrompt(question: Question, context: string): string {
    let prompt = 'You are a code assistant helping developers understand their codebase.\n\n';

    if (question.context && question.context.length > 0) {
      prompt += 'Additional Context:\n';
      question.context.forEach(ctx => {
        prompt += `- ${ctx}\n`;
      });
      prompt += '\n';
    }

    prompt += `Question: ${question.text}\n\n`;

    if (context) {
      prompt += 'Relevant Code:\n';
      prompt += context;
      prompt += '\n';
    }

    prompt += 'Please provide a clear, accurate answer based on the code shown above. ';
    prompt += 'If the answer requires code examples, include them. ';
    prompt += 'If you cannot answer based on the provided code, say so.';

    return prompt;
  }

  /**
   * Parse answer from AI response
   */
  private parseAnswer(response: string, sources: any[]): Answer {
    // Extract code blocks if present
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/g;
    const codeBlocks: string[] = [];
    let match;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      codeBlocks.push(match[1]);
    }

    // Remove code blocks from text
    const text = response.replace(codeBlockRegex, '[Code example]').trim();

    // Calculate confidence based on response characteristics
    const confidence = this.calculateConfidence(response, sources);

    return {
      text,
      confidence,
      sources,
      code: codeBlocks.length > 0 ? codeBlocks.join('\n\n') : undefined,
      explanation: text,
    };
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(response: string, sources: any[]): number {
    let confidence = 0.5;

    // More sources = higher confidence
    if (sources.length >= 3) {
      confidence += 0.2;
    } else if (sources.length >= 1) {
      confidence += 0.1;
    }

    // Definitive language = higher confidence
    if (response.includes('definitely') || response.includes('certainly')) {
      confidence += 0.1;
    }

    // Uncertain language = lower confidence
    if (response.includes('might') || response.includes('possibly') || response.includes('unsure')) {
      confidence -= 0.2;
    }

    // Contains code = higher confidence
    if (response.includes('```')) {
      confidence += 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate documentation for element
   */
  async generateDocumentation(code: string, language: string): Promise<string> {
    const prompt = `Generate comprehensive documentation for the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nInclude:\n- Brief description\n- Parameters (if applicable)\n- Return value (if applicable)\n- Usage examples\n- Important notes`;

    return await this.client.generateText(prompt);
  }
}
