import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | AI Documentation Generator',
  description: 'Get in touch with the AI Documentation Generator team for support, feature requests, or general inquiries.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">Contact Us</h1>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              Have questions, feedback, or need support? Reach out to us through any of the following channels:
            </p>
            
            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">GitHub Issues</h3>
                <p className="text-slate-700 dark:text-slate-300 mb-3">
                  For bug reports, feature requests, and technical support, please open an issue on our GitHub repository.
                </p>
                <a 
                  href="https://github.com/vaibhava17/docs-generator/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Open an Issue on GitHub
                </a>
              </div>
              
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">GitHub Discussions</h3>
                <p className="text-slate-700 dark:text-slate-300 mb-3">
                  Join the community discussion or ask questions:
                </p>
                <a 
                  href="https://github.com/vaibhava17/docs-generator/discussions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  GitHub Discussions
                </a>
              </div>
              
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Follow Development</h3>
                <p className="text-slate-700 dark:text-slate-300 mb-3">
                  Stay updated with the latest developments and connect with the creator:
                </p>
                <a 
                  href="https://github.com/vaibhava17" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Follow @vaibhava17 on GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}