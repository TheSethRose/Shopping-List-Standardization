
import React from 'react';
import { ExternalLink, Search, AlertCircle, ChevronDown, Sparkles } from 'lucide-react';
import { MatchResult, ProductFrequency } from '../types';

interface ResultsTableProps {
  results: MatchResult[];
  isAnalyzed: boolean;
  onSelectOverride: (term: string, match: ProductFrequency) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, isAnalyzed, onSelectOverride }) => {
  const getSafeUrl = (result: MatchResult) => {
    const hasMatch = result.exact_name !== 'No Match';
    const query = hasMatch ? result.exact_name : result.term;
    return `https://www.walmart.com/search?q=${encodeURIComponent(query)}`;
  };

  if (!isAnalyzed) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 border border-zinc-800 rounded-xl bg-zinc-950/30">
        <div className="bg-zinc-800 p-4 rounded-full mb-4 ring-1 ring-zinc-700">
          <Sparkles className="w-10 h-10 text-zinc-400" />
        </div>
        <h3 className="text-zinc-300 font-semibold mb-1 uppercase tracking-tight">Ready to Analyze</h3>
        <p className="text-[11px] text-zinc-500 max-w-sm font-medium uppercase tracking-widest leading-loose">
          Upload your history and enter a list, then click "Analyze" to find semantic matches from your history.
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 border border-zinc-800 rounded-xl bg-zinc-950/30">
        <div className="bg-zinc-800 p-4 rounded-full mb-4 ring-1 ring-zinc-700">
          <Search className="w-10 h-10 text-zinc-600" />
        </div>
        <h3 className="text-zinc-300 font-semibold mb-1 uppercase tracking-tight">No results found</h3>
        <p className="text-[11px] text-zinc-500 max-w-sm font-medium uppercase tracking-widest leading-loose">
          Try expanding your history file or sanitizing your shopping list.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 shadow-inner h-full flex flex-col">
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse table-fixed">
          <thead className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
            <tr className="uppercase tracking-widest font-bold text-zinc-500">
              <th className="px-5 py-4 text-[10px] w-1/4">Search Term</th>
              <th className="px-5 py-4 text-[10px] w-2/5">Smart Match</th>
              <th className="px-5 py-4 text-center text-[10px] w-20">Freq</th>
              <th className="px-5 py-4 text-right text-[10px] w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {results.map((result, idx) => {
              const hasMatch = result.exact_name !== 'No Match';
              const walmartUrl = getSafeUrl(result);
              
              return (
                <tr key={idx} className="hover:bg-zinc-900/50 transition-colors group">
                  <td className="px-5 py-4 font-semibold text-zinc-300">
                    <div className="break-words" title={result.term}>
                      {result.term}
                    </div>
                  </td>
                  <td className="px-5 py-4 relative">
                    {hasMatch ? (
                      <div className="relative group/select">
                        <select
                          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 py-1.5 pl-3 pr-8 rounded-lg appearance-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 outline-none text-[11px] cursor-pointer hover:bg-zinc-800 transition-colors break-words leading-relaxed"
                          value={result.exact_name}
                          onChange={(e) => {
                            const selected = result.all_matches.find(m => m.productName === e.target.value);
                            if (selected) onSelectOverride(result.term, selected);
                          }}
                        >
                          {result.all_matches.map((m, mIdx) => (
                            <option key={mIdx} value={m.productName}>
                              {m.productName} ({m.count}x)
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover/select:text-zinc-300" />
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-zinc-600 font-bold uppercase tracking-tighter ml-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        No Match
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {hasMatch ? (
                      <span className="bg-zinc-800 text-white font-mono text-[10px] px-2 py-0.5 rounded ring-1 ring-zinc-700 whitespace-nowrap">
                        {result.count}x
                      </span>
                    ) : (
                      <span className="text-zinc-800">-</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <a
                      href={walmartUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-widest transition-colors text-[10px] whitespace-nowrap ${
                        hasMatch 
                          ? 'text-zinc-400 hover:text-white' 
                          : 'text-zinc-600 hover:text-zinc-300'
                      }`}
                    >
                      {hasMatch ? 'Visit' : 'Search'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
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
        select option {
          background: #18181b;
          color: #d4d4d8;
          padding: 8px;
        }
      `}</style>
    </div>
  );
};

export default ResultsTable;
