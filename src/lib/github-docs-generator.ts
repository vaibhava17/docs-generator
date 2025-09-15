import { simpleGit, SimpleGit } from 'simple-git';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import dotenv from 'dotenv';

dotenv.config();

export interface RepoConfig {
  url: string;
  token?: string; // GitHub PAT for private repos
  targetPath?: string; // Directory to document (default: entire repo)
  branch?: string; // Branch to create docs on (default: 'docs-generation')
}

export interface AIConfig {
  provider: 'openai' | 'gemini';
  apiKey: string;
}

export interface DocumentationOptions {
  overwrite?: boolean;
  force?: boolean;
  excludePatterns?: string[];
  supportedExtensions?: string[];
}

export class GitHubDocsGenerator {
  private git: SimpleGit;
  private openaiClient?: OpenAI;
  private geminiClient?: GoogleGenerativeAI;
  private aiConfig: AIConfig;
  private repoPath: string;
  private options: DocumentationOptions;

  constructor(aiConfig: AIConfig, options: DocumentationOptions = {}) {
    this.aiConfig = aiConfig;
    this.options = {
      overwrite: false,
      force: false,
      excludePatterns: [
        'node_modules',
        '.git',
        '.next',
        'dist',
        'build',
        '.env*',
        'venv',
        'env',
        '.vscode',
        '.idea',
        'logs',
        'coverage',
        '.nyc_output',
        '__pycache__',
        '*.pyc',
        '*.log',
        '*.tmp',
        '.DS_Store',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        '.gitignore',
        '*.md',
        '*.json',
        '*.yml',
        '*.yaml',
        '*.xml',
        '*.txt',
        '*.lock',
        'docs',
        'scripts'
      ],
      supportedExtensions: [
        '.js', '.jsx', '.ts', '.tsx',
        '.py',
        '.java',
        '.cpp', '.c', '.cc', '.cxx',
        '.go',
        '.rs',
        '.php',
        '.rb',
        '.cs',
        '.swift',
        '.kt',
        '.scala',
        '.vue',
        '.svelte'
      ],
      ...options
    };

    this.repoPath = '';
    this.git = simpleGit();
    this.setupAIClients();
  }

  private setupAIClients(): void {
    if (this.aiConfig.provider === 'openai') {
      if (!this.aiConfig.apiKey || !this.aiConfig.apiKey.startsWith('sk-')) {
        console.warn('⚠️ Invalid or missing OpenAI API key. Expected format: sk-...');
      }
      this.openaiClient = new OpenAI({
        apiKey: this.aiConfig.apiKey
      });
    } else if (this.aiConfig.provider === 'gemini') {
      if (!this.aiConfig.apiKey || this.aiConfig.apiKey.length < 10) {
        console.warn('⚠️ Invalid or missing Gemini API key. Please check your API key.');
      }
      this.geminiClient = new GoogleGenerativeAI(this.aiConfig.apiKey);
    }
    
    // Try to setup both clients if possible for fallback
    try {
      if (this.aiConfig.provider === 'openai' && process.env.GEMINI_API_KEY) {
        this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('✅ Gemini fallback client setup successful');
      } else if (this.aiConfig.provider === 'gemini' && process.env.OPENAI_API_KEY) {
        this.openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        console.log('✅ OpenAI fallback client setup successful');
      }
    } catch (error) {
      console.log('ℹ️ No fallback AI client available');
    }
  }

