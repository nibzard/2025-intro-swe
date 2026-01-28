import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
  User,
  LogOut,
  Key,
} from 'lucide-react';
import type { WatcherConfig, Intent, BrandMention, Provider, ModelConfig } from '../types.ts';
import { GEMINI_MODELS, GROQ_MODELS } from '../types.ts';
import yaml from 'js-yaml';
import { useAuth } from '../auth/AuthContext';

const StatsComparison = ({ results, theme }: { results: any, theme: string }) => {
  if (!results || !results.intents_data) return null;

  const stats = {
    google: {
      totalMentions: 0,
      myBrandMentions: 0,
      competitorMentions: 0,
      myBrandRanks: [] as number[],
      myBrandRank1Mentions: 0,
      competitorRanks: [] as number[],
    },
    groq: {
      totalMentions: 0,
      myBrandMentions: 0,
      competitorMentions: 0,
      myBrandRanks: [] as number[],
      myBrandRank1Mentions: 0,
      competitorRanks: [] as number[],
    },
  };

  results.intents_data.forEach((intent: any) => {
    intent.answers.forEach((answer: any) => {
      const provider = answer.model.includes('gemini') ? 'google' : 'groq';
      stats[provider].totalMentions += answer.mentions.length;
      answer.mentions.forEach((mention: any) => {
        if (mention.is_mine) {
          stats[provider].myBrandMentions++;
          if (mention.rank) {
            stats[provider].myBrandRanks.push(mention.rank);
            if (mention.rank === 1) {
              stats[provider].myBrandRank1Mentions++;
            }
          }
        } else {
          stats[provider].competitorMentions++;
          if (mention.rank) {
            stats[provider].competitorRanks.push(mention.rank);
          }
        }
      });
    });
  });

  const avgRank = (ranks: number[]) => {
    if (ranks.length === 0) return 'N/A';
    return (ranks.reduce((a, b) => a + b, 0) / ranks.length).toFixed(2);
  };
  
  const glassCardClass = theme === 'dark'
    ? 'glass-card'
    : 'bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm';

  return (
    <div className={`${glassCardClass} p-6 mt-8`}>
      <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-navy-200' : 'text-gray-800'} mb-4`}>Model Comparison</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className={`font-bold text-lg ${theme === 'dark' ? 'text-primary-300' : 'text-primary-500'} mb-3`}>Google Gemini</h4>
          <div className={`space-y-2 ${theme === 'dark' ? 'text-navy-300' : 'text-gray-600'}`}>
            <div className="flex justify-between"><span>Detected Mentions:</span> <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.google.totalMentions}</span></div>
            <div className="flex justify-between"><span>My Brand Mentions:</span> <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.google.myBrandMentions}</span></div>
            <div className="flex justify-between"><span>#1 Ranks for My Brand:</span> <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.google.myBrandRank1Mentions}</span></div>
            <div className="flex justify-between"><span>Avg. My Brand Rank:</span> <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{avgRank(stats.google.myBrandRanks)}</span></div>
            <div className="flex justify-between"><span>Competitor Mentions:</span> <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.google.competitorMentions}</span></div>
            <div className="flex justify-between"><span>Avg. Competitor Rank:</span> <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{avgRank(stats.google.competitorRanks)}</span></div>
          </div>
        </div>
        <div>
          <h4 className={`font-bold text-lg ${theme === 'dark' ? 'text-accent-300' : 'text-accent-500'} mb-3`}>Groq</h4>
          <div className={`space-y-2 ${theme === 'dark' ? 'text-navy-300' : 'text-gray-600'}`}>
            <div className="flex justify-between"><span>Detected Mentions:</span> <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.groq.totalMentions}</span></div>
            <div className="flex justify-between"><span>My Brand Mentions:</span> <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.groq.myBrandMentions}</span></div>
            <div className="flex justify-between"><span>#1 Ranks for My Brand:</span> <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.groq.myBrandRank1Mentions}</span></div>
            <div className="flex justify-between"><span>Avg. My Brand Rank:</span> <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{avgRank(stats.groq.myBrandRanks)}</span></div>
            <div className="flex justify-between"><span>Competitor Mentions:</span> <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.groq.competitorMentions}</span></div>
            <div className="flex justify-between"><span>Avg. Competitor Rank:</span> <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{avgRank(stats.groq.competitorRanks)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TokenUsageStats = ({ results, selectedProvider, selectedGoogleModel, selectedGroqModel, theme }: { results: any, selectedProvider: string, selectedGoogleModel: string, selectedGroqModel: string, theme: string }) => {
  if (!results || !results.intents_data) return null;

  const modelInfo = {
    google: {
      used: 0,
    },
    groq: {
      used: 0,
    },
  };

  // Calculate tokens used from API response
  results.intents_data.forEach((intent: any) => {
    intent.answers.forEach((answer: any) => {
      const provider = answer.model.includes('gemini') ? 'google' : 'groq';
      if (answer.usage) {
        modelInfo[provider].used += answer.usage.total_tokens || 0;
      }
    });
  });

  const glassCardClass = theme === 'dark'
    ? 'glass-card'
    : 'bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm';

  return (
    <div className={`${glassCardClass} p-6 mt-8`}>
      <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-navy-200' : 'text-gray-800'} mb-4`}>Token Usage</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(selectedProvider === 'google' || selectedProvider === 'both') && (
          <div>
            <h4 className={`font-bold text-lg ${theme === 'dark' ? 'text-primary-300' : 'text-primary-500'} mb-3`}>Google Gemini ({selectedGoogleModel})</h4>
            <div className={`space-y-2 ${theme === 'dark' ? 'text-navy-300' : 'text-gray-600'}`}>
              <div className="flex justify-between"><span>Tokens Used:</span> <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{modelInfo.google.used}</span></div>
            </div>
          </div>
        )}
        {(selectedProvider === 'groq' || selectedProvider === 'both') && (
          <div>
            <h4 className={`font-bold text-lg ${theme === 'dark' ? 'text-accent-300' : 'text-accent-500'} mb-3`}>Groq ({selectedGroqModel})</h4>
            <div className={`space-y-2 ${theme === 'dark' ? 'text-navy-300' : 'text-gray-600'}`}>
              <div className="flex justify-between"><span>Tokens Used:</span> <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{modelInfo.groq.used}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// API base URL: use environment variable or default based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000');

const FormattedAnswer = ({ text, mentions = [], theme }: { text: string; mentions?: BrandMention[], theme: string }) => {
  if (!text) return null;

  const uniqueBrands = Array.from(new Set(mentions.map(m => m.brand)));
  const sortedBrands = uniqueBrands.sort((a, b) => b.length - a.length);
  const brandPattern = sortedBrands.length > 0
    ? new RegExp(`(${sortedBrands.map(b => b.replace(/[.*+?^${}()|[\\]/g, '\\$&')).join('|')})`, 'gi')
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
          <span key={i} className={isMine ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
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
          <strong key={i} className={`${theme === 'dark' ? 'text-primary-300' : 'text-primary-600'} font-bold`}>
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
            <h4 key={sIdx} className={`text-lg font-bold ${theme === 'dark' ? 'text-navy-100' : 'text-gray-900'} mt-6 mb-3 flex items-center gap-3`}>
              <span className={`h-px flex-1 bg-gradient-to-r ${theme === 'dark' ? 'from-primary-500/50' : 'from-primary-300/50'} to-transparent`}></span>
              <span className={`${theme === 'dark' ? 'text-primary-200' : 'text-primary-600'}`}>{processText(section.slice(4))}</span>
              <span className={`h-px flex-1 bg-gradient-to-l ${theme === 'dark' ? 'from-primary-500/50' : 'from-primary-300/50'} to-transparent`}></span>
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
                    <li key={lIdx} className={`flex gap-3 text-sm ${theme === 'dark' ? 'text-navy-300' : 'text-gray-700'}`}>
                      <span className={`${theme === 'dark' ? 'text-primary-400' : 'text-primary-500'} font-bold min-w-[12px] flex justify-center`}>{match[1].length > 1 ? match[1] : '•'}</span>
                      <span className="flex-1">{processText(match[2])}</span>
                    </li>
                  );
                }
                return <p key={lIdx} className={`text-sm ${theme === 'dark' ? 'text-navy-300' : 'text-gray-700'} ml-6`}>{processText(line)}</p>;
              })}
            </ul>
          );
        }

        return (
          <p key={sIdx} className={`text-sm ${theme === 'dark' ? 'text-navy-300' : 'text-gray-700'} leading-relaxed whitespace-pre-wrap`}>
            {processText(section)}
          </p>
        );
      })}
    </div>
  );
};

