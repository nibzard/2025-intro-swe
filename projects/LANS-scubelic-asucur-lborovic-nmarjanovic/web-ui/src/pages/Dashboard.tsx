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
  ArrowRight,
  User,
  LogOut,
  Layout,
  Key,
  Building2,
  Info,
  FileSpreadsheet,
  Trash2,
  Menu,
  TrendingUp,
} from 'lucide-react';
import type { WatcherConfig, Intent, BrandMention, Provider, ModelConfig, UserBrand, UserIntent } from '../types.ts';
import { GEMINI_MODELS, GROQ_MODELS } from '../types.ts';
import yaml from 'js-yaml';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import { Skeleton } from '../components/ui/Skeleton';
import { StatsBar } from '../components/ui/StatsBar';
import { TagInput } from '../components/ui/TagInput';
import { CollapsibleSection } from '../components/ui/CollapsibleSection';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { PromptOptimizer } from '../components/PromptOptimizer';

const INTENT_TEMPLATES = [
  { id: 'pricing-compare', label: 'Pricing Comparison', prompt: 'Compare the pricing models of [MyBrand] vs [Competitor]. Which offers better value for small businesses?' },
  { id: 'feature-analysis', label: 'Feature Analysis', prompt: 'What are the key feature differences between [MyBrand] and [Competitor]? Highlight unique selling points.' },
  { id: 'sentiment-check', label: 'Brand Sentiment', prompt: 'What is the general user sentiment towards [MyBrand] in 2024? Mention common praises and complaints.' },
  { id: 'alternatives', label: 'Best Alternatives', prompt: 'What are the top 3 alternatives to [Competitor] and why should I consider [MyBrand]?' },
  { id: 'security-review', label: 'Security Review', prompt: 'How does [MyBrand] compare to [Competitor] in terms of security and compliance certifications?' },
];