  private async validateGitHubToken(repoUrl: string, token: string): Promise<void> {
    try {
      // Extract owner and repo from URL
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub repository URL format. Expected: https://github.com/owner/repository');
      }
      
      const [, owner, repoName] = match;
      const cleanRepoName = repoName.replace('.git', '');
      
      console.log(`🔍 Validating access to repository: ${owner}/${cleanRepoName}`);
      
      // First validate token scopes by checking user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'docs-generator'
        }
      });
      
      if (!userResponse.ok) {
        if (userResponse.status === 401) {
          throw new Error(`Invalid GitHub token. Please check your token and try again.
Token format should be: ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxxxxxxxx
Generate new token at: https://github.com/settings/tokens/new`);
        }
        throw new Error(`Failed to validate GitHub token: ${userResponse.status} ${userResponse.statusText}`);
      }
      
      // Check token scopes from headers
      const scopes = userResponse.headers.get('x-oauth-scopes')?.split(', ') || [];
      console.log(`🔑 Token scopes: ${scopes.join(', ')}`);
      
      // Check if repository exists publicly (without token)
      const publicCheck = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'docs-generator'
        }
      });
      
      const isPrivateRepo = !publicCheck.ok && publicCheck.status === 404;
      
      // Validate token scopes based on repository type
      if (isPrivateRepo) {
        if (!scopes.includes('repo')) {
          throw new Error(`This appears to be a private repository, but your GitHub token does not have the required 'repo' scope.

For private repositories, you need:
- 'repo' scope (full control of private repositories)

Current token scopes: ${scopes.join(', ')}

Please generate a new token with 'repo' scope at: https://github.com/settings/tokens/new`);
        }
      } else {
        if (!scopes.includes('repo') && !scopes.includes('public_repo')) {
          throw new Error(`Your GitHub token does not have the required scopes for repository access.

For public repositories, you need at least:
- 'public_repo' scope (access public repositories)

For private repositories, you need:
- 'repo' scope (full control of private repositories)

Current token scopes: ${scopes.join(', ')}

Please generate a new token with appropriate scopes at: https://github.com/settings/tokens/new`);
        }
      }
      
      // Now check repository access with token
      const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'docs-generator'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`Invalid GitHub token. Please check your token and try again.
Token format should be: ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxxxxxxxx
Generate new token at: https://github.com/settings/tokens/new`);
        } else if (response.status === 403) {
          const responseText = await response.text();
          if (responseText.includes('rate limit')) {
            throw new Error('GitHub API rate limit exceeded. Please wait a few minutes and try again.');
          }
          throw new Error(`GitHub token does not have sufficient permissions for this repository.

For private repositories: Your token needs 'repo' scope
For public repositories: Your token needs 'public_repo' or 'repo' scope

Current token scopes: ${scopes.join(', ')}
Generate token with correct permissions at: https://github.com/settings/tokens/new`);
        } else if (response.status === 404) {
          throw new Error(`Repository access denied. This could mean:
- Repository is private and your token doesn't have the required 'repo' scope
- Token doesn't have access to this specific repository
- You need to be added as a collaborator to this repository
- Repository name is incorrect (check case sensitivity)

Repository: https://github.com/${owner}/${cleanRepoName}
Current token scopes: ${scopes.join(', ')}`);
        } else {
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}. Please try again or check GitHub status.`);
        }
      }
      
      const repoData = await response.json();
      
      console.log(`✅ Repository access confirmed: ${repoData.full_name} (${repoData.private ? 'private' : 'public'})`);
      
      // Check if user has push access
      if (!repoData.permissions?.push) {
        const requiredScope = repoData.private ? 'repo' : 'public_repo';
        throw new Error(`Your GitHub token does not have push access to this repository.
This is required to commit and push documentation changes.

Please ensure:
1. You have push/write access to the repository (must be collaborator or owner)
2. Your token has '${requiredScope}' scope ${repoData.private ? '(for private repos)' : '(for public repos)'}
3. For organization repos, check if you're a member with write access
4. If the organization uses SSO, authorize your token for SSO

Current token scopes: ${scopes.join(', ')}
Repository type: ${repoData.private ? 'Private' : 'Public'}
Required scope: ${requiredScope}

