
import React, { useState, useMemo, useCallback } from 'react';
import { ShoppingBag, FileUp, ListChecks, Download, Database, Loader2, ExternalLink, Chrome, Play } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { analyzeShoppingList } from './services/aiService';
import { PurchaseRecord, ProductFrequency, MatchResult } from './types';
import FileUpload from './components/FileUpload';
import ShoppingListInput from './components/ShoppingListInput';
import ResultsTable from './components/ResultsTable';
import SmartListOutput from './components/SmartListOutput';

const App: React.FC = () => {
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);
  const [shoppingListText, setShoppingListText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isAnalyzed, setIsAnalyzed] = useState<boolean>(false);
  
  const [expandedKeywordsMap, setExpandedKeywordsMap] = useState<Record<string, string[]>>({});
  const [selectedOverrides, setSelectedOverrides] = useState<Record<string, ProductFrequency>>({});

  const normalize = (str: string) => {
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const getRootToken = (token: string) => {
    if (token.length <= 3) return token;
    if (token.endsWith('ies')) return token.slice(0, -3) + 'y';
    if (token.endsWith('es')) return token.slice(0, -2);
    if (token.endsWith('s')) return token.slice(0, -1);
    return token;
  };

  const cleanSearchTerm = (str: string) => {
    return str.replace(/^[\s\-*•\d.]+/g, '').trim();
  };

  const handleShoppingListChange = (val: string) => {
    let processed = val;
    if (val.includes(',') && !val.includes('\n')) {
      processed = val.split(',').map(item => item.trim()).filter(Boolean).join('\n');
    }
    setShoppingListText(processed);
    // Crucial: Reset analysis when text changes to gate results again
    if (isAnalyzed) setIsAnalyzed(false);
  };

  const handleAnalyze = async () => {
    // Validation Gate
    if (purchaseHistory.length === 0) {
      alert("Missing Data: Please upload your Walmart Purchase History file (CSV or XLSX) first.");
      return;
    }
    if (!shoppingListText.trim()) {
      alert("Missing List: Please enter at least one item in your shopping list.");
      return;
    }

    setIsAnalyzing(true);
    setIsAnalyzed(false);

    try {
      const { cleanedText, expansions } = await analyzeShoppingList(shoppingListText);
      setShoppingListText(cleanedText);
      setExpandedKeywordsMap(expansions);
      setIsAnalyzed(true);
    } catch (error) {
      console.error('Analysis Error:', error);
      alert('Analysis failed. This might be due to a network issue or an invalid API key.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processParsedData = useCallback((data: Record<string, unknown>[]) => {
    const parsed: PurchaseRecord[] = data.map((row) => ({
      orderNumber: String(row['Order Number'] ?? row['orderNumber'] ?? ''),
      orderDate: String(row['Order Date'] ?? row['orderDate'] ?? ''),
      productName: String(row['Product Name'] ?? row['productName'] ?? ''),
      quantity: parseInt(String(row['Quantity'] ?? row['quantity'] ?? '0'), 10),
      price: String(row['Price'] ?? row['price'] ?? ''),
      deliveryStatus: String(row['Delivery Status'] ?? row['deliveryStatus'] ?? ''),
      productLink: String(row['Product Link'] ?? row['productLink'] ?? ''),
    })).filter(item => item.productName);
    setPurchaseHistory(parsed);
    setIsProcessing(false);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processParsedData(results.data),
        error: () => setIsProcessing(false)
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setIsProcessing(false);
          return;
        }
        const sheet = workbook.Sheets[firstSheetName];
        if (!sheet) {
          setIsProcessing(false);
          return;
        }
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
        processParsedData(jsonData);
      };
      reader.readAsArrayBuffer(file);
    }
  }, [processParsedData]);

  const frequencyMap = useMemo(() => {
    const map = new Map<string, { count: number; link: string }>();
    purchaseHistory.forEach((record) => {
      const name = record.productName.trim();
      if (!name) return;
      const existing = map.get(name);
      if (existing) {
        map.set(name, { count: existing.count + 1, link: existing.link });
      } else {
        map.set(name, { count: 1, link: record.productLink });
      }
    });
    return map;
  }, [purchaseHistory]);

  const handleOverrideSelect = (term: string, match: ProductFrequency) => {
    setSelectedOverrides(prev => ({ ...prev, [term]: match }));
  };

  const results = useMemo((): MatchResult[] => {
    // STRICT GATE: No results until Analyze button clicked and successful
    if (!isAnalyzed || shoppingListText.trim() === '') return [];

    const rawTerms = shoppingListText
      .split('\n')
      .map((term) => term.trim())
      .filter((term) => term !== '');

    return rawTerms.map((rawTerm): MatchResult => {
      const term = cleanSearchTerm(rawTerm);
      if (!term) return { term: rawTerm, exact_name: 'No Match', url: '', count: 0, all_matches: [] };

      const normTerm = normalize(term);
      const searchTokens = normTerm.split(' ').map(getRootToken).filter(t => t.length >= 3);
      const aiExpansions = expandedKeywordsMap[rawTerm] || [];
      const normalizedExpansions = aiExpansions.map(normalize);

      const potentialMatchesMap = new Map<string, (ProductFrequency & { score: number })>();

      frequencyMap.forEach((data, productName) => {
        const normProduct = normalize(productName);
        let score = 0;

        // Level 1: Original term exact/strong match
        if (normProduct.includes(normTerm)) {
          score += 1000;
        }

        // Level 2: AI Expansion strict alignment
        normalizedExpansions.forEach(exp => {
          if (normProduct.includes(exp)) {
            score += 600; 
          }
        });

        // Level 3: Token matching - VERY RESTRICTIVE
        let matchedTokenCount = 0;
        searchTokens.forEach(st => {
          if (normProduct.includes(st)) {
            matchedTokenCount++;
          }
        });

        // Only count tokens if at least 2 tokens match or if the search is very short and matches exactly
        const firstToken = searchTokens[0];
        if (matchedTokenCount >= 2 || (searchTokens.length === 1 && matchedTokenCount === 1 && firstToken && normProduct.includes(firstToken))) {
          score += matchedTokenCount * 50;
        }

        // MINIMUM SCORE GATE: 
        // Prevents junk matching like "gas" fragment matching "bubbles"
        if (score < 150) return;

        if (score > 0) {
          const existing = potentialMatchesMap.get(productName);
          if (!existing || score > existing.score) {
            potentialMatchesMap.set(productName, {
              productName,
              count: data.count,
              productLink: data.link,
              score
            });
          }
        }
      });

      const potentialMatches = Array.from(potentialMatchesMap.values());

      if (potentialMatches.length === 0) {
        return { term, exact_name: 'No Match', url: '', count: 0, all_matches: [] };
      }

      potentialMatches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.count - a.count;
      });
      
      const matches: ProductFrequency[] = potentialMatches.map(({ score: _score, ...rest }) => rest);
      const override = selectedOverrides[term];
      const firstMatch = matches[0];
      if (!firstMatch) {
        return { term, exact_name: 'No Match', url: '', count: 0, all_matches: [] };
      }
      const winner = (override && matches.some(m => m.productName === override.productName)) 
        ? override 
        : firstMatch;

      return {
        term,
        exact_name: winner.productName,
        url: winner.productLink,
        count: winner.count,
        all_matches: matches
      };
    });
  }, [isAnalyzed, shoppingListText, frequencyMap, selectedOverrides, expandedKeywordsMap]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-zinc-700">
      <header className="bg-[#0e0e11] backdrop-blur-md border-b border-zinc-800 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg shadow-inner">
              <ShoppingBag className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none">SmartCart Standardizer</h1>
              <p className="text-[10px] text-zinc-500 mt-1 font-medium uppercase tracking-widest">Semantic Intent Mapper</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
               <span className="text-sm font-semibold text-white">{purchaseHistory.length}</span>
               <span className="text-[10px] uppercase tracking-wider text-zinc-500">History items</span>
            </div>
            <Database className="w-5 h-5 text-zinc-600" />
          </div>
        </div>
      </header>

      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-2.5 text-[11px] font-medium text-zinc-400">
          <Chrome className="w-3.5 h-3.5 text-zinc-500" />
          <span>Get history data with the</span>
          <a 
            href="https://chromewebstore.google.com/detail/walmart-invoice-exporter/bndkihecbbkoligeekekdgommmdllfpe?hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-200 hover:text-white underline decoration-zinc-700 hover:decoration-zinc-400 underline-offset-4 flex items-center gap-1 transition-all"
          >
            Walmart Invoice Exporter
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <section className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 p-6">
              <div className="flex items-center gap-2 mb-4 text-zinc-200">
                <FileUp className="w-5 h-5" />
                <h2 className="font-semibold text-sm uppercase tracking-wider">1. Shopping History</h2>
              </div>
              <FileUpload onFileSelect={handleFileUpload} isProcessing={isProcessing} />
            </section>

            <section className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-zinc-200">
                  <ListChecks className="w-5 h-5" />
                  <h2 className="font-semibold text-sm uppercase tracking-wider">2. Shopping List</h2>
                </div>
              </div>
              <ShoppingListInput value={shoppingListText} onChange={handleShoppingListChange} />
              
              <div className="mt-6">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-xl border
                    ${isAnalyzing 
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed' 
                      : 'bg-white border-white text-black hover:bg-zinc-200 hover:scale-[1.01] active:scale-[0.99]'}
                  `}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Performing Semantic Analysis...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Analyze Shopping List
                    </>
                  )}
                </button>
                {!isAnalyzed && !isAnalyzing && shoppingListText.trim() !== '' && (
                  <p className="text-[10px] text-zinc-500 mt-2 text-center uppercase tracking-widest font-bold">
                    Click Analyze to find matches from your history
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-7">
            <section className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-zinc-200">
                  <Download className="w-5 h-5" />
                  <h2 className="font-semibold text-sm uppercase tracking-wider">3. Analysis & Smart Matches</h2>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <ResultsTable results={results} isAnalyzed={isAnalyzed} onSelectOverride={handleOverrideSelect} />
              </div>
            </section>
          </div>
        </div>

        <section className="mt-8">
          <SmartListOutput results={results} />
        </section>
      </main>

      <footer className="bg-zinc-950 text-zinc-600 py-8 text-center border-t border-zinc-900 mt-auto">
        <p className="text-xs uppercase tracking-widest font-bold">SmartCart Standardizer &copy; {new Date().getFullYear()}</p>
        <p className="text-[10px] mt-2 opacity-50 font-medium">Privacy Focused • Local Analysis</p>
      </footer>
    </div>
  );
};

export default App;