const BrandRecommendation = ({ results, theme }: { results: any, theme: string }) => {
  if (!results || !results.intents_data) return null;

  let totalMentions = 0;
  let myMentions = 0;
  let myRanks: number[] = [];

  results.intents_data.forEach((intent: any) => {
    intent.answers.forEach((answer: any) => {
      totalMentions += answer.mentions.length;
      answer.mentions.forEach((mention: any) => {
        if (mention.is_mine) {
          myMentions++;
          if (mention.rank) myRanks.push(mention.rank);
        }
      });
    });
  });

  const sov = totalMentions > 0 ? (myMentions / totalMentions) * 100 : 0;
  const avgRank = myRanks.length > 0 ? myRanks.reduce((a, b) => a + b, 0) / myRanks.length : 0;

  let title = "";
  let message = "";
  let colorClass = "";
  let icon = null;

  if (myMentions === 0) {
    title = "Invisible to AI";
    message = "Your brand was not mentioned in any responses. You are effectively invisible to these models for these queries. Immediate action required: Update your website content to explicitly answer these questions, and consider PR or social proof to increase brand corpus frequency.";
    colorClass = theme === 'dark' ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-red-700 bg-red-50 border-red-200";
    icon = <AlertCircle className="w-6 h-6" />;
  } else if (sov < 20) {
    title = "Low Visibility";
    message = `You have only ${sov.toFixed(1)}% Share of Voice. Competitors are dominating the conversation. Focus on differentiating your value proposition and getting mentioned in comparison articles and reviews that LLMs cite.`;
    colorClass = theme === 'dark' ? "text-orange-400 bg-orange-500/10 border-orange-500/20" : "text-orange-700 bg-orange-50 border-orange-200";
    icon = <AlertCircle className="w-6 h-6" />;
  } else if (sov < 50) {
    title = "Growing Presence";
    message = `You have a healthy ${sov.toFixed(1)}% Share of Voice. To become the market leader, focus on "best of" lists and specific feature comparisons where you can win.`;
    colorClass = theme === 'dark' ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" : "text-yellow-700 bg-yellow-50 border-yellow-200";
    icon = <TrendingUp className="w-6 h-6" />;
  } else {
    title = "Market Leader";
    message = `Excellent! You command ${sov.toFixed(1)}% of mentions. Your strategy should shift to defense: monitor for new entrants and sentiment shifts.`;
    colorClass = theme === 'dark' ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-green-700 bg-green-50 border-green-200";
    icon = <CheckCircle2 className="w-6 h-6" />;
  }

  // Rank adjustments
  if (myMentions > 0 && avgRank > 3) {
     message += ` However, your average rank is low (${avgRank.toFixed(1)}). Work on technical SEO and specific attribute association to climb the lists.`;
  }

  return (
    <div className={`p-6 rounded-2xl border ${colorClass} h-full`}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <p className={`text-sm ${theme === 'dark' ? 'text-navy-100' : 'text-gray-800'} leading-relaxed`}>
        {message}
      </p>
    </div>
  );
};

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
    if (ranks.length === 0) return 0;
    return parseFloat((ranks.reduce((a, b) => a + b, 0) / ranks.length).toFixed(2));
  };
  
  const glassCardClass = theme === 'dark'
    ? 'glass-card'
    : 'glass-card-light';

  return (
    <div className={`${glassCardClass} p-6 mt-8`}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary-400" />
        <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-navy-200' : 'text-black'}`}>Model Comparison</h3>
      </div>
      
      <p className={`text-sm ${theme === 'dark' ? 'text-navy-400' : 'text-slate-500'} mb-6`}>
        Compare how different AI models perceive your brand against competitors across all search queries.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Google Gemini Column */}
        <div>
          <h4 className={`font-bold text-lg ${theme === 'dark' ? 'text-primary-300' : 'text-primary-500'} mb-4 flex items-center gap-2`}>
            Google Gemini
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-primary-500/30 uppercase">With Search</span>
          </h4>
          <div className="space-y-6">
             <div title="Percentage of mentions belonging to your brand out of all brand mentions detected.">
               <StatsBar 
                  label="Share of Voice" 
                  value={stats.google.myBrandMentions} 
                  total={stats.google.totalMentions || 1} 
                  theme={theme}
                  colorClass="bg-primary-500"
                  suffix={` / ${stats.google.totalMentions} total mentions`}
               />
               <p className="text-[11px] text-navy-400 mt-1">How often you appear compared to everyone else.</p>
             </div>

             <div title="How often your brand was the first one mentioned in the response.">
               <StatsBar 
                  label="#1 Ranking Rate" 
                  value={stats.google.myBrandRank1Mentions} 
                  total={stats.google.myBrandMentions || 1} 
                  theme={theme}
                  colorClass="bg-emerald-500"
                  suffix={` / ${stats.google.myBrandMentions} of your mentions`}
               />
               <p className="text-[11px] text-navy-400 mt-1">Frequency of being the top recommendation.</p>
             </div>

             <div className="grid grid-cols-2 gap-4 mt-2">
                <div 
                  className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-navy-900 border-navy-800' : 'bg-slate-50 border-slate-200'}`}
                  title="Average numerical position of your brand in the response lists (Lower is better)."
                >
                    <div className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-slate-500'} flex items-center gap-1`}>
                      Avg My Rank <Info className="w-3 h-3" />
                    </div>
                    <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{avgRank(stats.google.myBrandRanks) || '-'}</div>
                </div>
                <div 
                  className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-navy-900 border-navy-800' : 'bg-slate-50 border-slate-200'}`}
                  title="Average numerical position of competitor brands (Higher than yours is better)."
                >
                    <div className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-slate-500'} flex items-center gap-1`}>
                      Avg Comp Rank <Info className="w-3 h-3" />
                    </div>
                    <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{avgRank(stats.google.competitorRanks) || '-'}</div>
                </div>
             </div>
          </div>
        </div>

        {/* Groq Column */}
        <div>
          <h4 className={`font-bold text-lg ${theme === 'dark' ? 'text-accent-300' : 'text-accent-500'} mb-4 flex items-center gap-2`}>
            Groq
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-accent-500/30 uppercase">Llama 3</span>
          </h4>
          <div className="space-y-6">
             <div title="Percentage of mentions belonging to your brand out of all brand mentions detected.">
               <StatsBar 
                  label="Share of Voice" 
                  value={stats.groq.myBrandMentions} 
                  total={stats.groq.totalMentions || 1} 
                  theme={theme}
                  colorClass="bg-accent-500"
                  suffix={` / ${stats.groq.totalMentions} total mentions`}
               />
               <p className="text-[11px] text-navy-400 mt-1">How often you appear compared to everyone else.</p>
             </div>

             <div title="How often your brand was the first one mentioned in the response.">
               <StatsBar 
                  label="#1 Ranking Rate" 
                  value={stats.groq.myBrandRank1Mentions} 
                  total={stats.groq.myBrandMentions || 1} 
                  theme={theme}
                  colorClass="bg-emerald-500"
                  suffix={` / ${stats.groq.myBrandMentions} of your mentions`}
               />
               <p className="text-[11px] text-navy-400 mt-1">Frequency of being the top recommendation.</p>
             </div>

             <div className="grid grid-cols-2 gap-4 mt-2">
                <div 
                  className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-navy-900 border-navy-800' : 'bg-slate-50 border-slate-200'}`}
                  title="Average numerical position of your brand in the response lists (Lower is better)."
                >
                    <div className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-slate-500'} flex items-center gap-1`}>
                      Avg My Rank <Info className="w-3 h-3" />
                    </div>
                    <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{avgRank(stats.groq.myBrandRanks) || '-'}</div>
                </div>
                <div 
                  className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-navy-900 border-navy-800' : 'bg-slate-50 border-slate-200'}`}
                  title="Average numerical position of competitor brands (Higher than yours is better)."
                >
                    <div className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-slate-500'} flex items-center gap-1`}>
                      Avg Comp Rank <Info className="w-3 h-3" />
                    </div>
                    <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{avgRank(stats.groq.competitorRanks) || '-'}</div>
                </div>
             </div>
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

  const cardStyle = `p-6 ${theme === 'dark' ? 'bg-navy-800/20 border-navy-700/40' : 'bg-gray-100/50 border-gray-200/40'} rounded-2xl border`;

  return (
    <div className={cardStyle}>
      <div className="flex items-center gap-3 mb-6">
         <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-primary-500/10 text-primary-500' : 'bg-primary-100 text-primary-600'}`}>
            <Zap className="w-5 h-5" />
         </div>
         <div>
            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-navy-200' : 'text-black'}`}>Token Consumption</h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-slate-500'}`}>Total generated tokens for this search run</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(selectedProvider === 'google' || selectedProvider === 'both') && (
           <div className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-navy-900/40 border-navy-800' 
                : 'bg-white border-slate-200 shadow-sm'
           }`}>
              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-500">
                          <Sparkles className="w-5 h-5" />
                       </div>
                       <div>
                          <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Google Gemini</h4>
                          <p className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-slate-500'}`}>{selectedGoogleModel}</p>
                       </div>
                    </div>
                 </div>

                 <div className="mt-2">
                    <div className={`text-3xl font-bold font-mono tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                       {modelInfo.google.used.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-primary-500/20 text-primary-300' : 'bg-primary-100 text-primary-700'}`}>
                           TOKENS
                        </span>
                        <span className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-slate-500'}`}>generated total</span>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {(selectedProvider === 'groq' || selectedProvider === 'both') && (
           <div className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-navy-900/40 border-navy-800' 
                : 'bg-white border-slate-200 shadow-sm'
           }`}>
              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2.5 rounded-xl bg-accent-500/10 text-accent-500">
                          <Zap className="w-5 h-5" />
                       </div>
                       <div>
                          <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Groq</h4>
                          <p className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-slate-500'}`}>{selectedGroqModel}</p>
                       </div>
                    </div>
                 </div>

                 <div className="mt-2">
                    <div className={`text-3xl font-bold font-mono tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                       {modelInfo.groq.used.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-accent-500/20 text-accent-300' : 'bg-accent-100 text-accent-700'}`}>
                           TOKENS
                        </span>
                        <span className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-slate-500'}`}>generated total</span>
                    </div>
                 </div>
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

  const processText = (str: string | any): any => {
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
            <h4 key={sIdx} className={`text-lg font-bold ${theme === 'dark' ? 'text-navy-100' : 'text-black'} mt-6 mb-3 flex items-center gap-3`}>
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
                    <li key={lIdx} className={`flex gap-3 text-sm ${theme === 'dark' ? 'text-navy-300' : 'text-black'}`}>
                      <span className={`${theme === 'dark' ? 'text-primary-400' : 'text-primary-500'} font-bold min-w-[12px] flex justify-center`}>{match[1].length > 1 ? match[1] : '•'}</span>
                      <span className="flex-1">{processText(match[2])}</span>
                    </li>
                  );
                }
                return <p key={lIdx} className={`text-sm ${theme === 'dark' ? 'text-navy-300' : 'text-black'} ml-6`}>{processText(line)}</p>;
              })}
            </ul>
          );
        }

        return (
          <p key={sIdx} className={`text-sm ${theme === 'dark' ? 'text-navy-300' : 'text-black'} leading-relaxed whitespace-pre-wrap`}>
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
  const { showToast } = useToast();
  const avatarColor = localStorage.getItem('user_avatar_color') || 'bg-primary-500';
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    navigate('/', { replace: true });
    await logout();
  };

  const [savedKeys, setSavedKeys] = useState<any[]>([]);
  const [savedBrands, setSavedBrands] = useState<UserBrand[]>([]);
  const [savedIntents, setSavedIntents] = useState<UserIntent[]>([]);
  const [userSettings, setUserSettings] = useState<any>(null);

  // Load user settings to check notification preferences
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/user/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data) setUserSettings(data);
    })
    .catch(err => console.error("Failed to load settings", err));
  }, [token]);

  // Load saved data (keys, brands, intents) on mount
  useEffect(() => {
    if (!token) return;

    // Load saved API keys
    fetch(`${API_BASE_URL}/auth/api-keys`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : [])
    .then(data => setSavedKeys(data))
    .catch(err => console.error('Failed to load API keys', err));

    // Load saved brands
    fetch(`${API_BASE_URL}/user/brands`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : [])
    .then(data => setSavedBrands(data))
    .catch(err => console.error('Failed to load brands', err));

    // Load saved intents
    fetch(`${API_BASE_URL}/user/intents`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : [])
    .then(data => setSavedIntents(data))
    .catch(err => console.error('Failed to load intents', err));
  }, [token]);

  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showCompetitorDropdown, setShowCompetitorDropdown] = useState(false);
  const [showIntentDropdown, setShowIntentDropdown] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [useWizardMode, setUseWizardMode] = useState(true);

  // Load view preference on mount
  useEffect(() => {
    const savedView = localStorage.getItem('default_view_mode');
    if (savedView === 'classic') {
      setUseWizardMode(false);
    }
  }, []);

  // Handle URL params (runId, tab)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'results' || tabParam === 'config') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    const runIdParam = searchParams.get('runId');
    
    if (runIdParam) {
      setRunId(runIdParam);
      setIsRunning(true);
      setActiveTab('results');

      fetch(`${API_BASE_URL}/results/${runIdParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
          if (!res.ok) throw new Error('Failed to fetch results');
          return res.json();
      })
      .then(data => {
          setResults(data);
      })
      .catch(err => {
          console.error("Error fetching run results:", err);
          showToast("Failed to load report", "error");
      })
      .finally(() => {
          setIsRunning(false);
      });
    }
  }, [token, searchParams.get('runId')]);

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

  // Stepper State
  const [currentStep, setCurrentStep] = useState(1);

  // Validation Helpers
  const isApiStepValid = () => {
    if (selectedProvider === 'both') return !!(apiKeys.google && apiKeys.groq);
    return !!apiKeys[selectedProvider];
  };
  const isBrandStepValid = () => myBrands.some(b => b.trim().length > 0);
  const isCompetitorStepValid = () => true; // Optional step
  const isIntentStepValid = () => intents.some(i => i.prompt.trim().length > 0);

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

  // Dynamic Styles
  const sectionBorderClass = useWizardMode 
    ? 'border border-rose-500/50 ring-1 ring-rose-500/20 shadow-lg shadow-rose-500/10' 
    : 'border border-emerald-500/50 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/10';

  // Handlers
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

  const applyTemplate = (templateId: string) => {
    const template = INTENT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    // Replace placeholders if brands are set
    let prompt = template.prompt;
    
    const activeBrands = myBrands.filter(b => b.trim());
    const activeCompetitors = competitors.filter(c => c.trim());
    
    // Create comma-separated lists
    const brandsText = activeBrands.length > 0 
      ? (activeBrands.length > 1 
          ? activeBrands.slice(0, -1).join(', ') + ' and ' + activeBrands.slice(-1)
          : activeBrands[0])
      : '[MyBrand]';
      
    const competitorsText = activeCompetitors.length > 0 
      ? (activeCompetitors.length > 1 
          ? activeCompetitors.slice(0, -1).join(', ') + ' and ' + activeCompetitors.slice(-1)
          : activeCompetitors[0])
      : '[Competitor]';
    
    prompt = prompt.replace(/\[MyBrand\]/g, brandsText).replace(/\[Competitor\]/g, competitorsText);
    
    // Append to existing intents
    // If the first intent is empty, replace it instead
    if (intents.length === 1 && !intents[0].id && !intents[0].prompt) {
        setIntents([{ id: template.id, prompt }]);
    } else {
        setIntents([...intents, { id: template.id, prompt }]);
    }
    showToast(`Added "${template.label}" template`, 'info');
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(yamlOutput);
    setCopied(true);
    showToast('Configuration copied to clipboard', 'success');
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

  const loadSavedKey = async (provider: string, keyId: string, keyName: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/api-keys/${keyId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.api_key) {
        setApiKeys(prev => ({ ...prev, [provider]: data.api_key }));
        showToast(`Loaded ${keyName || 'default'} key for ${provider}`, 'success');
      } else {
         throw new Error("API key not returned");
      }
    } catch (err) {
      console.error('Failed to load API key', err);
      showToast('Failed to load API key', 'error');
    }
  };

  const handleRunWatcher = async () => {
    if (selectedProvider === 'both') {
      if (!apiKeys.google || !apiKeys.groq) {
        showToast('Please enter API keys for both Google and Groq', 'error');
        return;
      }
    } else {
      if (!apiKeys[selectedProvider]) {
        showToast(`Please enter your ${selectedProvider === 'google' ? 'Gemini' : 'Groq'} API key`, 'error');
        return;
      }
    }
    setIsRunning(true);
    setResults(null);
    setRunId(null);
    setActiveTab('results'); // Switch immediately to show loading state

    try {
      const response = await fetch(`${API_BASE_URL}/run_watcher`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ api_keys: apiKeys, yaml_config: yamlOutput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to run watcher');
      }

      const runData = await response.json();
      setRunId(runData.run_id);
      
      // Poll for results if needed, or just fetch immediately if synchronous
      // Assuming synchronous for now based on previous code, but could be async
      const resultsResponse = await fetch(`${API_BASE_URL}/results/${runData.run_id}`);
      if(!resultsResponse.ok) {
        const errorData = await resultsResponse.json();
        throw new Error(errorData.detail || 'Failed to fetch results');
      }

      const resultsData = await resultsResponse.json();
      setResults(resultsData);
      showToast('Search completed successfully', 'success');

      // Check settings fresh to ensure we have latest preferences
      try {
        const settingsRes = await fetch(`${API_BASE_URL}/user/settings`, {
           headers: { 'Authorization': `Bearer ${token}` }
        });
        if (settingsRes.ok) {
           const settings = await settingsRes.json();
           if (settings?.notifications?.browser && 'Notification' in window && Notification.permission === 'granted') {
             showToast('Attempting to send browser notification...', 'info'); // Debug toast
             new Notification('Scan Completed', {
               body: 'Your brand monitoring scan has finished successfully.',
               icon: '/vite.svg'
             });
           }
        }
      } catch (e) {
        console.error("Failed to check notification settings", e);
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showToast(`An error occurred: ${message}`, 'error');
      setActiveTab('config'); // Switch back to config on error
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
    : 'glass-card-light';

  const inputClass = theme === 'dark'
    ? 'input-field'
    : 'input-field-light';

  const btnGhostClass = theme === 'dark'
    ? 'btn-ghost'
    : 'btn-ghost-light';

  const btnSecondaryClass = theme === 'dark'
    ? 'btn-secondary'
    : 'btn-secondary-light';

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-navy-950 text-white' : 'light-mode-bg'}`}>
      {/* Background gradient */}
      <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5' : 'bg-slate-100/50'} pointer-events-none`} />

      {/* Header */}
      <header className={`relative z-40 border-b ${theme === 'dark' ? 'border-navy-800/50 bg-navy-900/50' : 'border-slate-200 bg-white/80'} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowMainMenu(!showMainMenu)}
                  className={`${btnGhostClass} p-2 ${showMainMenu ? (theme === 'dark' ? 'bg-navy-800 text-white' : 'bg-gray-200 text-gray-900') : ''}`}
                  title="Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                {showMainMenu && (
                  <div className={`absolute left-0 top-full mt-2 w-56 rounded-xl border p-2 shadow-lg z-100 ${
                    theme === 'dark'
                      ? 'bg-navy-900 border-navy-700 text-navy-100'
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}>
                    <Link
                      to="/setup"
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                        theme === 'dark' ? 'hover:bg-navy-800' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setShowMainMenu(false)}
                    >
                      <Sparkles className="w-4 h-4" />
                      Setup Wizard
                    </Link>
                    <Link
                      to="/history"
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                        theme === 'dark' ? 'hover:bg-navy-800' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setShowMainMenu(false)}
                    >
                      <Clock className="w-4 h-4" />
                      Run History
                    </Link>
                    <Link
                      to="/settings"
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                        theme === 'dark' ? 'hover:bg-navy-800' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setShowMainMenu(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <Link
                      to="/faq"
                      state={{ from: 'dashboard' }}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                        theme === 'dark' ? 'hover:bg-navy-800' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setShowMainMenu(false)}
                    >
                      <Info className="w-4 h-4" />
                      FAQ
                    </Link>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
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
                  className={`p-1 rounded-full transition-transform active:scale-95 ${avatarColor} ${showProfileMenu ? 'ring-2 ring-white shadow-lg' : 'shadow-md'} hover:scale-105`}
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
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
                      My Profile
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
            {/* Left Column - Configuration (Stepper) */}
            <div className={`${useWizardMode ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-4 transition-all`}>
              
              {/* View Mode Toggle */}
              <div className="flex justify-between items-center mb-4">
                <div className="font-mono font-bold text-3xl flex items-center">
                   <span 
                     className={`animate-typing bg-clip-text text-transparent bg-gradient-to-r ${
                       !useWizardMode 
                         ? 'from-emerald-500 to-teal-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                         : 'from-rose-500 to-rose-600 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                     }`} 
                     style={{ 
                       width: '19ch', 
                       '--cursor-color': !useWizardMode ? '#10b981' : '#f43f5e' 
                     } as React.CSSProperties}
                   >
                     LLM Answer Watcher
                   </span>
                </div>

                <button
                  onClick={() => setUseWizardMode(!useWizardMode)}
                  className={`relative flex items-center p-1 rounded-full border transition-all duration-300 ${
                    theme === 'dark' ? 'bg-navy-900 border-navy-700' : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Sliding Background */}
                  <div
                    className={`absolute inset-y-1 w-[50%] rounded-full shadow-md transition-all duration-300 ease-out ${
                      useWizardMode 
                        ? 'left-1 bg-rose-500 shadow-rose-500/20' 
                        : 'left-[48%] bg-emerald-500 shadow-emerald-500/20'
                    }`}
                  />

                  {/* Wizard Option */}
                  <div className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-300 ${useWizardMode ? 'text-white' : (theme === 'dark' ? 'text-navy-400' : 'text-gray-500')}`}>
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Wizard</span>
                  </div>

                  {/* Classic Option */}
                  <div className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-300 ${!useWizardMode ? 'text-white' : (theme === 'dark' ? 'text-navy-400' : 'text-gray-500')}`}>
                    <Layout className="w-4 h-4" />
                    <span className="text-sm font-medium">Classic</span>
                  </div>
                </button>
              </div>

              {/* STEP 1: API Configuration */}
              <CollapsibleSection 
                key={useWizardMode ? `step1_wiz_${currentStep === 1}` : 'step1_classic'}
                title={useWizardMode ? "1. Connect Intelligence" : "API Configuration"}
                icon={<Shield className="w-5 h-5 text-primary-400" />}
                theme={theme}
                isComplete={isApiStepValid()}
                defaultOpen={useWizardMode ? currentStep === 1 : true}
                isOpen={undefined}
                onToggle={undefined}
                className={sectionBorderClass}
              >
                <div className="space-y-6">
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
                    <label className={theme === 'dark' ? 'label' : 'label-light'}>{selectedProvider === 'google' ? 'Gemini' : 'Groq'} API Key</label>
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
                          className={`text-xs font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${theme === 'dark' ? 'bg-navy-800 border-navy-700 text-primary-300 hover:bg-navy-700 hover:border-primary-500/50' : 'bg-white border-gray-200 text-primary-600 hover:bg-gray-50 hover:border-primary-200'}`}
                        >
                          <Key className="w-3 h-3" /> Use saved key <ChevronDown className="w-3 h-3" />
                        </button>
                        
                        {showKeyDropdown[selectedProvider] && (
                          <div className={`absolute left-0 top-full mt-2 w-full rounded-xl border shadow-xl z-20 backdrop-blur-xl p-1 ${
                            theme === 'dark' ? 'bg-navy-900/90 border-navy-700/50' : 'bg-white/90 border-gray-200/50'
                          }`}>
                            {savedKeys.filter(k => k.provider === selectedProvider).map(key => (
                              <button
                                key={key.id}
                                onClick={() => {
                                  loadSavedKey(selectedProvider, key.id, key.key_name);
                                  setShowKeyDropdown(prev => ({ ...prev, [selectedProvider]: false }));
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                                  theme === 'dark' ? 'hover:bg-white/5 text-navy-100' : 'hover:bg-black/5 text-gray-900'
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
                      <label className={theme === 'dark' ? 'label' : 'label-light'}>Google Gemini API Key</label>
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
                            className={`text-xs font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${theme === 'dark' ? 'bg-navy-800 border-navy-700 text-primary-300 hover:bg-navy-700 hover:border-primary-500/50' : 'bg-white border-gray-200 text-primary-600 hover:bg-gray-50 hover:border-primary-200'}`}
                          >
                            <Key className="w-3 h-3" /> Use saved key <ChevronDown className="w-3 h-3" />
                          </button>
                          {showKeyDropdown['google'] && (
                            <div className={`absolute left-0 top-full mt-2 w-full rounded-xl border shadow-xl z-20 backdrop-blur-xl p-1 ${theme === 'dark' ? 'bg-navy-900/90 border-navy-700/50' : 'bg-white/90 border-gray-200/50'}`}>
                              {savedKeys.filter(k => k.provider === 'google').map(key => (
                                <button
                                  key={key.id}
                                  onClick={() => {
                                    loadSavedKey('google', key.id, key.key_name);
                                    setShowKeyDropdown(prev => ({ ...prev, google: false }));
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-navy-100' : 'hover:bg-black/5 text-gray-900'}`}
                                >
                                  {key.key_name || 'Default Key'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={theme === 'dark' ? 'label' : 'label-light'}>Groq API Key</label>
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
                            className={`text-xs font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${theme === 'dark' ? 'bg-navy-800 border-navy-700 text-primary-300 hover:bg-navy-700 hover:border-primary-500/50' : 'bg-white border-gray-200 text-primary-600 hover:bg-gray-50 hover:border-primary-200'}`}
                          >
                            <Key className="w-3 h-3" /> Use saved key <ChevronDown className="w-3 h-3" />
                          </button>
                          {showKeyDropdown['groq'] && (
                            <div className={`absolute left-0 top-full mt-2 w-full rounded-xl border shadow-xl z-20 backdrop-blur-xl p-1 ${theme === 'dark' ? 'bg-navy-900/90 border-navy-700/50' : 'bg-white/90 border-gray-200/50'}`}>
                              {savedKeys.filter(k => k.provider === 'groq').map(key => (
                                <button
                                  key={key.id}
                                  onClick={() => {
                                    loadSavedKey('groq', key.id, key.key_name);
                                    setShowKeyDropdown(prev => ({ ...prev, groq: false }));
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-navy-100' : 'hover:bg-black/5 text-gray-900'}`}
                                >
                                  {key.key_name || 'Default Key'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Model Selection (Simplified) */}
                {selectedProvider !== 'both' && (
                  <div>
                    <label className={theme === 'dark' ? 'label' : 'label-light'}>Model</label>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className={`${inputClass} appearance-none cursor-pointer`}
                      >
                        {availableModels.map((model) => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                      </select>
                  </div>
                )}

                {useWizardMode && (
                  <div className="pt-4 border-t border-gray-200/10 flex justify-end">
                    <button 
                      onClick={() => {
                          if(isApiStepValid()) setCurrentStep(2);
                          else showToast("Please enter an API Key", "error");
                      }} 
                      className="btn-primary flex items-center justify-center whitespace-nowrap"
                      disabled={!isApiStepValid()}
                    >
                      Next: Define Identity <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                )}
                </div>
              </CollapsibleSection>

              {/* STEP 2 & 3: Brands & Competitors (Conditional Layout) */}
              {useWizardMode ? (
                <>
                  {/* Step 2: My Brands Only */}
                  <CollapsibleSection 
                    key={`step2_${currentStep === 2}`}
                    title="2. Brands to Track" 
                    icon={<Target className="w-5 h-5 text-accent-400" />}
                    theme={theme}
                    isComplete={isBrandStepValid()}
                    defaultOpen={currentStep === 2}
                    isOpen={undefined}
                    onToggle={undefined}
                    className={`${currentStep < 2 ? 'opacity-50 pointer-events-none' : ''} ${sectionBorderClass}`}
                  >
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="label flex items-center gap-2 mb-0">
                            <span className="tag-primary text-xs">YOUR BRANDS</span>
                          </label>
                          {savedBrands.some(b => b.is_mine) && (
                            <div className="relative">
                              <button
                                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                                className={`text-xs font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${theme === 'dark' ? 'bg-navy-800 border-navy-700 text-primary-300 hover:bg-navy-700 hover:border-primary-500/50' : 'bg-white border-gray-200 text-primary-600 hover:bg-gray-50 hover:border-primary-200'}`}
                              >
                                <Building2 className="w-3 h-3" /> Load Saved <ChevronDown className="w-3 h-3" />
                              </button>
                              {showBrandDropdown && (
                                <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl z-20 backdrop-blur-xl p-1 ${theme === 'dark' ? 'bg-navy-900/90 border-navy-700/50' : 'bg-white/90 border-gray-200/50'}`}>
                                  {savedBrands.filter(b => b.is_mine).map(brand => (
                                    <button
                                      key={brand.id}
                                      onClick={() => {
                                        if (!myBrands.includes(brand.brand_name)) {
                                          const newBrands = [...myBrands];
                                          if (newBrands.length === 1 && newBrands[0] === '') newBrands[0] = brand.brand_name;
                                          else newBrands.push(brand.brand_name);
                                          setMyBrands(newBrands);
                                        }
                                        setShowBrandDropdown(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-navy-100' : 'hover:bg-black/5 text-gray-900'}`}
                                    >
                                      {brand.brand_name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <TagInput tags={myBrands.filter(b => b.trim())} onChange={setMyBrands} placeholder="Type brand & press Enter (e.g. Nike)" theme={theme} />
                        <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>Tip: Include aliases like "Nike.com" or "Nike Shoes"</p>
                        <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-navy-500' : 'text-gray-400'}`}>You can add multiple brands by pressing enter.</p>
                      </div>
                      <div className="pt-4 border-t border-gray-200/10 flex justify-end">
                        <button onClick={() => { if(isBrandStepValid()) setCurrentStep(3); else showToast("Please define at least one brand", "error"); }} className="btn-primary flex items-center justify-center whitespace-nowrap" disabled={!isBrandStepValid()}>
                          Next: The Competition <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* Step 3: Competitors Only */}
                  <CollapsibleSection 
                    key={`step3_${currentStep === 3}`}
                    title="3. The Competition" 
                    icon={<Users className="w-5 h-5 text-rose-400" />}
                    theme={theme}
                    isComplete={competitors.filter(c => c.trim()).length > 0}
                    defaultOpen={currentStep === 3}
                    isOpen={undefined}
                    onToggle={undefined}
                    className={`${currentStep < 3 ? 'opacity-50 pointer-events-none' : ''} ${sectionBorderClass}`}
                  >
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="label flex items-center gap-2 mb-0">
                            <span className="tag-accent text-xs">COMPETITORS</span>
                          </label>
                          {savedBrands.some(b => !b.is_mine) && (
                            <div className="relative">
                              <button
                                onClick={() => setShowCompetitorDropdown(!showCompetitorDropdown)}
                                className={`text-xs font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${theme === 'dark' ? 'bg-navy-800 border-navy-700 text-primary-300 hover:bg-navy-700 hover:border-primary-500/50' : 'bg-white border-gray-200 text-primary-600 hover:bg-gray-50 hover:border-primary-200'}`}
                              >
                                <Users className="w-3 h-3" /> Load Saved <ChevronDown className="w-3 h-3" />
                              </button>
                              {showCompetitorDropdown && (
                                <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl z-20 backdrop-blur-xl p-1 ${theme === 'dark' ? 'bg-navy-900/90 border-navy-700/50' : 'bg-white/90 border-gray-200/50'}`}>
                                  {savedBrands.filter(b => !b.is_mine).map(brand => (
                                    <button
                                      key={brand.id}
                                      onClick={() => {
                                        if (!competitors.includes(brand.brand_name)) {
                                          const newCompetitors = [...competitors];
                                          if (newCompetitors.length === 1 && newCompetitors[0] === '') newCompetitors[0] = brand.brand_name;
                                          else newCompetitors.push(brand.brand_name);
                                          setCompetitors(newCompetitors);
                                        }
                                        setShowCompetitorDropdown(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-navy-100' : 'hover:bg-black/5 text-gray-900'}`}
                                    >
                                      {brand.brand_name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <TagInput tags={competitors.filter(c => c.trim())} onChange={setCompetitors} placeholder="Type competitor & press Enter (e.g. Adidas)" theme={theme} />
                        <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-navy-500' : 'text-gray-400'}`}>You can add multiple brands by pressing enter.</p>
                      </div>
                      <div className="pt-4 border-t border-gray-200/10 flex justify-end">
                        <button onClick={() => setCurrentStep(4)} className="btn-primary flex items-center justify-center whitespace-nowrap">
                          Next: Define Questions <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                      </div>
                    </div>
                  </CollapsibleSection>
                </>
              ) : (
                /* Classic Mode: Combined Brands Section */
                <CollapsibleSection 
                  title="Brands to Track" 
                  icon={<Target className="w-5 h-5 text-accent-400" />}
                  theme={theme}
                  isComplete={myBrands.filter(b => b.trim()).length > 0}
                  defaultOpen={false}
                  className={sectionBorderClass}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* My Brands */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="label flex items-center gap-2 mb-0">
                          <span className="tag-primary text-xs">YOUR BRANDS</span>
                        </label>
                        {savedBrands.some(b => b.is_mine) && (
                          <div className="relative">
                            <button
                              onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                              className={`text-xs font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${theme === 'dark' ? 'bg-navy-800 border-navy-700 text-primary-300 hover:bg-navy-700 hover:border-primary-500/50' : 'bg-white border-gray-200 text-primary-600 hover:bg-gray-50 hover:border-primary-200'}`}
                            >
                              <Building2 className="w-3 h-3" /> Load Saved <ChevronDown className="w-3 h-3" />
                            </button>
                            {showBrandDropdown && (
                              <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl z-20 backdrop-blur-xl p-1 ${theme === 'dark' ? 'bg-navy-900/90 border-navy-700/50' : 'bg-white/90 border-gray-200/50'}`}>
                                {savedBrands.filter(b => b.is_mine).map(brand => (
                                  <button
                                    key={brand.id}
                                    onClick={() => {
                                      if (!myBrands.includes(brand.brand_name)) {
                                        const newBrands = [...myBrands];
                                        if (newBrands.length === 1 && newBrands[0] === '') newBrands[0] = brand.brand_name;
                                        else newBrands.push(brand.brand_name);
                                        setMyBrands(newBrands);
                                      }
                                      setShowBrandDropdown(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-navy-100' : 'hover:bg-black/5 text-gray-900'}`}
                                  >
                                    {brand.brand_name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <TagInput tags={myBrands.filter(b => b.trim())} onChange={setMyBrands} placeholder="Type brand & press Enter" theme={theme} />
                      <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-navy-500' : 'text-gray-400'}`}>You can add multiple brands by pressing enter.</p>
                    </div>

                    {/* Competitors */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="label flex items-center gap-2 mb-0">
                          <span className="tag-accent text-xs">COMPETITORS</span>
                        </label>
                        {savedBrands.some(b => !b.is_mine) && (
                          <div className="relative">
                            <button
                              onClick={() => setShowCompetitorDropdown(!showCompetitorDropdown)}
                              className={`text-xs font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${theme === 'dark' ? 'bg-navy-800 border-navy-700 text-primary-300 hover:bg-navy-700 hover:border-primary-500/50' : 'bg-white border-gray-200 text-primary-600 hover:bg-gray-50 hover:border-primary-200'}`}
                            >
                              <Users className="w-3 h-3" /> Load Saved <ChevronDown className="w-3 h-3" />
                            </button>
                            {showCompetitorDropdown && (
                              <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl z-20 backdrop-blur-xl p-1 ${theme === 'dark' ? 'bg-navy-900/90 border-navy-700/50' : 'bg-white/90 border-gray-200/50'}`}>
                                {savedBrands.filter(b => !b.is_mine).map(brand => (
                                  <button
                                    key={brand.id}
                                    onClick={() => {
                                      if (!competitors.includes(brand.brand_name)) {
                                        const newCompetitors = [...competitors];
                                        if (newCompetitors.length === 1 && newCompetitors[0] === '') newCompetitors[0] = brand.brand_name;
                                        else newCompetitors.push(brand.brand_name);
                                        setCompetitors(newCompetitors);
                                      }
                                      setShowCompetitorDropdown(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-navy-100' : 'hover:bg-black/5 text-gray-900'}`}
                                  >
                                    {brand.brand_name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <TagInput tags={competitors.filter(c => c.trim())} onChange={setCompetitors} placeholder="Type competitor & press Enter" theme={theme} />
                      <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-navy-500' : 'text-gray-400'}`}>You can add multiple brands by pressing enter.</p>
                    </div>
                  </div>
                </CollapsibleSection>
              )}

              {/* STEP 4: Intents */}
              <CollapsibleSection 
                key={`step4_${currentStep === 4}`}
                title={useWizardMode ? "4. Questions to Ask" : "Search Queries (Intents)"}
                icon={<MessageSquare className="w-5 h-5 text-green-400" />}
                theme={theme}
                isComplete={isIntentStepValid()}
                defaultOpen={useWizardMode ? currentStep === 4 : false}
                isOpen={undefined}
                onToggle={undefined}
                className={`${useWizardMode && currentStep < 4 ? 'opacity-50 pointer-events-none' : ''} ${sectionBorderClass}`}
              >
                <div className="space-y-6">
                  {/* Suggestion Rail */}
                  <div>
                    <p className={`text-xs mb-3 font-medium ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>Quick Start Templates</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {INTENT_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template.id)}
                          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            theme === 'dark'
                              ? 'bg-navy-800 border-navy-700 text-navy-300 hover:border-primary-500 hover:text-primary-400'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-primary-500 hover:text-primary-600'
                          }`}
                        >
                          + {template.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {intents.map((intent, index) => (
                      <div key={index} className={`p-4 ${theme === 'dark' ? 'bg-navy-800/30' : 'bg-gray-100/50'} rounded-xl border ${theme === 'dark' ? 'border-navy-700/50' : 'border-gray-200/50'}`}>
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={intent.id}
                              onChange={(e) => updateIntent(index, 'id', e.target.value)}
                              placeholder="Question ID (e.g., best-tools)"
                              className={`${inputClass} text-sm`}
                            />
                            <div className="relative">
                              <textarea
                                value={intent.prompt}
                                onChange={(e) => updateIntent(index, 'prompt', e.target.value)}
                                placeholder="What are the best tools for..."
                                rows={3}
                                className={`${inputClass} resize-none pr-12`}
                              />
                              <div className="absolute bottom-2 right-2">
                                <PromptOptimizer
                                  currentPrompt={intent.prompt}
                                  onOptimize={(newPrompt) => updateIntent(index, 'prompt', newPrompt)}
                                  apiKey={selectedProvider === 'both' ? (apiKeys.google || apiKeys.groq) : apiKeys[selectedProvider]}
                                  provider={selectedProvider === 'both' ? (apiKeys.google ? 'google' : 'groq') : selectedProvider}
                                  modelName={selectedProvider === 'both' ? (apiKeys.google ? selectedGoogleModel : selectedGroqModel) : selectedModel}
                                  competitors={competitors}
                                  myBrands={myBrands}
                                  theme={theme}
                                />
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeIntent(index)} 
                            className="btn-danger p-3"
                            title="Remove query"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={addIntent}
                      className={`w-full py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-colors ${
                        theme === 'dark'
                          ? 'border-navy-700 text-navy-400 hover:border-primary-500/50 hover:text-primary-400'
                          : 'border-gray-300 text-gray-500 hover:border-primary-400 hover:text-primary-600'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      Add Another Question
                    </button>
                  </div>

                  {useWizardMode && (
                    <div className="pt-4 border-t border-gray-200/10 flex justify-end">
                      <button 
                        onClick={() => {
                            if(isIntentStepValid()) setCurrentStep(5);
                            else showToast("Please add at least one question", "error");
                        }} 
                        className="btn-primary flex items-center justify-center whitespace-nowrap"
                        disabled={!isIntentStepValid()}
                      >
                        Next: Review & Launch <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              {/* STEP 5: Review & Launch (Wizard Only) */}
              {useWizardMode && currentStep === 5 && (
                <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-navy-800/50 border-primary-500/30 shadow-lg shadow-primary-500/5' : 'bg-white border-primary-200 shadow-xl'}`}>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    Ready to Launch
                  </h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50'}`}>
                      <p className="text-xs opacity-70 mb-1">Provider</p>
                      <p className="font-medium capitalize">{selectedProvider}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50'}`}>
                      <p className="text-xs opacity-70 mb-1">Brand</p>
                      <p className="font-medium">{myBrands.filter(b => b.trim()).length} Aliases</p>
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50'}`}>
                      <p className="text-xs opacity-70 mb-1">Competitors</p>
                      <p className="font-medium">{competitors.filter(c => c.trim()).length} Tracked</p>
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50'}`}>
                      <p className="text-xs opacity-70 mb-1">Questions</p>
                      <p className="font-medium">{intents.filter(i => i.prompt.trim()).length} Queries</p>
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50'}`}>
                      <p className="text-xs opacity-70 mb-1">Est. Cost</p>
                      <p className="font-medium">~$0.001</p>
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-navy-900' : 'bg-gray-50'}`}>
                      <p className="text-xs opacity-70 mb-1">Est. Time</p>
                      <p className="font-medium">~5 seconds</p>
                    </div>
                  </div>

                  <button 
                    onClick={handleRunWatcher} 
                    disabled={isRunning}
                    className={`btn-primary w-full py-4 text-lg transform hover:-translate-y-0.5 transition-all ${useWizardMode ? 'shadow-xl shadow-primary-500/20 hover:shadow-primary-500/40' : 'shadow-xl shadow-emerald-500/40 hover:shadow-emerald-500/60'}`}
                  >
                    {isRunning ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Running Analysis...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Play className="w-5 h-5" />
                        Run Analysis
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Preview & Actions */}
            <div className={`space-y-6 ${useWizardMode ? 'hidden' : ''}`}>
              {/* Run Button */}
              <div className={`${glassCardClass} p-6 ${useWizardMode ? 'glow-primary' : 'glow-emerald'}`}>
                <button
                  onClick={handleRunWatcher}
                  disabled={!isConfigValid || isRunning}
                  className={`btn-primary w-full flex items-center justify-center gap-2 text-lg py-4 ${!useWizardMode ? 'shadow-emerald-500/50' : ''}`}
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
                  <button onClick={copyToClipboard} className={`${btnSecondaryClass} flex-1 text-sm flex items-center justify-center gap-2`}>
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy YAML
                      </>
                    )}
                  </button>
                  <button onClick={downloadYaml} className={`${btnSecondaryClass} flex-1 text-sm flex items-center justify-center gap-2`}>
                    <Download className="w-4 h-4" /> Download
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
          <div className={`${glassCardClass} p-8`}> 
            {isRunning ? (
               <div className="space-y-8">
                  {/* Loading Indicator */}
                  <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-primary-500/30 blur-2xl rounded-full animate-pulse"></div>
                      <div className={`relative w-20 h-20 rounded-2xl ${theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-100'} border shadow-2xl flex items-center justify-center`}>
                        <div className="relative">
                           <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                           <div className="absolute inset-0 flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-accent-400 animate-pulse" />
                           </div>
                        </div>
                      </div>
                    </div>
                    <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                      LLM Answer Watcher is Analyzing
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-navy-300' : 'text-gray-500'} max-w-sm text-center`}>
                      We're querying the models and extracting brand mentions. This may take a few seconds...
                    </p>
                  </div>

                  {/* Skeletons */}
                  <div className="space-y-8 animate-pulse opacity-40 pointer-events-none">
                      <div className="flex justify-between items-center mb-6">
                        <Skeleton className="h-8 w-64" theme={theme} />
                        <div className="flex gap-2">
                            <Skeleton className="h-9 w-20" theme={theme} />
                            <Skeleton className="h-9 w-20" theme={theme} />
                        </div>
                      </div>
                      {[1, 2].map((i) => (
                        <div key={i} className={`p-6 rounded-2xl border ${theme === 'dark' ? 'border-navy-700/40 bg-navy-800/20' : 'border-gray-200/40 bg-gray-100/50'}`}>
                            <div className="flex items-center gap-4 mb-4">
                                <Skeleton className="w-8 h-8 rounded-lg" theme={theme} />
                                <Skeleton className="h-6 w-1/2" theme={theme} />
                            </div>
                            <Skeleton className="h-32 w-full rounded-xl" theme={theme} />
                        </div>
                      ))}
                   </div>
               </div>
            ) : results && results.intents_data && results.intents_data.length > 0 ? (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-navy-200' : 'text-gray-800'}`}>
                    Search Results for Run: <span className="text-primary-400">{runId}</span>
                  </h2>
                  <div className="flex items-center gap-4">
                    <span className={`hidden sm:block text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} italic text-right max-w-[150px]`}>
                      Download your analysis for reports or further processing
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className={`${btnSecondaryClass} flex items-center gap-2 px-4 py-2`}
                      >
                        <Download className="w-4 h-4" />
                        Export Results
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showExportMenu && (
                      <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-xl z-50 overflow-hidden animate-scale-in origin-top-right ${
                        theme === 'dark' ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-200'
                      }`}>
                         <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-navy-400 bg-navy-900/50' : 'text-gray-500 bg-gray-50'}`}>
                           Select Format
                         </div>
                         <div className="p-1">
                           <button onClick={() => { downloadResultsCSV(); setShowExportMenu(false); }} className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-navy-700 text-navy-100' : 'hover:bg-gray-50 text-gray-900'}`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'} shrink-0`}>
                                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium">CSV Spreadsheet</span>
                                <span className={`text-[10px] ${theme === 'dark' ? 'text-navy-400' : 'text-gray-400'}`}>For Excel/Sheets</span>
                              </div>
                           </button>
                           <button onClick={() => { downloadResultsJSON(); setShowExportMenu(false); }} className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-navy-700 text-navy-100' : 'hover:bg-gray-50 text-gray-900'}`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-50'} shrink-0`}>
                                <Code className="w-4 h-4 text-amber-500" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium">JSON Data</span>
                                <span className={`text-[10px] ${theme === 'dark' ? 'text-navy-400' : 'text-gray-400'}`}>Raw structured data</span>
                              </div>
                           </button>
                           <button onClick={() => { downloadResultsText(); setShowExportMenu(false); }} className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-navy-700 text-navy-100' : 'hover:bg-gray-50 text-gray-900'}`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'} shrink-0`}>
                                <FileText className="w-4 h-4 text-blue-500" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium">Text Report</span>
                                <span className={`text-[10px] ${theme === 'dark' ? 'text-navy-400' : 'text-gray-400'}`}>Readable summary</span>
                              </div>
                           </button>
                         </div>
                      </div>
                    )}
                  </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <TokenUsageStats results={results} selectedProvider={selectedProvider} selectedGoogleModel={selectedGoogleModel} selectedGroqModel={selectedGroqModel} theme={theme} />
                  <BrandRecommendation results={results} theme={theme} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 animate-fade-in-up">
                <div className="relative mb-8">
                  <div className={`absolute inset-0 bg-primary-500/20 blur-xl rounded-full animate-pulse-glow`}></div>
                  <div className={`relative w-24 h-24 rounded-3xl ${theme === 'dark' ? 'bg-navy-800' : 'bg-white shadow-md'} border ${theme === 'dark' ? 'border-navy-700' : 'border-gray-100'} flex items-center justify-center transform hover:scale-105 transition-transform duration-300`}>
                    <Sparkles className="w-12 h-12 text-primary-500" />
                  </div>
                </div>
                
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Ready to Analyze
                </h2>
                
                <p className={`text-center max-w-md ${theme === 'dark' ? 'text-navy-300' : 'text-gray-600'} mb-8 leading-relaxed`}>
                  You haven't run any searches yet. Configure your brands and queries to see how AI models perceive your products.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl w-full mb-10">
                   <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-navy-800/50 border-navy-700' : 'bg-white border-gray-100 shadow-sm'} flex flex-col items-center text-center`}>
                      <Target className="w-6 h-6 text-accent-400 mb-2" />
                      <span className={`font-medium ${theme === 'dark' ? 'text-navy-100' : 'text-gray-800'}`}>Track Visibility</span>
                      <span className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} mt-1`}>See where you rank</span>
                   </div>
                   <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-navy-800/50 border-navy-700' : 'bg-white border-gray-100 shadow-sm'} flex flex-col items-center text-center`}>
                      <Users className="w-6 h-6 text-blue-400 mb-2" />
                      <span className={`font-medium ${theme === 'dark' ? 'text-navy-100' : 'text-gray-800'}`}>Monitor Rivals</span>
                      <span className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} mt-1`}>Keep an eye on competitors</span>
                   </div>
                   <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-navy-800/50 border-navy-700' : 'bg-white border-gray-100 shadow-sm'} flex flex-col items-center text-center`}>
                      <Brain className="w-6 h-6 text-emerald-400 mb-2" />
                      <span className={`font-medium ${theme === 'dark' ? 'text-navy-100' : 'text-gray-800'}`}>AI Sentiment</span>
                      <span className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} mt-1`}>Understand the narrative</span>
                   </div>
                </div>

                <button 
                  onClick={() => setActiveTab('config')} 
                  className="btn-primary flex items-center gap-2 group"
                >
                  <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /> 
                  Configure Search
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

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Leave Dashboard?"
        message="Are you sure you want to leave? You will be logged out of your current session."
        confirmLabel="Logout & Leave"
        theme={theme}
        variant="warning"
      />
    </div>
  );
}