Generate a new token with correct permissions at: https://github.com/settings/tokens/new`);
      }
      
      console.log('✅ GitHub token validation successful - push access confirmed');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to validate GitHub token');
    }
  }

  async cloneRepository(repoConfig: RepoConfig): Promise<string> {
    const repoName = this.extractRepoName(repoConfig.url);
    const tempDir = path.join(process.cwd(), 'temp-repos');
    this.repoPath = path.join(tempDir, repoName);

    console.log(`🔍 Cloning repository: ${repoConfig.url}`);
    
    // Ensure temp directory exists
    await fs.ensureDir(tempDir);

    // Remove existing directory if it exists
    if (await fs.pathExists(this.repoPath)) {
      await fs.remove(this.repoPath);
    }

    try {
      // Validate token permissions if provided
      if (repoConfig.token) {
        await this.validateGitHubToken(repoConfig.url, repoConfig.token);
      }

      // Clone with authentication if token provided
      let cloneUrl = repoConfig.url;
      if (repoConfig.token) {
        // Insert token into URL for authentication
        cloneUrl = this.addTokenToUrl(repoConfig.url, repoConfig.token);
      }

      await this.git.clone(cloneUrl, this.repoPath);
      this.git = simpleGit(this.repoPath);
      
      // If token provided, configure the remote with authentication for future operations
      if (repoConfig.token) {
        const authenticatedUrl = this.addTokenToUrl(repoConfig.url, repoConfig.token);
        await this.git.removeRemote('origin');
        await this.git.addRemote('origin', authenticatedUrl);
        console.log('🔑 Configured remote with authentication token');
      }
      
      console.log(`✅ Repository cloned to: ${this.repoPath}`);
      return this.repoPath;
    } catch (error) {
      console.error(`❌ Error cloning repository:`, error);
      
      // Provide better error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('denied')) {
          throw new Error(`GitHub authentication failed. Please ensure your token has the following permissions:
- repo (Full control of private repositories)
- public_repo (Access public repositories) 
- write:public_key (Write access to public keys)
- If the repository is private, you need 'repo' scope
- If you're creating a new branch, you need push access

Generate a new token at: https://github.com/settings/tokens/new`);
        }
        
        if (error.message.includes('404') || error.message.includes('not found')) {
          throw new Error(`Repository not found or you don't have access. Please check:
- Repository URL is correct
- Repository exists and is not private (unless you have access)
- Your GitHub token has appropriate permissions`);
        }
      }
      
      throw error;
    }
  }

  private extractRepoName(url: string): string {
    const match = url.match(/\/([^\/]+)\.git$/) || url.match(/\/([^\/]+)$/);
    return match ? match[1] : 'unknown-repo';
  }

  private addTokenToUrl(url: string, token: string): string {
    if (url.startsWith('https://github.com/')) {
      // For GitHub PAT tokens, use 'x-access-token' as username and token as password
      return url.replace('https://github.com/', `https://x-access-token:${token}@github.com/`);
    }
    return url;
  }

  async createDocumentationBranch(branchName: string = 'docs-generation', mainBranch: string = 'main'): Promise<{
    isExistingBranch: boolean,
    hasExistingDocs: boolean,
    changedFiles: string[],
    newFiles: string[],
    needsUpdate: boolean
  }> {
    console.log(`🌿 Setting up documentation branch: ${branchName}`);
    
    try {
      // Fetch all remote branches to get the latest state
      await this.git.fetch();
      
      // Check if branch already exists locally and remotely
      const branches = await this.git.branch(['-a']);
      const localBranchExists = branches.all.some(branch => branch === branchName);
      const remoteBranchExists = branches.all.some(branch => branch === `remotes/origin/${branchName}`);
      const isExistingBranch = localBranchExists || remoteBranchExists;

      if (remoteBranchExists) {
        console.log(`📋 Found existing remote docs branch: ${branchName}`);
        if (localBranchExists) {
          await this.git.checkout(branchName);
          await this.git.pull('origin', branchName);
        } else {
          // Create local branch from remote
          await this.git.checkout(['-b', branchName, `origin/${branchName}`]);
        }
        
        // Check if this branch has existing documentation
        const hasExistingDocs = await this.hasExistingDocumentation();
        
        if (hasExistingDocs) {
          console.log(`📚 Found existing documentation in branch`);
          
          // Merge latest changes from main branch
          const { changedFiles, newFiles, needsUpdate } = await this.mergeFromMainBranch(mainBranch, branchName);
          
          return {
            isExistingBranch: true,
            hasExistingDocs: true,
            changedFiles,
            newFiles,
            needsUpdate
          };
        }
      } else if (localBranchExists) {
        console.log(`📋 Found local docs branch: ${branchName}`);
        await this.git.checkout(branchName);
      } else {
        console.log(`📋 Creating new documentation branch: ${branchName}`);
        await this.git.checkoutLocalBranch(branchName);
      }
      
      console.log(`✅ Switched to branch: ${branchName}`);
      
      return {
        isExistingBranch,
        hasExistingDocs: false,
        changedFiles: [],
        newFiles: [],
        needsUpdate: true
      };
    } catch (error) {
      console.error(`❌ Error setting up documentation branch:`, error);
      throw error;
    }
  }

  private async hasExistingDocumentation(): Promise<boolean> {
    try {
      const docsDir = path.join(this.repoPath, 'docs');
      const indexFile = path.join(this.repoPath, 'DOCUMENTATION_INDEX.md');
      
      const hasDocs = await fs.pathExists(docsDir);
      const hasIndex = await fs.pathExists(indexFile);
      
      if (hasDocs) {
        // Check if docs directory has any .md files
        const files = await glob('**/*.md', { cwd: docsDir });
        return files.length > 0;
      }
      
      return hasIndex;
    } catch (error) {
      console.warn('Warning: Could not check for existing documentation:', error);
      return false;
    }
  }

  private async mergeFromMainBranch(mainBranch: string, docsBranch: string): Promise<{
    changedFiles: string[],
    newFiles: string[],
    needsUpdate: boolean
  }> {
    try {
      console.log(`🔄 Merging latest changes from ${mainBranch} into ${docsBranch}`);
      
      // Get the last commit hash when docs were generated
      const lastDocsCommit = await this.getLastDocumentationCommit();
      
      // Fetch latest from main branch
      await this.git.fetch('origin', mainBranch);
      
      // Get list of files changed since last documentation update
      const changedFiles: string[] = [];
      const newFiles: string[] = [];
      
      if (lastDocsCommit) {
        console.log(`📊 Checking changes since last docs update: ${lastDocsCommit.slice(0, 8)}`);
        
        // Get diff between last docs commit and current main
        const diff = await this.git.diff([
          `${lastDocsCommit}...origin/${mainBranch}`,
          '--name-status'
        ]);
        
        const diffLines = diff.split('\n').filter(line => line.trim());
        
        for (const line of diffLines) {
          const [status, filePath] = line.split('\t');
          if (filePath && this.isSupportedFile(filePath)) {
            if (status === 'A') {
              newFiles.push(filePath);
            } else if (status === 'M' || status === 'D') {
              changedFiles.push(filePath);
            }
          }
        }
      } else {
        console.log(`📊 No previous docs commit found, will analyze all files`);
      }
      
      // Merge from main branch (this will bring in the latest code changes)
      try {
        await this.git.merge([`origin/${mainBranch}`, '--no-ff', '--no-commit']);
        console.log(`✅ Successfully merged changes from ${mainBranch}`);
        
        // Check if there are any conflicts
        const status = await this.git.status();
        if (status.conflicted.length > 0) {
          console.log(`⚠️ Found ${status.conflicted.length} merge conflicts, auto-resolving...`);
          
          // For docs conflicts, prefer the docs branch version
          for (const conflictedFile of status.conflicted) {
            if (conflictedFile.startsWith('docs/') || conflictedFile === 'DOCUMENTATION_INDEX.md') {
              await this.git.add(conflictedFile);
            }
          }
        }
        
        // Commit the merge
        await this.git.commit(`Merge latest changes from ${mainBranch} branch\n\n🔄 Auto-merge for documentation update`);
        
      } catch (mergeError) {
        console.log(`ℹ️ No merge needed or merge conflicts resolved automatically`);
      }
      
      const needsUpdate = changedFiles.length > 0 || newFiles.length > 0;
      
      if (!needsUpdate) {
        console.log(`✅ No changes detected since last documentation update`);
      } else {
        console.log(`📋 Found ${changedFiles.length} changed files and ${newFiles.length} new files`);
      }
      
      return { changedFiles, newFiles, needsUpdate };
      
    } catch (error) {
      console.error(`❌ Error merging from main branch:`, error);
      throw error;
    }
  }

  private async getLastDocumentationCommit(): Promise<string | null> {
    try {
      // Look for commits with documentation generator signature
      const log = await this.git.log(['--grep=📝 Generate documentation', '-1', '--pretty=format:%H']);
      if (log.latest?.hash) {
        return log.latest.hash;
      }
      
      // Fallback: look for any commit that modified docs directory
      const docsLog = await this.git.log(['--', 'docs/', '-1', '--pretty=format:%H']);
      if (docsLog.latest?.hash) {
        return docsLog.latest.hash;
      }
      
      return null;
    } catch (error) {
      console.warn('Warning: Could not find last documentation commit:', error);
      return null;
    }
  }

  async findSourceFiles(
    targetPath?: string,
    changedFiles?: string[],
    newFiles?: string[]
  ): Promise<{ sourceFiles: string[], existingDocs: string[], isIncremental: boolean }> {
    const searchPath = targetPath ? path.join(this.repoPath, targetPath) : this.repoPath;
    
    if (!await fs.pathExists(searchPath)) {
      throw new Error(`Target path does not exist: ${searchPath}`);
    }

    const isIncremental = (changedFiles && changedFiles.length > 0) || (newFiles && newFiles.length > 0);

    if (isIncremental) {
      console.log(`🔍 Scanning changed files for incremental documentation update`);
      console.log(`📝 Changed files: ${changedFiles?.length || 0}`);
      console.log(`🆕 New files: ${newFiles?.length || 0}`);

      const sourceFiles: string[] = [];
      const existingDocs: string[] = [];

      // Process changed files
      if (changedFiles) {
        for (const file of changedFiles) {
          const fullPath = path.join(this.repoPath, file);
          if (await fs.pathExists(fullPath) && this.isSupportedFile(file)) {
            if (await this.documentationExists(file)) {
              if (this.options.overwrite) {
                sourceFiles.push(file);
              } else {
                // For incremental updates, always update existing docs for changed files
                sourceFiles.push(file);
              }
            } else {
              sourceFiles.push(file);
            }
          }
        }
      }

      // Process new files
      if (newFiles) {
        for (const file of newFiles) {
          const fullPath = path.join(this.repoPath, file);
          if (await fs.pathExists(fullPath) && this.isSupportedFile(file)) {
            sourceFiles.push(file);
          }
        }
      }

      console.log(`📊 Incremental update: ${sourceFiles.length} files to document`);
      return { sourceFiles: sourceFiles.sort(), existingDocs: existingDocs.sort(), isIncremental: true };
    } else {
      // Full scan (original logic)
      console.log(`🔍 Scanning all source files in: ${searchPath}`);

      const allFiles = await glob('**/*', {
        cwd: searchPath,
        ignore: this.options.excludePatterns,
        nodir: true
      });

      const sourceFiles: string[] = [];
      const existingDocs: string[] = [];

      for (const file of allFiles) {
        const filePath = path.join(searchPath, file);
        const relativePath = path.relative(this.repoPath, filePath);
        
        if (this.isSupportedFile(file)) {
          if (await this.documentationExists(relativePath)) {
            if (this.options.overwrite) {
              sourceFiles.push(relativePath);
            } else {
              existingDocs.push(relativePath);
            }
          } else {
            sourceFiles.push(relativePath);
          }
        }
      }

      console.log(`📊 Full scan: ${sourceFiles.length} files to document, ${existingDocs.length} with existing docs`);
      return { sourceFiles: sourceFiles.sort(), existingDocs: existingDocs.sort(), isIncremental: false };
    }
  }

  private isSupportedFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.options.supportedExtensions!.includes(ext);
  }

  private async documentationExists(filePath: string): Promise<boolean> {
    const docsDir = path.join(this.repoPath, 'docs');
    const sourceDir = path.dirname(filePath);
    const docDir = path.join(docsDir, sourceDir);
    const docFile = path.join(docDir, `${path.parse(filePath).name}.md`);
    
    return await fs.pathExists(docFile);
  }

  async generateDocumentation(filePath: string): Promise<string | null> {
    const fullPath = path.join(this.repoPath, filePath);
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      
      // Skip very large files (>50KB)
      if (content.length > 50000) {
        console.log(`⚠️ Skipping ${filePath} (too large: ${content.length} chars)`);
        return null;
      }

      // Skip empty files
      if (!content.trim()) {
        console.log(`⚠️ Skipping ${filePath} (empty file)`);
        return null;
      }

      const prompt = this.createDocumentationPrompt(filePath, content);
      return await this.callAI(prompt, filePath);
    } catch (error) {
      console.error(`❌ Error reading file ${filePath}:`, error);
      return null;
    }
  }

  private createDocumentationPrompt(filePath: string, content: string): string {
    return `
Task: Generate comprehensive documentation for the following code file as part of initial project documentation setup.

File: ${filePath}
Content:
\`\`\`
${content}
\`\`\`

Please create documentation following this exact structure:

# ${path.basename(filePath)}

## Overview
Provide a high-level explanation of this file's purpose and role in the application. Focus on what this file does and why it exists.

## Functions and Classes
Document all exported functions, classes, and methods with:
- Purpose and responsibilities
- Key parameters and return values
- Usage patterns and examples where helpful

## Configuration and Constants
Describe important constants, variables, configurations, or environment settings found in the file.

## Usage Examples
Show practical examples of how the main exports (functions, classes, or configs) would be used in the project.

## Dependencies and Integration
List key dependencies and describe how this file integrates with other parts of the codebase.

## Additional Notes
Include any best practices, gotchas, or important implementation details for developers.

Requirements:
- Keep explanations clear and developer-friendly
- Focus on practical usage and integration patterns
- Highlight key functionality and design patterns
- Use proper markdown formatting
- Be comprehensive but concise
- Assume the reader is a developer familiar with the technology stack
`;
  }

  private async callAI(prompt: string, fileName: string): Promise<string | null> {
    try {
      // Try preferred AI service first
      if (this.aiConfig.provider === 'openai' && this.openaiClient) {
        console.log(`🤖 Using OpenAI for ${path.basename(fileName)}`);
        const response = await this.openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a technical documentation expert specializing in code documentation. Generate clear, comprehensive documentation for code files that helps developers understand and use the code effectively."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 2500,
          temperature: 0.1
        });
        return response.choices[0].message.content;
      } else if (this.aiConfig.provider === 'gemini' && this.geminiClient) {
        console.log(`🤖 Using Gemini for ${path.basename(fileName)}`);
        const model = this.geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" });
        const response = await model.generateContent(prompt);
        return response.response.text();
      } else {
        console.error('❌ No AI client available');
        return null;
      }
    } catch (error) {
      console.error(`❌ Error with ${this.aiConfig.provider} for ${fileName}:`, error);
      
      // Try fallback AI service if the main one fails
      try {
        if (this.aiConfig.provider === 'gemini' && this.openaiClient) {
          console.log(`🔄 Gemini failed, trying OpenAI as backup for ${path.basename(fileName)}`);
          const response = await this.openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a technical documentation expert specializing in code documentation. Generate clear, comprehensive documentation for code files that helps developers understand and use the code effectively."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            max_tokens: 2500,
            temperature: 0.1
          });
          return response.choices[0].message.content;
        } else if (this.aiConfig.provider === 'openai' && this.geminiClient) {
          console.log(`🔄 OpenAI failed, trying Gemini as backup for ${path.basename(fileName)}`);
          const model = this.geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" });
          const response = await model.generateContent(prompt);
          return response.response.text();
        } else {
          console.log(`❌ No fallback AI service available for ${fileName}`);
          return null;
        }
      } catch (fallbackError) {
        console.error(`❌ Fallback AI service also failed for ${fileName}:`, fallbackError);
        return null;
      }
    }
  }

  async saveDocumentation(filePath: string, content: string): Promise<void> {
    const docsDir = path.join(this.repoPath, 'docs');
    const sourceDir = path.dirname(filePath);
    const docDir = path.join(docsDir, sourceDir);
    const docFile = path.join(docDir, `${path.parse(filePath).name}.md`);

    try {
      await fs.ensureDir(docDir);
      await fs.writeFile(docFile, content, 'utf-8');
      console.log(`✅ Documentation saved: ${path.relative(this.repoPath, docFile)}`);
    } catch (error) {
      console.error(`❌ Error saving documentation for ${filePath}:`, error);
      throw error;
    }
  }

  async generateIndex(documentedFiles: string[]): Promise<void> {
    console.log(`📋 Generating documentation index...`);
    
    const indexPath = path.join(this.repoPath, 'DOCUMENTATION_INDEX.md');
    const existingEntries = await this.readExistingIndex(indexPath);
    
    // Create entries for newly documented files
    const newEntries: Record<string, Array<{ fileName: string; entry: string; filePath: string }>> = {};
    
    for (const filePath of documentedFiles) {
      const docLink = `docs/${path.dirname(filePath)}/${path.parse(filePath).name}.md`;
      const overview = await this.getFileOverview(path.join(this.repoPath, docLink));
      
      const fileName = path.parse(filePath).name;
      const fileLink = `[${fileName}](${docLink})`;
      const summary = overview ? ` - ${overview}` : '';
      const entry = `- **${fileLink}**${summary}`;
      
      const dirPath = path.dirname(filePath) === '.' ? 'Root' : path.dirname(filePath);
      
      if (!newEntries[dirPath]) {
        newEntries[dirPath] = [];
      }
      
      newEntries[dirPath].push({
        fileName,
        entry,
        filePath
      });
    }

    // Merge with existing entries
    const mergedEntries = { ...existingEntries };
    for (const [dirPath, files] of Object.entries(newEntries)) {
      if (!mergedEntries[dirPath]) {
        mergedEntries[dirPath] = [];
      }
      
      for (const fileInfo of files) {
        const existingIndex = mergedEntries[dirPath].findIndex(
          existing => existing.fileName === fileInfo.fileName
        );
        
        if (existingIndex !== -1) {
          mergedEntries[dirPath][existingIndex] = fileInfo;
          console.log(`🔄 Updated index entry: ${fileInfo.filePath}`);
        } else {
          mergedEntries[dirPath].push(fileInfo);
          console.log(`➕ Added index entry: ${fileInfo.filePath}`);
        }
      }
    }

    await this.writeIndexFile(indexPath, mergedEntries);
  }

  private async readExistingIndex(indexPath: string): Promise<Record<string, Array<{ fileName: string; entry: string; filePath: string }>>> {
    const existingEntries: Record<string, Array<{ fileName: string; entry: string; filePath: string }>> = {};
    
    try {
      if (!await fs.pathExists(indexPath)) {
        return existingEntries;
      }
      
      const content = await fs.readFile(indexPath, 'utf-8');
      const lines = content.split('\n');
      let currentDir: string | null = null;
      
      for (const line of lines) {
        if (line.startsWith('### ') && line.endsWith('/')) {
          currentDir = line.slice(4, -1);
        } else if (line.startsWith('### Root Directory')) {
          currentDir = 'Root';
        } else if (line.startsWith('- **[') && currentDir) {
          const match = line.match(/- \*\*\[([^\]]+)\]/);
          if (match) {
            const fileName = match[1];
            
            if (!existingEntries[currentDir]) {
              existingEntries[currentDir] = [];
            }
            
            existingEntries[currentDir].push({
              fileName,
              entry: line,
              filePath: currentDir === 'Root' ? fileName : `${currentDir}/${fileName}`
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read existing index: ${error}`);
    }
    
    return existingEntries;
  }

  private async getFileOverview(docPath: string): Promise<string> {
    try {
      if (await fs.pathExists(docPath)) {
        const content = await fs.readFile(docPath, 'utf-8');
        const lines = content.split('\n');
        
        for (let i = 4; i < Math.min(15, lines.length); i++) {
          const line = lines[i].trim();
          if (line && !line.startsWith('#') && !line.startsWith('##')) {
            return line.length > 80 ? line.substring(0, 80) + '...' : line;
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read overview from ${docPath}: ${error}`);
    }
    return '';
  }

  private async writeIndexFile(indexPath: string, entries: Record<string, Array<{ fileName: string; entry: string; filePath: string }>>): Promise<void> {
    const totalFiles = Object.values(entries).reduce((sum, files) => sum + files.length, 0);
    
    const indexContent = [
      '# Documentation Index',
      '',
      'This is the complete documentation index for the project, generated automatically from the source code.',
      '',
      `📊 **Total documented files**: ${totalFiles}`,
      '',
      '## Quick Navigation',
      ''
    ];

    const sortedDirs = Object.keys(entries).sort();
    
    for (const dirPath of sortedDirs) {
      const files = entries[dirPath].sort((a, b) => a.fileName.localeCompare(b.fileName));
      
      if (dirPath === 'Root') {
        indexContent.push('### Root Directory');
      } else {
        indexContent.push(`### ${dirPath}/`);
      }
      indexContent.push('');
      
      for (const fileInfo of files) {
        indexContent.push(fileInfo.entry);
      }
      indexContent.push('');
    }

    indexContent.push(
      '---',
      '',
      '📝 *This documentation was generated automatically using AI-powered analysis of the source code.*',
      '',
      `🔄 *Last updated: ${new Date().toLocaleString()}*`
    );

    try {
      await fs.writeFile(indexPath, indexContent.join('\n'), 'utf-8');
      console.log('✅ Documentation index updated: DOCUMENTATION_INDEX.md');
    } catch (error) {
      console.error(`❌ Error updating documentation index: ${error}`);
      throw error;
    }
  }

  async commitAndPush(branchName: string = 'docs-generation', repoConfig?: { url: string; token?: string }): Promise<void> {
    console.log(`📤 Committing and pushing documentation...`);
    
    try {
      // Check if docs directory exists
      const docsPath = path.join(this.repoPath, 'docs');
      const indexPath = path.join(this.repoPath, 'DOCUMENTATION_INDEX.md');
      
      let hasFiles = false;
      
      // Add documentation files if they exist
      if (await fs.pathExists(docsPath)) {
        await this.git.add('docs/');
        hasFiles = true;
      }
      
      if (await fs.pathExists(indexPath)) {
        await this.git.add('DOCUMENTATION_INDEX.md');
        hasFiles = true;
      }
      
      if (!hasFiles) {
        console.log('ℹ️ No documentation files to commit');
        return;
      }
      
      // Check if there are changes to commit
      const status = await this.git.status();
      if (status.files.length === 0) {
        console.log('ℹ️ No changes to commit');
        return;
      }

      // Configure git user if not set (required for commits)
      try {
        await this.git.raw(['config', 'user.email', 'noreply@ai-docs.com']);
        await this.git.raw(['config', 'user.name', 'AI Documentation Generator']);
      } catch {
        console.warn('Warning: Could not configure git user, using existing configuration');
      }

      // Commit changes
      const commitMessage = `📝 Generate documentation using AI

🤖 Generated with AI-powered documentation generator

Co-Authored-By: AI Documentation Generator <noreply@ai-docs.com>`;

      await this.git.commit(commitMessage);
      console.log('✅ Changes committed');

      // Ensure remote is properly configured with token before pushing
      if (repoConfig?.token && repoConfig?.url) {
        const authenticatedUrl = this.addTokenToUrl(repoConfig.url, repoConfig.token);
        try {
          await this.git.removeRemote('origin');
          await this.git.addRemote('origin', authenticatedUrl);
        } catch {
          console.log('Remote configuration already up to date');
        }
      }

      // Try to push, and if it fails due to non-fast-forward, pull and try again
      try {
        await this.git.push('origin', branchName, ['--set-upstream']);
        console.log(`✅ Changes pushed to ${branchName} branch`);
      } catch (pushError) {
        if (pushError instanceof Error && pushError.message.includes('non-fast-forward')) {
          console.log('⚠️ Push rejected due to remote changes, pulling and retrying...');
          
          try {
            // Pull remote changes first
            await this.git.pull('origin', branchName, ['--no-rebase']);
            console.log('✅ Pulled remote changes');
            
            // Try pushing again
            await this.git.push('origin', branchName);
            console.log(`✅ Changes pushed to ${branchName} branch after pulling`);
          } catch (retryError) {
            console.error('❌ Failed to push even after pulling:', retryError);
            
            // If pull fails due to conflicts, try to resolve automatically
            if (retryError instanceof Error && retryError.message.includes('conflict')) {
              console.log('⚠️ Merge conflict detected, attempting automatic resolution...');
              
              try {
                // For documentation files, our version should take precedence
                // Add all files (this stages resolved conflicts)
                await this.git.add('.');
                await this.git.commit('Resolve merge conflicts - documentation update');
                await this.git.push('origin', branchName);
                console.log('✅ Merge conflicts resolved and changes pushed');
              } catch {
                throw new Error(`Failed to resolve merge conflicts automatically. Please manually resolve conflicts in the ${branchName} branch. Original error: ${retryError.message}`);
              }
            } else {
              throw retryError;
            }
          }
        } else {
          throw pushError;
        }
      }
    } catch (error) {
      console.error(`❌ Error committing/pushing changes:`, error);
      
      // Provide detailed error messages for common push issues
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('denied')) {
          throw new Error(`GitHub push failed due to insufficient permissions. Please ensure your token has:
- repo scope for private repositories
- public_repo scope for public repositories
- push access to the repository

Generate a new token with proper permissions at: https://github.com/settings/tokens/new

Error details: ${error.message}`);
        }
        
        if (error.message.includes('401') || error.message.includes('authentication')) {
          throw new Error(`GitHub authentication failed. Your token may be invalid or expired. 
Please generate a new token at: https://github.com/settings/tokens/new

Error details: ${error.message}`);
        }
        
        if (error.message.includes('404')) {
          throw new Error(`Repository not found or you don't have access. Please verify:
- Repository URL is correct
- Repository exists
- Your token has access to this repository

Error details: ${error.message}`);
        }

        if (error.message.includes('non-fast-forward') || error.message.includes('rejected')) {
          throw new Error(`Push was rejected because the remote branch has newer commits. The system should have automatically handled this by pulling and retrying. If you're still seeing this error, there may be complex merge conflicts.

You can:
1. Try generating documentation again (it will pull latest changes first)
2. Manually resolve conflicts in the ${branchName || 'docs-generation'} branch
3. Or delete the remote branch and try again

Error details: ${error.message}`);
        }
      }
      
      throw error;
    }
  }

  getRepoPath(): string {
    return this.repoPath;
  }

  async cleanup(force: boolean = false): Promise<void> {
    try {
      if (this.repoPath && await fs.pathExists(this.repoPath)) {
        console.log(`🧹 Cleaning up temporary repository: ${path.basename(this.repoPath)}`);
        await fs.remove(this.repoPath);
        console.log('✅ Repository cleanup completed');
      }

      // Clean up the entire temp-repos directory if it's empty or if forced
      const tempDir = path.join(process.cwd(), 'temp-repos');
      if (await fs.pathExists(tempDir)) {
        try {
          const items = await fs.readdir(tempDir);
          if (items.length === 0 || force) {
            console.log(`🧹 Cleaning up temp-repos directory...`);
            await fs.remove(tempDir);
            console.log('✅ Temp-repos directory cleaned');
          } else {
            console.log(`ℹ️ Temp-repos directory contains ${items.length} items, keeping directory`);
          }
        } catch (error) {
          console.warn('Warning: Could not clean temp-repos directory:', error);
        }
      }
    } catch (error) {
      console.warn('Warning: Cleanup encountered an issue:', error);
    }
  }

  async forceCleanupAllTempRepos(): Promise<void> {
    try {
      const tempDir = path.join(process.cwd(), 'temp-repos');
      if (await fs.pathExists(tempDir)) {
        console.log(`🧹 Force cleaning entire temp-repos directory...`);
        await fs.remove(tempDir);
        console.log('✅ All temporary repositories cleaned');
      } else {
        console.log('ℹ️ No temp-repos directory to clean');
      }
    } catch (error) {
      console.error('❌ Error during force cleanup:', error);
      throw error;
    }
  }

  async run(repoConfig: RepoConfig): Promise<void> {
    try {
      console.log('🚀 Starting smart GitHub documentation generation...');
      
      // Clone repository
      await this.cloneRepository(repoConfig);
      
      // Smart documentation branch setup
      const branchName = repoConfig.branch || 'docs-generation';
      const branchInfo = await this.createDocumentationBranch(branchName);
      
      // Check if no updates are needed
      if (branchInfo.hasExistingDocs && !branchInfo.needsUpdate) {
        console.log('✅ Repository documentation is already up to date!');
        console.log('📚 No changes detected since last documentation generation');
        console.log(`🌿 Existing documentation is available on the '${branchName}' branch`);
        return;
      }
      
      // Smart file discovery based on changes
      const { sourceFiles, existingDocs, isIncremental } = await this.findSourceFiles(
        repoConfig.targetPath,
        branchInfo.changedFiles,
        branchInfo.newFiles
      );
      
      if (sourceFiles.length === 0) {
        if (branchInfo.hasExistingDocs) {
          console.log('✅ All source files already have up-to-date documentation!');
          if (existingDocs.length > 0) {
            console.log('🔄 Updating documentation index...');
            await this.generateIndex(existingDocs);
            await this.commitAndPush(branchName, repoConfig);
          }
        } else {
          console.log('✅ No supported source files found to document');
        }
        return;
      }

      // Log update type and files
      if (isIncremental) {
        console.log(`🔄 Incremental documentation update mode`);
        console.log(`📝 ${branchInfo.changedFiles.length} changed files, ${branchInfo.newFiles.length} new files to process`);
      } else {
        console.log(`📝 Full documentation generation mode`);
        console.log(`📝 Files to be documented: ${sourceFiles.length}`);
      }
      
      if (existingDocs.length > 0) {
        console.log(`✅ Files with existing documentation: ${existingDocs.length}`);
      }

      if (!this.options.force) {
        const updateType = isIncremental ? 'incremental update' : 'full generation';
        console.log(`🔄 Proceeding with ${updateType}...`);
      }

      // Generate documentation for each file
      const documentedFiles: string[] = [];
      const failedFiles: string[] = [];

      for (let i = 0; i < sourceFiles.length; i++) {
        const filePath = sourceFiles[i];
        const action = branchInfo.changedFiles.includes(filePath) ? 'Updating' : 
                      branchInfo.newFiles.includes(filePath) ? 'Creating' : 'Processing';
        
        console.log(`📄 [${i + 1}/${sourceFiles.length}] ${action}: ${filePath}`);
        
        const doc = await this.generateDocumentation(filePath);
        if (doc) {
          await this.saveDocumentation(filePath, doc);
          documentedFiles.push(filePath);
          console.log(`✅ Documented: ${filePath}`);
        } else {
          failedFiles.push(filePath);
          console.log(`❌ Failed to document: ${filePath}`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Generate/update index
      if (documentedFiles.length > 0) {
        if (isIncremental) {
          // For incremental updates, merge with existing index
          await this.generateIndex(documentedFiles);
        } else {
          // For full generation, create complete index
          await this.generateIndex([...documentedFiles, ...existingDocs]);
        }
      }

      // Commit and push changes
      const commitType = isIncremental ? 'incremental' : 'full';
      await this.commitAndPush(branchName, repoConfig);

      // Summary
      console.log('\n' + '='.repeat(60));
      const updateMode = isIncremental ? 'Incremental documentation update' : 'Full documentation generation';
      console.log(`🎉 ${updateMode} completed!`);
      
      if (isIncremental) {
        console.log(`🔄 Updated: ${branchInfo.changedFiles.length} changed files`);
        console.log(`🆕 Added: ${branchInfo.newFiles.length} new files`);
        console.log(`✅ Successfully processed: ${documentedFiles.length} files`);
      } else {
        console.log(`✅ Successfully documented: ${documentedFiles.length} files`);
      }
      
      console.log(`❌ Failed to document: ${failedFiles.length} files`);
      
      if (failedFiles.length > 0) {
        console.log('\n⚠️ Failed files:');
        failedFiles.slice(0, 5).forEach(file => console.log(`   - ${file}`));
        if (failedFiles.length > 5) {
          console.log(`   ... and ${failedFiles.length - 5} more`);
        }
      }

      console.log(`\n📚 Check DOCUMENTATION_INDEX.md for the complete documentation overview`);
      console.log(`📁 All documentation files are saved in the 'docs/' directory`);
      console.log(`🌿 Documentation is available on the '${branchName}' branch`);
      
      if (isIncremental) {
        console.log(`\n💡 Next time you run this, only new changes will be processed!`);
      }
      
    } catch (error) {
      console.error('❌ Fatal error:', error);
      // On error, do regular cleanup (keep temp dir in case user wants to debug)
      await this.cleanup();
      throw error;
    }
    
    // On successful completion, force cleanup to remove temp-repos directory
    console.log('🎉 Documentation generation completed successfully!');
    await this.cleanup(true); // Force cleanup on success
  }
}