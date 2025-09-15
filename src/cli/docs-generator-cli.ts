#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import { GitHubDocsGenerator, RepoConfig, AIConfig, DocumentationOptions } from '../lib/github-docs-generator';
import dotenv from 'dotenv';

dotenv.config();

const program = new Command();

interface CLIOptions {
  token?: string;
  path?: string;
  branch?: string;
  provider: 'openai' | 'gemini';
  apiKey?: string;
  overwrite?: boolean;
  force?: boolean;
  listFiles?: boolean;
}

program
  .name('docs-generator')
  .description('AI-powered documentation generator for GitHub repositories')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate documentation for a GitHub repository')
  .argument('<repo-url>', 'GitHub repository URL (https://github.com/owner/repo)')
  .option('-t, --token <token>', 'GitHub Personal Access Token for private repos')
  .option('-p, --path <path>', 'Target directory path to document (default: entire repo)')
  .option('-b, --branch <branch>', 'Branch name for documentation (default: docs-generation)')
  .option('--provider <provider>', 'AI provider: openai or gemini', 'openai')
  .option('--api-key <key>', 'AI API key (or set OPENAI_API_KEY/GEMINI_API_KEY env var)')
  .option('--overwrite', 'Overwrite existing documentation files')
  .option('-f, --force', 'Skip confirmation prompts')
  .option('-l, --list-files', 'List files that would be documented without generating docs')
  .action(async (repoUrl: string, options: CLIOptions) => {
    try {
      await handleGenerate(repoUrl, options);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('setup')
  .description('Set up environment variables for API keys')
  .action(setupEnvironment);

async function handleGenerate(repoUrl: string, options: CLIOptions): Promise<void> {
  console.log('🚀 GitHub Documentation Generator');
  console.log('================================');
  
  // Validate repository URL
  if (!isValidGitHubUrl(repoUrl)) {
    throw new Error('Invalid GitHub repository URL. Use format: https://github.com/owner/repo');
  }

  // Get AI API key
  const apiKey = getAPIKey(options.provider, options.apiKey);
  if (!apiKey) {
    throw new Error(`${options.provider.toUpperCase()} API key not found. Use --api-key option or set ${options.provider.toUpperCase()}_API_KEY environment variable`);
  }

  // Create AI config
  const aiConfig: AIConfig = {
    provider: options.provider,
    apiKey
  };

  // Create repo config
  const repoConfig: RepoConfig = {
    url: repoUrl,
    token: options.token,
    targetPath: options.path,
    branch: options.branch
  };

  // Create documentation options
  const docOptions: DocumentationOptions = {
    overwrite: options.overwrite,
    force: options.force
  };

  // Create generator instance
  const generator = new GitHubDocsGenerator(aiConfig, docOptions);

  if (options.listFiles) {
    await handleListFiles(generator, repoConfig);
    return;
  }

  // Run documentation generation
  await generator.run(repoConfig);
}

async function handleListFiles(generator: GitHubDocsGenerator, repoConfig: RepoConfig): Promise<void> {
  console.log('📋 Listing files that would be documented...\n');
  
  try {
    // Clone repository temporarily
    await generator.cloneRepository(repoConfig);
    
    // Find source files
    const { sourceFiles, existingDocs } = await generator.findSourceFiles(repoConfig.targetPath);
    const totalFiles = sourceFiles.length + existingDocs.length;
    
    if (totalFiles > 0) {
      console.log(`📊 Source files found in repository:`);
      console.log(`Total: ${totalFiles} files\n`);
      
      if (sourceFiles.length > 0) {
        console.log(`📝 Files needing documentation (${sourceFiles.length}):`);
        sourceFiles.forEach((file, index) => {
          console.log(`   ${(index + 1).toString().padStart(3)}. ${file}`);
        });
        console.log('');
      }
      
      if (existingDocs.length > 0) {
        console.log(`✅ Files with existing documentation (${existingDocs.length}):`);
        existingDocs.forEach((file, index) => {
          console.log(`   ${(index + 1).toString().padStart(3)}. ${file}`);
        });
        console.log('');
      }
      
      console.log(`💡 Run without --list-files to generate documentation for ${sourceFiles.length} files`);
    } else {
      console.log('⚠️ No source files found in the specified path');
    }
  } finally {
    // Cleanup
    await generator.cleanup();
  }
}

function isValidGitHubUrl(url: string): boolean {
  const githubUrlPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+(?:\.git)?$/;
  return githubUrlPattern.test(url);
}

function getAPIKey(provider: 'openai' | 'gemini', providedKey?: string): string | undefined {
  if (providedKey) return providedKey;
  
  const envKey = provider === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY';
  return process.env[envKey];
}

async function setupEnvironment(): Promise<void> {
  console.log('🔧 Environment Setup');
  console.log('====================\n');
  
  const envPath = path.join(process.cwd(), '.env');
  // Read existing .env file if it exists
  if (await fs.pathExists(envPath)) {
    await fs.readFile(envPath, 'utf-8');
    console.log('📄 Found existing .env file');
  } else {
    console.log('📄 Creating new .env file');
  }

  console.log('\n📝 Add your API keys to the .env file:');
  console.log('');
  console.log('For OpenAI (GPT):');
  console.log('  OPENAI_API_KEY=your_openai_api_key_here');
  console.log('  Get your key at: https://platform.openai.com/api-keys');
  console.log('');
  console.log('For Google Gemini:');
  console.log('  GEMINI_API_KEY=your_gemini_api_key_here');
  console.log('  Get your key at: https://makersuite.google.com/app/apikey');
  console.log('');
  console.log('Optional - Set preferred AI provider:');
  console.log('  PREFERRED_AI=openai  # or gemini');
  console.log('');

  // Create basic .env template if it doesn't exist
  if (!await fs.pathExists(envPath)) {
    const templateContent = `# AI API Keys
# Get OpenAI key at: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Get Gemini key at: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Preferred AI provider (openai or gemini)
PREFERRED_AI=openai
`;
    
    await fs.writeFile(envPath, templateContent);
    console.log('✅ Created .env template file');
    console.log('📝 Please edit .env file and add your actual API keys');
  } else {
    console.log('📝 Please update your existing .env file with the API keys');
  }
  
  console.log('\n🔐 Security Note:');
  console.log('- Never commit your .env file to version control');
  console.log('- Add .env to your .gitignore file');
  console.log('- Keep your API keys secure and private');
}

// Add error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

program.parse();