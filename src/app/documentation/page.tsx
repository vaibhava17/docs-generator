import { Metadata } from 'next';
import CodeBlock from '@/components/CodeBlock';

export const metadata: Metadata = {
  title: 'Documentation | AI Documentation Generator',
  description: 'Complete documentation for the AI Documentation Generator tool, including installation instructions, usage examples, and API reference.',
};

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">Documentation</h1>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-4">Table of Contents</h2>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-8 space-y-2">
              <li><a href="#installation" className="text-blue-600 hover:underline">Installation</a></li>
              <li><a href="#quick-start" className="text-blue-600 hover:underline">Quick Start</a></li>
              <li><a href="#cli-commands" className="text-blue-600 hover:underline">CLI Commands</a></li>
              <li><a href="#configuration" className="text-blue-600 hover:underline">Configuration</a></li>
              <li><a href="#api-reference" className="text-blue-600 hover:underline">API Reference</a></li>
              <li><a href="#troubleshooting" className="text-blue-600 hover:underline">Troubleshooting</a></li>
            </ul>
            
            <h2 id="installation" className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-8 mb-4">Installation</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              Clone the repository from{' '}
              <a 
                href="https://github.com/vaibhava17/docs-generator" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub
              </a>
              {' '}and install dependencies:
            </p>
            <CodeBlock 
              code={`git clone https://github.com/vaibhava17/docs-generator.git
cd docs-generator
npm install`}
              language="bash"
            />
            
            <h2 id="quick-start" className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-8 mb-4">Quick Start</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              After installation, set up your environment variables and generate documentation for any GitHub repository:
            </p>
            <CodeBlock 
              code={`npm run docs:setup
npm run docs:generate https://github.com/vaibhava17/your-repo`}
              language="bash"
            />
            
            <h2 id="cli-commands" className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-8 mb-4">CLI Commands</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              The tool provides several CLI commands for different operations:
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Generate Documentation</h4>
                <CodeBlock 
                  code="npm run docs:generate https://github.com/username/repository"
                  language="bash"
                />
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Generate documentation for any GitHub repository</p>
              </div>
              
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Setup Environment</h4>
                <CodeBlock 
                  code="npm run docs:setup"
                  language="bash"
                />
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Interactive setup for environment variables</p>
              </div>
              
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Build CLI Tool</h4>
                <CodeBlock 
                  code="npm run build:cli"
                  language="bash"
                />
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Build the standalone CLI executable</p>
              </div>
            </div>
            
            <h2 id="configuration" className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-8 mb-4">Configuration</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              Configure the tool using environment variables in your <code>.env</code> file:
            </p>
            <CodeBlock 
              code={`# Site Configuration
NEXT_PUBLIC_SITE_URL=https://docs-generator-phi.vercel.app

# AI API Keys (Choose one or both)
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Preferred AI Provider (openai or gemini)
PREFERRED_AI=openai

# GitHub Token (for private repositories)
GITHUB_TOKEN=your_github_token_here`}
              language="bash"
              filename=".env"
            />
            <div className="mt-4 mb-8">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Environment Variables:</h3>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 space-y-2">
                <li><code>OPENAI_API_KEY</code> - Your OpenAI API key</li>
                <li><code>GEMINI_API_KEY</code> - Your Google Gemini API key</li>
                <li><code>PREFERRED_AI</code> - Preferred AI provider (openai or gemini)</li>
                <li><code>GITHUB_TOKEN</code> - GitHub personal access token for private repositories</li>
              </ul>
            </div>
            
            <h2 id="api-reference" className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-8 mb-4">API Reference</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              The tool provides a programmatic API for integration with other applications. Refer to the source code for detailed API documentation.
            </p>
            
            <h2 id="troubleshooting" className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-8 mb-4">Troubleshooting</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              Common issues and their solutions:
            </p>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-8 space-y-2">
              <li><strong>API key not found:</strong> Ensure your environment variables are properly configured</li>
              <li><strong>Permission denied:</strong> Check your GitHub token permissions</li>
              <li><strong>No source files found:</strong> Verify the repository contains supported file types</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}