'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  filename?: string;
}

export default function CodeBlock({ 
  code, 
  language = 'bash', 
  showLineNumbers = false, 
  filename 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const lines = code.split('\n');

  return (
    <div className="relative group">
      {filename && (
        <div className="flex items-center justify-between bg-slate-700 dark:bg-slate-900 text-slate-300 px-4 py-2 text-sm font-mono rounded-t-lg border border-slate-600 dark:border-slate-700">
          <span>{filename}</span>
        </div>
      )}
      
      <div className={`relative bg-slate-800 dark:bg-slate-950 border border-slate-600 dark:border-slate-700 ${filename ? 'rounded-b-lg' : 'rounded-lg'} overflow-hidden`}>
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 z-10 p-2 rounded-md bg-slate-700 hover:bg-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-300 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        <div className="overflow-x-auto scrollbar-thin scrollbar-track-slate-700 scrollbar-thumb-slate-500">
          <pre className="p-4 text-sm leading-relaxed min-w-0">
            <code className={`block text-slate-100 font-mono whitespace-pre ${language ? `language-${language}` : ''}`}>
              {showLineNumbers ? (
                <table className="w-full border-collapse">
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={index}>
                        <td className="text-slate-500 text-right pr-4 select-none min-w-[2.5rem] align-top border-r border-slate-600">
                          {index + 1}
                        </td>
                        <td className="text-slate-100 align-top pl-4">
                          <span className="break-all">{line || '\u00A0'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <span className="break-all">{code}</span>
              )}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}