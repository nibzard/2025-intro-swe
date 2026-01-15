import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  MessageSquare,
  Code,
  Play,
  Download,
  Eye,
  EyeOff,
  Plus,
  X,
  ChevronDown,
  Zap,
  Shield,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Brain,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import type { WatcherConfig, Intent, BrandMention } from '../types.ts';
import { GEMINI_MODELS } from '../types.ts';
import yaml from 'js-yaml';

// API base URL: use environment variable or default based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000');

const FormattedAnswer = ({ text, mentions = [] }: { text: string; mentions?: BrandMention[] }) => {
  if (!text) return null;

  const uniqueBrands = Array.from(new Set(mentions.map(m => m.brand)));
  const sortedBrands = uniqueBrands.sort((a, b) => b.length - a.length);
  const brandPattern = sortedBrands.length > 0
    ? new RegExp(`(${sortedBrands.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
    : null;

  const brandMap = new Map<string, boolean>();
  mentions.forEach(m => brandMap.set(m.brand.toLowerCase(), m.is_mine));

  const highlightText = (content: string) => {
    if (!brandPattern || !content) return content;

    return content.split(brandPattern).map((part, i) => {
      const lower = part.toLowerCase();
      if (brandMap.has(lower)) {
        const isMine = brandMap.get(lower);
        return (
          <span key={i} className={isMine ? "text-emerald-300 font-medium" : "text-rose-300 font-medium"}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const processText = (str: string | JSX.Element): any => {
    if (typeof str !== 'string') return str;

    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        return (
          <strong key={i} className="text-primary-300 font-bold">
            {highlightText(content)}
          </strong>
        );
      }
      return highlightText(part);
    });
  };

  const sections = text.split(/\n\n+/);

  return (
    <div className="space-y-4">
      {sections.map((section, sIdx) => {
        if (section.startsWith('### ')) {
          return (
            <h4 key={sIdx} className="text-lg font-bold text-navy-100 mt-6 mb-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-gradient-to-r from-primary-500/50 to-transparent"></span>
              <span className="text-primary-200">{processText(section.slice(4))}</span>
              <span className="h-px flex-1 bg-gradient-to-l from-primary-500/50 to-transparent"></span>
            </h4>
          );
        }

        const lines = section.split('\n').filter(l => l.trim());
        const isList = lines.every(line => /^\s*([-*•]|\d+\.)/.test(line.trim()));

        if (isList && lines.length > 0) {
          return (
            <ul key={sIdx} className="space-y-2 ml-1">
              {lines.map((line, lIdx) => {
                const match = line.match(/^\s*([-*•]|\d+\.)\s*(.*)/);
                if (match) {
                  return (
                    <li key={lIdx} className="flex gap-3 text-sm text-navy-300">
                      <span className="text-primary-400 font-bold min-w-[12px] flex justify-center">{match[1].length > 1 ? match[1] : '•'}</span>
                      <span className="flex-1">{processText(match[2])}</span>
                    </li>
                  );
                }
                return <p key={lIdx} className="text-sm text-navy-300 ml-6">{processText(line)}</p>;
              })}
            </ul>
          );
        }

        return (
          <p key={sIdx} className="text-sm text-navy-300 leading-relaxed whitespace-pre-wrap">
            {processText(section)}
          </p>
        );
      })}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<'config' | 'results'>('config');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(GEMINI_MODELS[0].id);
  const [enableWebSearch, setEnableWebSearch] = useState(true);
  const [myBrands, setMyBrands] = useState<string[]>(['']);
  const [competitors, setCompetitors] = useState<string[]>(['']);
  const [intents, setIntents] = useState<Intent[]>([{ id: '', prompt: '' }]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showYamlPreview, setShowYamlPreview] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);


  // Generate YAML config
  const generateConfig = useCallback((): WatcherConfig => {
    const config: WatcherConfig = {
      run_settings: {
        output_dir: './output',
        sqlite_db_path: './output/watcher.db',
        max_concurrent_requests: 10,
        models: [
          {
            provider: 'google',
            model_name: selectedModel,
            env_api_key: 'GEMINI_API_KEY',
            system_prompt: "You are an unbiased market analyst. Provide factual, balanced recommendations. IMPORTANT: Structure your response using bullet points for lists and short paragraphs. Highlight key entities (brands, products, metrics) in **bold** to make them stand out. Avoid long blocks of text.",
            ...(enableWebSearch && { tools: [{ google_search: {} }] }),
          },
        ],
        use_llm_rank_extraction: false,
      },
      brands: {
        mine: myBrands.filter((b) => b.trim()),
        competitors: competitors.filter((c) => c.trim()),
      },
      intents: intents
        .filter((i) => i.id.trim() && i.prompt.trim())
        .map((i) => ({
          id: i.id.trim().toLowerCase().replace(/\s+/g, '-'),
          prompt: i.prompt.trim(),
        })),
    };
    return config;
  }, [selectedModel, enableWebSearch, myBrands, competitors, intents]);

  const yamlOutput = yaml.dump(generateConfig(), { lineWidth: -1 });

  // Handlers
  const addBrand = (type: 'mine' | 'competitors') => {
    if (type === 'mine') {
      setMyBrands([...myBrands, '']);
    } else {
      setCompetitors([...competitors, '']);
    }
  };

  const removeBrand = (type: 'mine' | 'competitors', index: number) => {
    if (type === 'mine') {
      setMyBrands(myBrands.filter((_, i) => i !== index));
    } else {
      setCompetitors(competitors.filter((_, i) => i !== index));
    }
  };

  const updateBrand = (type: 'mine' | 'competitors', index: number, value: string) => {
    if (type === 'mine') {
      const updated = [...myBrands];
      updated[index] = value;
      setMyBrands(updated);
    } else {
      const updated = [...competitors];
      updated[index] = value;
      setCompetitors(updated);
    }
  };

  const addIntent = () => {
    setIntents([...intents, { id: '', prompt: '' }]);
  };

  const removeIntent = (index: number) => {
    setIntents(intents.filter((_, i) => i !== index));
  };

  const updateIntent = (index: number, field: 'id' | 'prompt', value: string) => {
    const updated = [...intents];
    updated[index] = { ...updated[index], [field]: value };
    setIntents(updated);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(yamlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadYaml = () => {
    const blob = new Blob([yamlOutput], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'watcher.config.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const runSearch = async () => {
    if (!apiKey) {
      alert('Please enter your Gemini API key');
      return;
    }
    setIsRunning(true);
    setResults(null);
    setRunId(null);
    try {
      const response = await fetch(`${API_BASE_URL}/run_watcher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, yaml_config: yamlOutput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to run watcher');
      }

      const runData = await response.json();
      setRunId(runData.run_id);

      const resultsResponse = await fetch(`${API_BASE_URL}/results/${runData.run_id}`);
      if(!resultsResponse.ok) {
        const errorData = await resultsResponse.json();
        throw new Error(errorData.detail || 'Failed to fetch results');
      }

      const resultsData = await resultsResponse.json();
      setResults(resultsData);

      setActiveTab('results');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`An error occurred: ${message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const downloadResultsJSON = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results-${runId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadResultsCSV = () => {
    if (!results || !results.intents_data) return;

    const headers = ['Intent ID', 'Prompt', 'Answer', 'Brand', 'Rank', 'Is Mine'];
    const rows = [headers.join(',')];

    results.intents_data.forEach((intent: any) => {
      if (intent.mentions && intent.mentions.length > 0) {
        intent.mentions.forEach((mention: any) => {
          const row = [
            `"${intent.intent_id}"`,
            `"${intent.prompt.replace(/"/g, '""')}"`,
            `"${intent.answer.replace(/"/g, '""')}"`,
            `"${mention.brand}"`,
            mention.rank || '',
            mention.is_mine ? 'Yes' : 'No'
          ];
          rows.push(row.join(','));
        });
      } else {
        const row = [
            `"${intent.intent_id}"`,
            `"${intent.prompt.replace(/"/g, '""')}"`,
            `"${intent.answer.replace(/"/g, '""')}"`,
            '',
            '',
            ''
        ];
        rows.push(row.join(','));
      }
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results-${runId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadResultsText = () => {
    if (!results || !results.intents_data) return;

    let text = `Search Results for Run: ${runId}\n`;
    text += `Date: ${new Date().toLocaleString()}\n`;
    text += '----------------------------------------\n\n';

    results.intents_data.forEach((intent: any) => {
      text += `Query: ${intent.prompt}\n`;
      text += `ID: ${intent.intent_id}\n`;
      text += `Answer:\n${intent.answer}\n\n`;
      text += 'Mentions:\n';
      if (intent.mentions && intent.mentions.length > 0) {
        intent.mentions.forEach((mention: any) => {
          text += `- ${mention.brand} (Rank: ${mention.rank || 'N/A'}) - ${mention.is_mine ? 'My Brand' : 'Competitor'}\n`;
        });
      } else {
        text += 'No mentions found.\n';
      }
      text += '\n----------------------------------------\n\n';
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results-${runId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isConfigValid =
    apiKey &&
    myBrands.some((b) => b.trim()) &&
    intents.some((i) => i.id.trim() && i.prompt.trim());

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-navy-800/50 bg-navy-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="btn-ghost p-2"
                title="Back to home"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">LLM Answer Watcher</h1>
                  <p className="text-sm text-navy-400">Monitor brand mentions in AI responses</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('config')}
                className={`btn-ghost ${activeTab === 'config' ? 'bg-navy-800 text-white' : ''}`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`btn-ghost ${activeTab === 'results' ? 'bg-navy-800 text-white' : ''}`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Results
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'config' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* API Key Section */}
              <section className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary-400" />
                  <h2 className="section-title">API Configuration</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">Gemini API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="input-field pr-12"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-200"
                      >
                        {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-navy-500 mt-1">
                      Get your key from{' '}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener"
                        className="text-primary-400 hover:text-primary-300"
                      >
                        Google AI Studio
                      </a>
                    </p>
                  </div>

                  <div>
                    <label className="label">Model</label>
                    <div className="relative">
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="input-field appearance-none cursor-pointer"
                      >
                        {GEMINI_MODELS.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400 pointer-events-none" />
                    </div>
                    <p className="text-xs text-navy-500 mt-1">
                      {GEMINI_MODELS.find((m) => m.id === selectedModel)?.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEnableWebSearch(!enableWebSearch)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        enableWebSearch ? 'bg-primary-500' : 'bg-navy-700'
                      }`}
                    >
                      <div
                        className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                          enableWebSearch ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-navy-300">Enable Google Search grounding</span>
                  </div>
                </div>
              </section>

              {/* Brands Section */}
              <section className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-accent-400" />
                  <h2 className="section-title">Brands to Track</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* My Brands */}
                  <div>
                    <label className="label flex items-center gap-2">
                      <span className="tag-primary text-xs">YOUR BRANDS</span>
                    </label>
                    <div className="space-y-2">
                      {myBrands.map((brand, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={brand}
                            onChange={(e) => updateBrand('mine', index, e.target.value)}
                            placeholder="e.g., YourProduct"
                            className="input-field flex-1"
                          />
                          {myBrands.length > 1 && (
                            <button
                              onClick={() => removeBrand('mine', index)}
                              className="btn-danger px-3"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addBrand('mine')} className="btn-ghost text-sm w-full">
                        <Plus className="w-4 h-4 mr-1" /> Add brand
                      </button>
                    </div>
                  </div>

                  {/* Competitors */}
                  <div>
                    <label className="label flex items-center gap-2">
                      <span className="tag-accent text-xs">COMPETITORS</span>
                    </label>
                    <div className="space-y-2">
                      {competitors.map((competitor, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={competitor}
                            onChange={(e) => updateBrand('competitors', index, e.target.value)}
                            placeholder="e.g., CompetitorA"
                            className="input-field flex-1"
                          />
                          {competitors.length > 1 && (
                            <button
                              onClick={() => removeBrand('competitors', index)}
                              className="btn-danger px-3"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addBrand('competitors')}
                        className="btn-ghost text-sm w-full"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add competitor
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Intents Section */}
              <section className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  <h2 className="section-title">Search Queries (Intents)</h2>
                </div>

                <p className="text-sm text-navy-400 mb-4">
                  Define the questions you want to ask the AI. These should be buyer-intent queries
                  your customers might ask.
                </p>

                <div className="space-y-4">
                  {intents.map((intent, index) => (
                    <div key={index} className="p-4 bg-navy-800/30 rounded-xl border border-navy-700/50">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={intent.id}
                            onChange={(e) => updateIntent(index, 'id', e.target.value)}
                            placeholder="Intent ID (e.g., best-tools)"
                            className="input-field text-sm"
                          />
                          <textarea
                            value={intent.prompt}
                            onChange={(e) => updateIntent(index, 'prompt', e.target.value)}
                            placeholder="What are the best email marketing tools?"
                            rows={2}
                            className="input-field resize-none"
                          />
                        </div>
                        {intents.length > 1 && (
                          <button onClick={() => removeIntent(index)} className="btn-danger px-3 py-3">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button onClick={addIntent} className="btn-secondary w-full">
                    <Plus className="w-4 h-4 mr-2" /> Add another query
                  </button>
                </div>
              </section>
            </div>

            {/* Right Column - Preview & Actions */}
            <div className="space-y-6">
              {/* Run Button */}
              <div className="glass-card p-6 glow-primary">
                <button
                  onClick={runSearch}
                  disabled={!isConfigValid || isRunning}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Running search...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Run Search
                    </>
                  )}
                </button>

                {!isConfigValid && (
                  <p className="text-xs text-amber-400 mt-3 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Enter API key, at least one brand, and one intent
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-navy-700/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-400">Estimated cost</span>
                    <span className="text-navy-200 font-medium">~$0.001</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-navy-400">Estimated time</span>
                    <span className="text-navy-200 font-medium">~5 seconds</span>
                  </div>
                </div>
              </div>

              {/* YAML Preview */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-navy-400" />
                    <h3 className="font-medium text-navy-200">Config Preview</h3>
                  </div>
                  <button
                    onClick={() => setShowYamlPreview(!showYamlPreview)}
                    className="btn-ghost text-xs"
                  >
                    {showYamlPreview ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showYamlPreview && (
                  <div className="code-block max-h-80 overflow-auto text-xs mb-4">{yamlOutput}</div>
                )}

                <div className="flex gap-2">
                  <button onClick={copyToClipboard} className="btn-secondary flex-1 text-sm">
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" /> Copy YAML
                      </>
                    )}
                  </button>
                  <button onClick={downloadYaml} className="btn-secondary flex-1 text-sm">
                    <Download className="w-4 h-4 mr-1" /> Download
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="glass-card p-6">
                <h3 className="font-medium text-navy-200 mb-4">Configuration Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-navy-400 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Model
                    </span>
                    <span className="text-sm text-navy-200">
                      {GEMINI_MODELS.find((m) => m.id === selectedModel)?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-navy-400 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Your Brands
                    </span>
                    <span className="text-sm text-navy-200">
                      {myBrands.filter((b) => b.trim()).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-navy-400 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Competitors
                    </span>
                    <span className="text-sm text-navy-200">
                      {competitors.filter((c) => c.trim()).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-navy-400 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Queries
                    </span>
                    <span className="text-sm text-navy-200">
                      {intents.filter((i) => i.prompt.trim()).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-navy-400 flex items-center gap-2">
                      <Search className="w-4 h-4" /> Web Search
                    </span>
                    <span className="text-sm text-navy-200">
                      {enableWebSearch ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Results Tab */
          <div className="glass-card p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-bold text-navy-200">
                Search Results for Run: <span className="text-primary-400">{runId}</span>
              </h2>
              {results && results.intents_data && results.intents_data.length > 0 && (
                <div className="flex gap-2">
                  <button onClick={downloadResultsCSV} className="btn-secondary text-sm px-3 py-2" title="Download CSV">
                    <Download className="w-4 h-4 mr-2 inline" /> CSV
                  </button>
                  <button onClick={downloadResultsJSON} className="btn-secondary text-sm px-3 py-2" title="Download JSON">
                    <Code className="w-4 h-4 mr-2 inline" /> JSON
                  </button>
                  <button onClick={downloadResultsText} className="btn-secondary text-sm px-3 py-2" title="Download Text">
                    <FileText className="w-4 h-4 mr-2 inline" /> TXT
                  </button>
                </div>
              )}
            </div>
            {results && results.intents_data && results.intents_data.length > 0 ? (
                <div className="space-y-8">
                    {results.intents_data.map((intentResult: any) => (
                        <div key={intentResult.intent_id} className="p-6 bg-navy-800/20 rounded-2xl border border-navy-700/40 hover:border-navy-600/60 transition-colors">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
                                <MessageSquare className="w-4 h-4 text-primary-400" />
                              </div>
                              <h3 className="font-bold text-xl text-navy-100">{intentResult.prompt}</h3>
                            </div>

                            <div className="bg-navy-900/40 rounded-xl p-5 mb-6 border border-navy-800/50">
                                <FormattedAnswer text={intentResult.answer} mentions={intentResult.mentions} />
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Target className="w-4 h-4 text-accent-400" />
                                  <h4 className="font-semibold text-navy-400 text-sm uppercase tracking-wider">Detected Mentions</h4>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {intentResult.mentions && intentResult.mentions.length > 0 ? (
                                      intentResult.mentions.map((mention: any, index: number) => (
                                          <div key={index} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                                            mention.is_mine
                                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                          }`}>
                                              <span className="font-medium">{mention.brand}</span>
                                              {mention.rank && (
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                  mention.is_mine ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                                                }`}>
                                                  #{mention.rank}
                                                </span>
                                              )}
                                          </div>
                                      ))
                                    ) : (
                                      <span className="text-sm text-navy-500 italic text-center w-full py-2 bg-navy-900/20 rounded-lg border border-dashed border-navy-800">
                                        No brand mentions detected in this answer
                                      </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : results && results.intents_data && results.intents_data.length === 0 ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-900/30 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-xl font-semibold text-navy-200 mb-2">No Answers Retrieved</h2>
                <p className="text-navy-400 mb-4">
                  The run completed but no answers were retrieved from the LLM.
                </p>
                <p className="text-sm text-amber-400 mb-6">
                  This usually means the API key has exceeded its quota (429 error) or there was a connection issue.
                  Please check your API key and try again.
                </p>
                <button onClick={() => setActiveTab('config')} className="btn-primary">
                  <Settings className="w-4 h-4 mr-2" /> Go to Configuration
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-navy-800 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-navy-500" />
                </div>
                <h2 className="text-xl font-semibold text-navy-200 mb-2">No Results Yet</h2>
                <p className="text-navy-400 mb-6">
                  Configure your search settings and run a search to see results here.
                </p>
                <button onClick={() => setActiveTab('config')} className="btn-primary">
                  <Settings className="w-4 h-4 mr-2" /> Go to Configuration
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-navy-800/50 bg-navy-900/30 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-navy-500">
            <span>LLM Answer Watcher v0.2.0</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> BYOK - Bring Your Own Keys
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> Local-first storage
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Google Gemini powered
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
