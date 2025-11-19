/**
 * Update Analyzer
 *
 * Analyzes impact of dependency updates
 */

import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { UpdateAnalysis, BreakingChange } from './types.js';

const exec = promisify(execCallback);

export class UpdateAnalyzer {
  private packageManager: 'npm' | 'yarn' | 'pnpm';

  constructor(packageManager: 'npm' | 'yarn' | 'pnpm' = 'npm') {
    this.packageManager = packageManager;
  }

  /**
   * Analyze update impact
   */
  async analyzeUpdate(packageName: string, fromVersion: string, toVersion: string): Promise<UpdateAnalysis> {
    // Determine update type
    const updateType = this.determineUpdateType(fromVersion, toVersion);

    // Get breaking changes
    const breakingChanges = await this.getBreakingChanges(packageName, fromVersion, toVersion);

    // Estimate impact
    const estimatedImpact = this.estimateImpact(updateType, breakingChanges);

    // Get recommendation
    const recommendation = this.getRecommendation(updateType, breakingChanges, estimatedImpact);

    // Get changelog
    const changelog = await this.getChangelog(packageName, fromVersion, toVersion);

    return {
      package: packageName,
      from: fromVersion,
      to: toVersion,
      updateType,
      breakingChanges,
      filesAffected: 0, // Would need code analysis
      estimatedImpact,
      recommendation,
      changelog,
    };
  }

  /**
   * Determine update type
   */
  private determineUpdateType(from: string, to: string): 'major' | 'minor' | 'patch' {
    const fromParts = from.replace(/^[\^~]/, '').split('.').map(Number);
    const toParts = to.replace(/^[\^~]/, '').split('.').map(Number);

    if (toParts[0] > fromParts[0]) return 'major';
    if (toParts[1] > fromParts[1]) return 'minor';
    return 'patch';
  }

  /**
   * Get breaking changes from changelog or release notes
   */
  private async getBreakingChanges(
    packageName: string,
    fromVersion: string,
    toVersion: string
  ): Promise<BreakingChange[]> {
    const breakingChanges: BreakingChange[] = [];

    try {
      // Try to get changelog from npm
      const changelog = await this.getChangelog(packageName, fromVersion, toVersion);

      // Parse changelog for breaking changes
      const breakingKeywords = [
        'BREAKING CHANGE',
        'breaking:',
        'BREAKING:',
        'DEPRECATED',
        'removed',
        'incompatible',
      ];

      const lines = changelog.split('\n');
      for (const line of lines) {
        for (const keyword of breakingKeywords) {
          if (line.toUpperCase().includes(keyword)) {
            breakingChanges.push({
              type: 'behavior',
              description: line.trim(),
              affectedCode: [],
            });
          }
        }
      }
    } catch (error) {
      // Couldn't get changelog
    }

    // If major version update and no breaking changes found, assume there are some
    if (breakingChanges.length === 0 && this.determineUpdateType(fromVersion, toVersion) === 'major') {
      breakingChanges.push({
        type: 'behavior',
        description: 'Major version update may contain breaking changes. Review release notes.',
        affectedCode: [],
      });
    }

    return breakingChanges;
  }

  /**
   * Get changelog between versions
   */
  private async getChangelog(
    packageName: string,
    fromVersion: string,
    toVersion: string
  ): Promise<string> {
    try {
      // Try to get from npm view
      const { stdout } = await exec(`npm view ${packageName}@${toVersion} --json`);
      const packageInfo = JSON.parse(stdout);

      // Look for changelog in repository
      if (packageInfo.repository && packageInfo.repository.url) {
        const repoUrl = packageInfo.repository.url
          .replace('git+', '')
          .replace('.git', '')
          .replace('git://', 'https://');

        return `Changelog: ${repoUrl}/releases\nVersion ${fromVersion} → ${toVersion}`;
      }

      return `Updated from ${fromVersion} to ${toVersion}`;
    } catch (error) {
      return '';
    }
  }

  /**
   * Estimate update impact
   */
  private estimateImpact(
    updateType: 'major' | 'minor' | 'patch',
    breakingChanges: BreakingChange[]
  ): 'low' | 'medium' | 'high' {
    if (updateType === 'major' || breakingChanges.length > 0) {
      return 'high';
    }

    if (updateType === 'minor') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get recommendation
   */
  private getRecommendation(
    updateType: 'major' | 'minor' | 'patch',
    breakingChanges: BreakingChange[],
    impact: 'low' | 'medium' | 'high'
  ): 'safe' | 'review' | 'risky' {
    if (impact === 'high' || breakingChanges.length > 0) {
      return 'risky';
    }

    if (impact === 'medium' || updateType === 'minor') {
      return 'review';
    }

    return 'safe';
  }

  /**
   * Predict which files will be affected by update
   */
  async predictAffectedFiles(packageName: string, projectRoot: string): Promise<string[]> {
    // This would require actual code analysis
    // For now, return empty array
    return [];
  }

  /**
   * Check if update will break build
   */
  async checkBuildCompatibility(packageName: string, version: string): Promise<{
    compatible: boolean;
    errors: string[];
  }> {
    // This would require running the build
    // For now, return optimistic result
    return {
      compatible: true,
      errors: [],
    };
  }

  /**
   * Generate migration guide
   */
  async generateMigrationGuide(analysis: UpdateAnalysis): Promise<string> {
    let guide = `# Migration Guide: ${analysis.package} ${analysis.from} → ${analysis.to}\n\n`;

    guide += `## Update Type: ${analysis.updateType}\n\n`;
    guide += `**Estimated Impact**: ${analysis.estimatedImpact}\n`;
    guide += `**Recommendation**: ${analysis.recommendation}\n\n`;

    if (analysis.breakingChanges.length > 0) {
      guide += '## Breaking Changes\n\n';

      for (const change of analysis.breakingChanges) {
        guide += `### ${change.type}\n\n`;
        guide += `${change.description}\n\n`;

        if (change.migrationSteps && change.migrationSteps.length > 0) {
          guide += '**Migration Steps:**\n\n';
          change.migrationSteps.forEach((step, i) => {
            guide += `${i + 1}. ${step}\n`;
          });
          guide += '\n';
        }
      }
    }

    if (analysis.changelog) {
      guide += '## Changelog\n\n';
      guide += `${analysis.changelog}\n\n`;
    }

    guide += '## Recommended Actions\n\n';

    if (analysis.recommendation === 'safe') {
      guide += '1. Update the package\n';
      guide += '2. Run tests to verify\n';
      guide += '3. Deploy\n';
    } else if (analysis.recommendation === 'review') {
      guide += '1. Review release notes\n';
      guide += '2. Update in development branch\n';
      guide += '3. Run full test suite\n';
      guide += '4. Manual QA testing\n';
      guide += '5. Merge to main\n';
    } else {
      guide += '1. ⚠️ **DO NOT auto-update**\n';
      guide += '2. Review all breaking changes\n';
      guide += '3. Update in separate feature branch\n';
      guide += '4. Update affected code\n';
      guide += '5. Comprehensive testing\n';
      guide += '6. Code review\n';
      guide += '7. Staged rollout\n';
    }

    return guide;
  }
}
