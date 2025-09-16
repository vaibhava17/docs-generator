import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | AI Documentation Generator',
  description: 'Learn about the AI Documentation Generator, an open-source tool that automatically creates comprehensive documentation for GitHub repositories using AI.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">About AI Documentation Generator</h1>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              The AI Documentation Generator is an open-source tool designed to automatically create comprehensive documentation for GitHub repositories using cutting-edge AI technologies.
            </p>
            
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-8 mb-4">Our Mission</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              Our mission is to reduce the burden of documentation creation on developers by leveraging AI to automatically generate high-quality, comprehensive documentation that saves time and improves code maintainability.
            </p>
            
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-8 mb-4">How It Works</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              The tool integrates with GitHub repositories and uses either OpenAI GPT or Google Gemini to analyze source code files and generate detailed documentation in Markdown format. The documentation includes explanations of functions, classes, modules, and usage examples.
            </p>
            
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-8 mb-4">Supported Languages</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              We support documentation generation for a wide variety of programming languages including JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP, Ruby, C#, Swift, Kotlin, Scala, Vue, and Svelte.
            </p>
            
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-8 mb-4">Open Source</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              This project is completely open-source and available on{' '}
              <a 
                href="https://github.com/vaibhava17/docs-generator" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub
              </a>
              . We welcome contributions from the developer community to improve the tool and expand its capabilities.
            </p>
            
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-8 mb-4">Created by</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              This project is developed and maintained by{' '}
              <a 
                href="https://github.com/vaibhava17" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                vaibhava17
              </a>
              , focused on making documentation creation effortless for developers worldwide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}