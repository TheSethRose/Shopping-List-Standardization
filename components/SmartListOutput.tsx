
import React, { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';
import { MatchResult } from '../types';

interface SmartListOutputProps {
  results: MatchResult[];
}

const SmartListOutput: React.FC<SmartListOutputProps> = ({ results }) => {
  const [copied, setCopied] = useState(false);
  
  // Format the smart matches as a newline-delimited list. 
  // If no match found, we skip it or keep the original term (let's keep the original for continuity)
  const smartListText = results
    .map(r => r.exact_name !== 'No Match' ? r.exact_name : r.term)
    .join('\n');

  const copyToClipboard = () => {
    if (!smartListText) return;
    navigator.clipboard.writeText(smartListText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
      <div className="px-6 py-4 bg-zinc-800/50 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-zinc-400" />
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Updated Smart List</h3>
        </div>
        <button
          onClick={copyToClipboard}
          disabled={results.length === 0}
          className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all
            ${copied ? 'bg-white text-black' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'}
          `}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied List</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Standardized List</span>
            </>
          )}
        </button>
      </div>
      <div className="p-6 bg-zinc-950 shadow-inner max-h-[400px] overflow-auto custom-scrollbar">
        {results.length > 0 ? (
          <pre className="text-xs font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap">
            {smartListText}
          </pre>
        ) : (
          <div className="py-12 text-center">
            <p className="text-xs text-zinc-700 font-bold uppercase tracking-widest">No matched items generated yet</p>
          </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #09090b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #18181b;
          border-radius: 4px;
          border: 1px solid #27272a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #27272a;
        }
      `}</style>
    </div>
  );
};

export default SmartListOutput;