export default function Dashboard({ theme }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    navigate('/', { replace: true });
    await logout();
  };

  const [savedKeys, setSavedKeys] = useState<any[]>([]);

  useEffect(() => {
    const fetchSavedKeys = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/auth/api-keys`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setSavedKeys(await response.json());
        }
      } catch (err) {
        console.error('Failed to fetch saved keys', err);
      }
    };
    fetchSavedKeys();
  }, [token]);

  const loadSavedKey = async (provider: string, keyName: string | null) => {
    if (!token) return;
    try {
      const providerLower = provider.toLowerCase();
      let url = `${API_BASE_URL}/auth/api-keys/${providerLower}/key`;
      if (keyName) {
        url += `?key_name=${encodeURIComponent(keyName)}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiKeys(prev => ({ ...prev, [provider]: data.api_key }));
      }
    } catch (err) {
      console.error('Failed to load API key', err);
    }
  };

  // Set provider from query param
  useEffect(() => {
    const providerParam = searchParams.get('provider');
    if (providerParam === 'both') {
      setSelectedProvider('both');
    } else if (providerParam === 'google' || providerParam === 'groq') {
      setSelectedProvider(providerParam);
    }
  }, [searchParams]);

  // State
  const [activeTab, setActiveTab] = useState<'config' | 'results'>('config');
  const [selectedProvider, setSelectedProvider] = useState<Provider | 'both'>('google');
  const [apiKeys, setApiKeys] = useState({ google: '', groq: '' });
  const [selectedModel, setSelectedModel] = useState<string>(GEMINI_MODELS[0].id);
  const [selectedGoogleModel, setSelectedGoogleModel] = useState<string>(GEMINI_MODELS[0].id);
  const [selectedGroqModel, setSelectedGroqModel] = useState<string>(GROQ_MODELS[0].id);
  const [enableWebSearch, setEnableWebSearch] = useState(true);

  // Get available models based on selected provider
  const availableModels = selectedProvider === 'google' ? GEMINI_MODELS : GROQ_MODELS;

  // Handle provider change - reset model to first available
  const handleProviderChange = (provider: Provider | 'both') => {
    setSelectedProvider(provider);
    if (provider === 'google') {
      setSelectedModel(GEMINI_MODELS[0].id);
      setEnableWebSearch(true); // Google supports web search
    } else if (provider === 'groq') {
      setSelectedModel(GROQ_MODELS[0].id);
      setEnableWebSearch(false); // Groq doesn't support web search yet
    } else {
      setEnableWebSearch(true);
    }
  };
  const [myBrands, setMyBrands] = useState<string[]>(['']);
  const [competitors, setCompetitors] = useState<string[]>(['']);
  const [intents, setIntents] = useState<Intent[]>([{ id: '', prompt: '' }]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showYamlPreview, setShowYamlPreview] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showKeyDropdown, setShowKeyDropdown] = useState<{[key: string]: boolean}>({});


  // Generate YAML config
  const generateConfig = useCallback((): WatcherConfig => {
    let models: ModelConfig[] = [];

    if (selectedProvider === 'both') {
      models = [
        {
          provider: 'google',
          model_name: selectedGoogleModel,
          env_api_key: 'GEMINI_API_KEY',
          system_prompt: "google/gemini-grounding",
          ...(enableWebSearch && { tools: [{ google_search: {} }] }),
        },
        {
          provider: 'groq',
          model_name: selectedGroqModel,
          env_api_key: 'GROQ_API_KEY',
          system_prompt: "You are an unbiased market analyst. Provide factual, balanced recommendations. IMPORTANT: Structure your response using bullet points for lists and short paragraphs. Highlight key entities (brands, products, metrics) in **bold** to make them stand out. Avoid long blocks of text.",
        },
      ];
    } else {
      const envApiKey = selectedProvider === 'google' ? 'GEMINI_API_KEY' : 'GROQ_API_KEY';
      const systemPrompt = selectedProvider === 'google'
        ? "google/gemini-grounding"
        : "You are an unbiased market analyst. Provide factual, balanced recommendations. IMPORTANT: Structure your response using bullet points for lists and short paragraphs. Highlight key entities (brands, products, metrics) in **bold** to make them stand out. Avoid long blocks of text.";
      models = [
        {
          provider: selectedProvider,
          model_name: selectedModel,
          env_api_key: envApiKey,
          system_prompt: systemPrompt,
          ...(selectedProvider === 'google' && enableWebSearch && { tools: [{ google_search: {} }] }),
        },
      ];
    }

    const config: WatcherConfig = {
      run_settings: {
        output_dir: './output',
        sqlite_db_path: './output/watcher.db',
        max_concurrent_requests: 10,
        models: models,
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
  }, [selectedProvider, selectedModel, selectedGoogleModel, selectedGroqModel, enableWebSearch, myBrands, competitors, intents]);

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
    if (selectedProvider === 'both') {
      if (!apiKeys.google || !apiKeys.groq) {
        alert('Please enter API keys for both Google and Groq');
        return;
      }
    } else {
      if (!apiKeys[selectedProvider]) {
        alert(`Please enter your ${selectedProvider === 'google' ? 'Gemini' : 'Groq'} API key`);
        return;
      }
    }
    setIsRunning(true);
    setResults(null);
    setRunId(null);
    try {
      const response = await fetch(`${API_BASE_URL}/run_watcher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_keys: apiKeys, yaml_config: yamlOutput }),
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

    const headers = ['Intent ID', 'Prompt', 'Model', 'Answer', 'Brand', 'Rank', 'Is Mine'];
    const rows = [headers.join(',')];

    results.intents_data.forEach((intent: any) => {
      intent.answers.forEach((answer: any) => {
        if (answer.mentions && answer.mentions.length > 0) {
          answer.mentions.forEach((mention: any) => {
            const row = [
              `"${intent.intent_id}"`, 
              `"${intent.prompt.replace(/"/g, '""')}"`, 
              `"${answer.model}"`, 
              `"${answer.answer.replace(/"/g, '""')}"`, 
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
              `"${answer.model}"`, 
              `"${answer.answer.replace(/"/g, '""')}"`, 
              '',
              '',
              ''
          ];
          rows.push(row.join(','));
        }
      });
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
      text += `ID: ${intent.intent_id}\n\n`;
      intent.answers.forEach((answer: any) => {
        text += `Model: ${answer.model}\n`;
        text += `Answer:\n${answer.answer}\n\n`;
        text += 'Mentions:\n';
        if (answer.mentions && answer.mentions.length > 0) {
          answer.mentions.forEach((mention: any) => {
            text += `- ${mention.brand} (Rank: ${mention.rank || 'N/A'}) - ${mention.is_mine ? 'My Brand' : 'Competitor'}\n`;
          });
        } else {
          text += 'No mentions found.\n';
        }
        text += '\n';
      });
      text += '----------------------------------------\n\n';
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
    (selectedProvider === 'both'
      ? apiKeys.google && apiKeys.groq
      : selectedProvider && apiKeys[selectedProvider]) &&
    myBrands.some((b) => b.trim()) &&
    intents.some((i) => i.id.trim() && i.prompt.trim());

  const glassCardClass = theme === 'dark'
    ? 'glass-card'
    : 'bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm';

  const inputClass = theme === 'dark'
    ? 'input-field'
    : 'input-field bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500';

  const btnGhostClass = theme === 'dark'
    ? 'btn-ghost'
    : 'btn-ghost text-gray-600 hover:bg-gray-100 hover:text-gray-900';

  const btnSecondaryClass = theme === 'dark'
    ? 'btn-secondary'
    : 'btn-secondary bg-gray-100 text-gray-700 hover:bg-gray-200';

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-navy-950 text-white' : 'bg-gray-50 text-gray-800'}`}>
      {/* Background gradient */}
      <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5' : 'bg-gray-100'} pointer-events-none`} />

      {/* Header */}
      <header className={`relative z-40 border-b ${theme === 'dark' ? 'border-navy-800/50 bg-navy-900/50' : 'border-gray-200 bg-white/80'} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className={`${btnGhostClass} p-2`}
                title="Back to home"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>LLM Answer Watcher</h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>Monitor brand mentions in AI responses</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('config')}
                className={`${btnGhostClass} ${activeTab === 'config' ? (theme === 'dark' ? 'bg-navy-800 text-white' : 'bg-gray-200 text-gray-900') : ''}`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`${btnGhostClass} ${activeTab === 'results' ? (theme === 'dark' ? 'bg-navy-800 text-white' : 'bg-gray-200 text-gray-900') : ''}`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Results
              </button>

              <div className={`h-6 w-px mx-2 ${theme === 'dark' ? 'bg-navy-700' : 'bg-gray-300'}`}></div>

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`${btnGhostClass} p-2 ${showProfileMenu ? (theme === 'dark' ? 'bg-navy-800 text-white' : 'bg-gray-200 text-gray-900') : ''}`}
                >
                  <User className="w-5 h-5" />
                </button>

                {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-xl border p-2 shadow-lg z-100 ${
                    theme === 'dark'
                      ? 'bg-navy-900 border-navy-700 text-navy-100'
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}>
                    <div className="px-3 py-2 mb-2 border-b border-gray-200/10">
                      <p className="font-medium truncate">{user?.username}</p>
                      <p className={`text-xs truncate ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>{user?.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm mb-1 ${
                        theme === 'dark' ? 'hover:bg-navy-800' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setShowProfileMenu(false)}
                    >
                      My Keys
                    </Link>

                    <button
                      onClick={handleLogout}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 text-rose-500 hover:bg-rose-500/10`}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
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
              <section className={`${glassCardClass} p-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary-400" />
                  <h2 className="section-title">API Configuration</h2>
                </div>

                <div className="space-y-4">
                  {/* Provider Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <button
                      onClick={() => handleProviderChange('google')}
                      className={`p-3 rounded-xl border transition-all ${selectedProvider === 'google'
                          ? 'bg-primary-500/20 border-primary-500 text-primary-300'
                          : `${theme === 'dark' ? 'bg-navy-800/30 border-navy-700/50 text-navy-400 hover:border-navy-600' : 'bg-gray-100 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-200'}`
                      }`}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-medium">Google Gemini</span>
                      </div>
                      <p className="text-xs mt-1 opacity-70">With web search</p>
                    </button>
                    <button
                      onClick={() => handleProviderChange('groq')}
                      className={`p-3 rounded-xl border transition-all ${selectedProvider === 'groq'
                          ? 'bg-primary-500/20 border-primary-500 text-primary-300'
                          : `${theme === 'dark' ? 'bg-navy-800/30 border-navy-700/50 text-navy-400 hover:border-navy-600' : 'bg-gray-100 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-200'}`
                      }`}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <Zap className="w-4 h-4" />
                        <span className="font-medium">Groq</span>
                      </div>
                      <p className="text-xs mt-1 opacity-70">Ultra-fast inference</p>
                    </button>
                    <button
                      onClick={() => handleProviderChange('both')}
                      className={`p-3 rounded-xl border transition-all ${selectedProvider === 'both'
                          ? 'bg-accent-500/20 border-accent-500 text-accent-300'
                          : `${theme === 'dark' ? 'bg-navy-800/30 border-navy-700/50 text-navy-400 hover:border-navy-600' : 'bg-gray-100 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-200'}`
                      }`}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">Try Both</span>
                      </div>
                      <p className="text-xs mt-1 opacity-70">Compare models</p>
                    </button>
                  </div>

                {selectedProvider !== 'both' ? (
                  <div>
                    <label className="label">{selectedProvider === 'google' ? 'Gemini' : 'Groq'} API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={selectedProvider === 'google' ? apiKeys.google : apiKeys.groq}
                        onChange={(e) =>
                          setApiKeys({ ...apiKeys, [selectedProvider]: e.target.value })
                        }
                        placeholder={selectedProvider === 'google' ? 'AIzaSy...' : 'gsk_...'}
                        className={`${inputClass} pr-12`}
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-navy-400 hover:text-navy-200' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {savedKeys.filter(k => k.provider === selectedProvider).length > 0 && (
                      <div className="mt-2 relative">
                        <button
                          onClick={() => setShowKeyDropdown(prev => ({ ...prev, [selectedProvider]: !prev[selectedProvider] }))}
                          className={`text-xs flex items-center gap-1 ${theme === 'dark' ? 'text-primary-400' : 'text-primary-600'} hover:underline`}
                        >
                          <Key className="w-3 h-3" /> Use saved key <ChevronDown className="w-3 h-3" />
                        </button>
                        
                        {showKeyDropdown[selectedProvider] && (
                          <div className={`absolute left-0 top-full mt-1 w-full rounded-lg border shadow-lg z-20 ${
                            theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200'
                          }`}>
                            {savedKeys.filter(k => k.provider === selectedProvider).map(key => (
                              <button
                                key={key.id}
                                onClick={() => {
                                  loadSavedKey(selectedProvider, key.key_name);
                                  setShowKeyDropdown(prev => ({ ...prev, [selectedProvider]: false }));
                                }}
                                className={`w-full text-left px-3 py-2 text-sm first:rounded-t-lg last:rounded-b-lg ${
                                  theme === 'dark' ? 'hover:bg-navy-700 text-navy-100' : 'hover:bg-gray-50 text-gray-900'
                                }`}
                              >
                                {key.key_name || 'Default Key'}
                                <span className={`ml-2 text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>
                                  {new Date(key.created_at).toLocaleDateString()}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <p className={`text-xs ${theme === 'dark' ? 'text-navy-500' : 'text-gray-500'} mt-1`}>
                      Get your key from{' '}
                      {selectedProvider === 'google' ? (
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener"
                          className="text-primary-500 hover:text-primary-600"
                        >
                          Google AI Studio
                        </a>
                      ) : (
                        <a
                          href="https://console.groq.com/keys"
                          target="_blank"
                          rel="noopener"
                          className="text-primary-500 hover:text-primary-600"
                        >
                          Groq Console
                        </a>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Google Gemini API Key</label>
                      <input
                        type="password"
                        value={apiKeys.google}
                        onChange={(e) => setApiKeys({ ...apiKeys, google: e.target.value })}
                        placeholder="AIzaSy..."
                        className={inputClass}
                      />
                      {savedKeys.filter(k => k.provider === 'google').length > 0 && (
                        <div className="mt-2 relative">
                          <button
                            onClick={() => setShowKeyDropdown(prev => ({ ...prev, google: !prev.google }))}
                            className={`text-xs flex items-center gap-1 ${theme === 'dark' ? 'text-primary-400' : 'text-primary-600'} hover:underline`}
                          >
                            <Key className="w-3 h-3" /> Use saved key <ChevronDown className="w-3 h-3" />
                          </button>
                          
                          {showKeyDropdown.google && (
                            <div className={`absolute left-0 top-full mt-1 w-full rounded-lg border shadow-lg z-20 ${
                              theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200'
                            }`}>
                              {savedKeys.filter(k => k.provider === 'google').map(key => (
                                <button
                                  key={key.id}
                                  onClick={() => {
                                    loadSavedKey('google', key.key_name);
                                    setShowKeyDropdown(prev => ({ ...prev, google: false }));
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm first:rounded-t-lg last:rounded-b-lg ${
                                    theme === 'dark' ? 'hover:bg-navy-700 text-navy-100' : 'hover:bg-gray-50 text-gray-900'
                                  }`}
                                >
                                  {key.key_name || 'Default Key'}
                                  <span className={`ml-2 text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>
                                    {new Date(key.created_at).toLocaleDateString()}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="label">Groq API Key</label>
                      <input
                        type="password"
                        value={apiKeys.groq}
                        onChange={(e) => setApiKeys({ ...apiKeys, groq: e.target.value })}
                        placeholder="gsk_..."
                        className={inputClass}
                      />
                      {savedKeys.filter(k => k.provider === 'groq').length > 0 && (
                        <div className="mt-2 relative">
                          <button
                            onClick={() => setShowKeyDropdown(prev => ({ ...prev, groq: !prev.groq }))}
                            className={`text-xs flex items-center gap-1 ${theme === 'dark' ? 'text-primary-400' : 'text-primary-600'} hover:underline`}
                          >
                            <Key className="w-3 h-3" /> Use saved key <ChevronDown className="w-3 h-3" />
                          </button>
                          
                          {showKeyDropdown.groq && (
                            <div className={`absolute left-0 top-full mt-1 w-full rounded-lg border shadow-lg z-20 ${
                              theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200'
                            }`}>
                              {savedKeys.filter(k => k.provider === 'groq').map(key => (
                                <button
                                  key={key.id}
                                  onClick={() => {
                                    loadSavedKey('groq', key.key_name);
                                    setShowKeyDropdown(prev => ({ ...prev, groq: false }));
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm first:rounded-t-lg last:rounded-b-lg ${
                                    theme === 'dark' ? 'hover:bg-navy-700 text-navy-100' : 'hover:bg-gray-50 text-gray-900'
                                  }`}
                                >
                                  {key.key_name || 'Default Key'}
                                  <span className={`ml-2 text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>
                                    {new Date(key.created_at).toLocaleDateString()}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedProvider !== 'both' ? (
                  <div>
                    <label className="label">Model</label>
                    <div className="relative">
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className={`${inputClass} appearance-none cursor-pointer`}
                      >
                        {availableModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-navy-400' : 'text-gray-400'} pointer-events-none`} />
                    </div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-navy-500' : 'text-gray-500'} mt-1`}>
                      {availableModels.find((m) => m.id === selectedModel)?.description}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Google Model</label>
                      <select
                        value={selectedGoogleModel}
                        onChange={(e) => setSelectedGoogleModel(e.target.value)}
                        className={inputClass}
                      >
                        {GEMINI_MODELS.map((model) => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Groq Model</label>
                      <select
                        value={selectedGroqModel}
                        onChange={(e) => setSelectedGroqModel(e.target.value)}
                        className={inputClass}
                      >
                        {GROQ_MODELS.map((model) => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {selectedProvider === 'google' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEnableWebSearch(!enableWebSearch)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${enableWebSearch ? 'bg-primary-500' : (theme === 'dark' ? 'bg-navy-700' : 'bg-gray-300')}`}
                    >
                      <div
                        className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${enableWebSearch ? 'translate-x-6' : 'translate-x-0.5'}`}
                      />
                    </button>
                    <span className={`text-sm ${theme === 'dark' ? 'text-navy-300' : 'text-gray-700'}`}>Enable Google Search grounding</span>
                  </div>
                )}
              </div>
            </section>

              {/* Brands Section */}
              <section className={`${glassCardClass} p-6`}>
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
                            className={`${inputClass} flex-1`}
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
                      <button onClick={() => addBrand('mine')} className={`${btnGhostClass} text-sm w-full`}>
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
                            className={`${inputClass} flex-1`}
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
                        className={`${btnGhostClass} text-sm w-full`}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add competitor
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Intents Section */}
              <section className={`${glassCardClass} p-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  <h2 className="section-title">Search Queries (Intents)</h2>
                </div>

                <p className={`text-sm ${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'} mb-4`}>
                  Define the questions you want to ask the AI. These should be buyer-intent queries
                  your customers might ask.
                </p>

                <div className="space-y-4">
                  {intents.map((intent, index) => (
                    <div key={index} className={`p-4 ${theme === 'dark' ? 'bg-navy-800/30' : 'bg-gray-100/50'} rounded-xl border ${theme === 'dark' ? 'border-navy-700/50' : 'border-gray-200/50'}`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={intent.id}
                            onChange={(e) => updateIntent(index, 'id', e.target.value)}
                            placeholder="Intent ID (e.g., best-tools)"
                            className={`${inputClass} text-sm`}
                          />
                          <textarea
                            value={intent.prompt}
                            onChange={(e) => updateIntent(index, 'prompt', e.target.value)}
                            placeholder="What are the best email marketing tools?"
                            rows={2}
                            className={`${inputClass} resize-none`}
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

                  <button onClick={addIntent} className={`${btnSecondaryClass} w-full`}>
                    <Plus className="w-4 h-4 mr-2" /> Add another query
                  </button>
                </div>
              </section>
            </div>

            {/* Right Column - Preview & Actions */}
            <div className="space-y-6">
              {/* Run Button */}
              <div className={`${glassCardClass} p-6 glow-primary`}>
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
                      <Play className="w-5 h-5 z-10" />
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

                <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-navy-700/50' : 'border-gray-200/50'}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>Estimated cost</span>
                    <span className={`${theme === 'dark' ? 'text-navy-200' : 'text-gray-800'} font-medium`}>~$0.001</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className={`${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>Estimated time</span>
                    <span className={`${theme === 'dark' ? 'text-navy-200' : 'text-gray-800'} font-medium`}>~5 seconds</span>
                  </div>
                </div>
              </div>

              {/* YAML Preview */}
              <div className={`${glassCardClass} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-gray-400" />
                    <h3 className={`font-medium ${theme === 'dark' ? 'text-navy-200' : 'text-gray-800'}`}>Config Preview</h3>
                  </div>
                  <button
                    onClick={() => setShowYamlPreview(!showYamlPreview)}
                    className={`${btnGhostClass} text-xs`}
                  >
                    {showYamlPreview ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showYamlPreview && (
                  <div className={`code-block max-h-80 overflow-auto text-xs mb-4 ${theme === 'light' ? 'bg-gray-100 text-gray-800' : ''}`}>{yamlOutput}</div>
                )}

                <div className="flex gap-2">
                  <button onClick={copyToClipboard} className={`${btnSecondaryClass} flex-1 text-sm`}>
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
                  <button onClick={downloadYaml} className={`${btnSecondaryClass} flex-1 text-sm`}>
                    <Download className="w-4 h-4 mr-1" /> Download
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className={`${glassCardClass} p-6`}>
                <h3 className={`font-medium ${theme === 'dark' ? 'text-navy-200' : 'text-gray-800'} mb-4`}>Configuration Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} flex items-center gap-2`}>
                      <Brain className="w-4 h-4" /> Provider
                    </span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-navy-200' : 'text-gray-800'} capitalize`}>
                      {selectedProvider}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} flex items-center gap-2`}>
                      <Zap className="w-4 h-4" /> Model
                    </span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-navy-200' : 'text-gray-800'}`}>
                      {selectedProvider === 'google' ? selectedGoogleModel : selectedGroqModel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} flex items-center gap-2`}>
                      <Target className="w-4 h-4" /> Your Brands
                    </span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-navy-200' : 'text-gray-800'}`}>
                      {myBrands.filter((b) => b.trim()).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} flex items-center gap-2`}>
                      <Users className="w-4 h-4" /> Competitors
                    </span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-navy-200' : 'text-gray-800'}`}>
                      {competitors.filter((c) => c.trim()).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} flex items-center gap-2`}>
                      <MessageSquare className="w-4 h-4" /> Queries
                    </span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-navy-200' : 'text-gray-800'}`}>
                      {intents.filter((i) => i.prompt.trim()).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} flex items-center gap-2`}>
                      <Search className="w-4 h-4" /> Web Search
                    </span>
                    <span className={`text-sm ${enableWebSearch ? 'text-green-400' : 'text-red-400'}`}>
                      {enableWebSearch ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`${glassCardClass} p-8`}> {/* Outer div for the Results Tab, acts as single root element */}
            {results && results.intents_data && results.intents_data.length > 0 ? (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-navy-200' : 'text-gray-800'}`}>
                    Search Results for Run: <span className="text-primary-400">{runId}</span>
                  </h2>
                  <div className="flex gap-2">
                    <button onClick={downloadResultsCSV} className={`${btnSecondaryClass} text-sm px-3 py-2`} title="Download CSV">
                      <Download className="w-4 h-4 mr-2 inline" /> CSV
                    </button>
                    <button onClick={downloadResultsJSON} className={`${btnSecondaryClass} text-sm px-3 py-2`} title="Download JSON">
                      <Code className="w-4 h-4 mr-2 inline" /> JSON
                    </button>
                    <button onClick={downloadResultsText} className={`${btnSecondaryClass} text-sm px-3 py-2`} title="Download Text">
                      <FileText className="w-4 h-4 mr-2 inline" /> TXT
                    </button>
                  </div>
                </div>
                <div className="space-y-8">
                  {results.intents_data.map((intentResult: any) => (
                    <div key={intentResult.intent_id} className={`p-6 ${theme === 'dark' ? 'bg-navy-800/20' : 'bg-gray-100/50'} rounded-2xl border ${theme === 'dark' ? 'border-navy-700/40 hover:border-navy-600/60' : 'border-gray-200/40 hover:border-gray-300/60'} transition-colors`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-4 h-4 text-primary-400" />
                        </div>
                        <h3 className={`font-bold text-xl ${theme === 'dark' ? 'text-navy-100' : 'text-gray-900'}`}>{intentResult.prompt}</h3>
                      </div>

                      {selectedProvider === 'both' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {intentResult.answers.map((answer: any, index: number) => (
                            <div key={index} className={`${theme === 'dark' ? 'bg-navy-900/40' : 'bg-white/50'} rounded-xl p-5 border ${theme === 'dark' ? 'border-navy-800/50' : 'border-gray-200/50'}`}>
                              <h4 className={`font-bold text-lg ${theme === 'dark' ? 'text-primary-300' : 'text-primary-600'} mb-3`}>{answer.model}</h4>
                              <FormattedAnswer text={answer.answer} mentions={answer.mentions} theme={theme} />
                              <div className="mt-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Target className="w-4 h-4 text-accent-400" />
                                  <h4 className={`font-semibold ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} text-sm uppercase tracking-wider`}>Detected Mentions</h4>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  {answer.mentions && answer.mentions.length > 0 ? (
                                    answer.mentions.map((mention: any, mIndex: number) => (
                                      <div key={mIndex} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${mention.is_mine
                                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                                        <span className="font-medium">{mention.brand}</span>
                                        {mention.rank && (
                                          <span className={`text-xs px-1.5 py-0.5 rounded ${mention.is_mine ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                                            #{mention.rank}
                                          </span>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <span className={`text-sm italic text-center w-full py-2 rounded-lg border border-dashed ${theme === 'dark' ? 'text-navy-500 bg-navy-900/20 border-navy-800' : 'text-gray-400 bg-gray-100/50 border-gray-200'}`}>
                                      No brand mentions detected
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={`${theme === 'dark' ? 'bg-navy-900/40' : 'bg-white/50'} rounded-xl p-5 mb-6 border ${theme === 'dark' ? 'border-navy-800/50' : 'border-gray-200/50'}`}>
                          <FormattedAnswer text={intentResult.answers[0].answer} mentions={intentResult.answers[0].mentions} theme={theme} />
                          <div className="mt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Target className="w-4 h-4 text-accent-400" />
                              <h4 className={`font-semibold ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} text-sm uppercase tracking-wider`}>Detected Mentions</h4>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {intentResult.answers[0].mentions && intentResult.answers[0].mentions.length > 0 ? (
                                intentResult.answers[0].mentions.map((mention: any, mIndex: number) => (
                                  <div key={mIndex} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${mention.is_mine
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                                    <span className="font-medium">{mention.brand}</span>
                                    {mention.rank && (
                                      <span className={`text-xs px-1.5 py-0.5 rounded ${mention.is_mine ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                                        #{mention.rank}
                                      </span>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <span className={`text-sm italic text-center w-full py-2 rounded-lg border border-dashed ${theme === 'dark' ? 'text-navy-500 bg-navy-900/20 border-navy-800' : 'text-gray-400 bg-gray-100/50 border-gray-200'}`}>
                                  No brand mentions detected
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {selectedProvider === 'both' && <StatsComparison results={results} theme={theme} />}
                <TokenUsageStats results={results} selectedProvider={selectedProvider} selectedGoogleModel={selectedGoogleModel} selectedGroqModel={selectedGroqModel} theme={theme} />
              </>
            ) : (
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${theme === 'dark' ? 'bg-navy-800' : 'bg-gray-100'} flex items-center justify-center`}>
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-navy-200' : 'text-gray-800'} mb-2`}>No Results Yet</h2>
                <p className={`${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} mb-6`}>
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
      <footer className={`relative border-t ${theme === 'dark' ? 'border-navy-800/50 bg-navy-900/30' : 'border-gray-200 bg-gray-100'} mt-12`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className={`flex items-center justify-between text-sm ${theme === 'dark' ? 'text-navy-500' : 'text-gray-500'}`}>
            <span>LLM Answer Watcher v0.2.0</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> BYOK - Bring Your Own Keys
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> Local-first storage
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Gemini & Groq powered
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}