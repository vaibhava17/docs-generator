import DocsGeneratorInterface from "@/components/DocsGeneratorInterface";
import SEOStructuredData from "@/components/SEOStructuredData";

export default function Home() {
  return (
    <>
      <SEOStructuredData />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              🤖 AI Documentation Generator
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Automatically generate comprehensive documentation for any GitHub
              repository using AI. Just provide a repository URL and let AI create
              detailed docs for your codebase.
            </p>
          </div>

          <DocsGeneratorInterface />
        </div>
      </div>
    </>
  );
}
