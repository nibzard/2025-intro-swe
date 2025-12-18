import { useState, useCallback } from 'react';
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
} from 'lucide-react';
import { WatcherConfig, Intent, GEMINI_MODELS } from './types.ts';
import yaml from 'js-yaml';

function App() {
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
      const response = await fetch('http://127.0.0.1:8000/run_watcher', {
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
      
      // Now poll for results
      const resultsResponse = await fetch(`http://127.0.0.1:8000/results/${runData.run_id}`);
      if(!resultsResponse.ok) {
        const errorData = await resultsResponse.json();
        throw new Error(errorData.detail || 'Failed to fetch results');
      }
      
      const resultsData = await resultsResponse.json();
      setResults(resultsData);

      setActiveTab('results');
    } catch (error) {
      alert(`An error occurred: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const isConfigValid =
    apiKey &&
    myBrands.some((b) => b.trim()) &&
    intents.some((i) => i.id.trim() && i.prompt.trim());

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">LLM Answer Watcher</h1>
                <p className="text-sm text-slate-400">Monitor brand mentions in AI responses</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('config')}
                className={`btn-ghost ${activeTab === 'config' ? 'bg-slate-800 text-white' : ''}`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`btn-ghost ${activeTab === 'results' ? 'bg-slate-800 text-white' : ''}`}
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
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
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {GEMINI_MODELS.find((m) => m.id === selectedModel)?.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEnableWebSearch(!enableWebSearch)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        enableWebSearch ? 'bg-primary-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                          enableWebSearch ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-slate-300">Enable Google Search grounding</span>
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

                <p className="text-sm text-slate-400 mb-4">
                  Define the questions you want to ask the AI. These should be buyer-intent queries
                  your customers might ask.
                </p>

                <div className="space-y-4">
                  {intents.map((intent, index) => (
                    <div key={index} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
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

                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Estimated cost</span>
                    <span className="text-slate-200 font-medium">~$0.001</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-slate-400">Estimated time</span>
                    <span className="text-slate-200 font-medium">~5 seconds</span>
                  </div>
                </div>
              </div>

              {/* YAML Preview */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-slate-400" />
                    <h3 className="font-medium text-slate-200">Config Preview</h3>
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
                <h3 className="font-medium text-slate-200 mb-4">Configuration Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Model
                    </span>
                    <span className="text-sm text-slate-200">
                      {GEMINI_MODELS.find((m) => m.id === selectedModel)?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Your Brands
                    </span>
                    <span className="text-sm text-slate-200">
                      {myBrands.filter((b) => b.trim()).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Competitors
                    </span>
                    <span className="text-sm text-slate-200">
                      {competitors.filter((c) => c.trim()).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Queries
                    </span>
                    <span className="text-sm text-slate-200">
                      {intents.filter((i) => i.prompt.trim()).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Search className="w-4 h-4" /> Web Search
                    </span>
                    <span className="text-sm text-slate-200">
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
            <h2 className="text-2xl font-bold text-slate-200 mb-4">Search Results for Run: <span className="text-primary-400">{runId}</span></h2>
            {results && results.intents_data && results.intents_data.length > 0 ? (
                <div className="space-y-6">
                    {results.intents_data.map((intentResult: any) => (
                        <div key={intentResult.intent_id} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                            <h3 className="font-bold text-lg text-slate-300">{intentResult.prompt}</h3>
                            <p className="text-sm text-slate-400 italic mt-1">{intentResult.answer}</p>
                            <div className="mt-4">
                                <h4 className="font-semibold text-slate-400">Mentions:</h4>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    {intentResult.mentions.map((mention: any, index: number) => (
                                        <li key={index} className={`text-sm ${mention.is_mine ? 'text-primary-400' : 'text-accent-400'}`}>
                                            {mention.brand} (Rank: {mention.rank || 'N/A'})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            ) : results && results.intents_data && results.intents_data.length === 0 ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-900/30 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-xl font-semibold text-slate-200 mb-2">No Answers Retrieved</h2>
                <p className="text-slate-400 mb-4">
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-slate-500" />
                </div>
                <h2 className="text-xl font-semibold text-slate-200 mb-2">No Results Yet</h2>
                <p className="text-slate-400 mb-6">
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
      <footer className="relative border-t border-slate-800/50 bg-slate-900/30 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
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

export default App;