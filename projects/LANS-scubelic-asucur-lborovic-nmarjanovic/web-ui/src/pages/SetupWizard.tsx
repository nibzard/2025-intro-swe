import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Eye,
  EyeOff,
  Plus,
  X,
  Sparkles,
  Zap,
  Building2,
  Users,
  Search,
  AlertCircle,
  HelpCircle,
  Save,
  Loader2,
  CheckCircle2,
  Edit2,
  MessageSquare,
  ArrowRight,
  FastForward
} from 'lucide-react';
import { GEMINI_MODELS, GROQ_MODELS, INTENT_TEMPLATES } from '../types';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000');

// Step definitions
const STEPS = [
  { id: 'welcome', name: 'Welcome', description: 'Quick Setup Guide' },
  { id: 'provider', name: 'Provider', description: 'Select AI Provider' },
  { id: 'api-keys', name: 'API Keys', description: 'Connect Accounts' },
  { id: 'brands', name: 'Brands', description: 'Your Identity' },
  { id: 'competitors', name: 'Competitors', description: 'Rival Brands' },
  { id: 'queries', name: 'Queries', description: 'Search Intents' },
  { id: 'review', name: 'Finish', description: 'Review & Confirm' },
];

interface SetupWizardProps {
  theme: string;
}

// Wizard state interface
interface WizardState {
  selectedProvider: 'google' | 'groq' | 'both';
  googleApiKey: string;
  groqApiKey: string;
  googleKeyName: string;
  groqKeyName: string;
  selectedGoogleModel: string;
  selectedGroqModel: string;
  brands: string[];
  competitors: string[];
  queries: Array<{ id: string; prompt: string }>;
}

// Local storage key for auto-save
const STORAGE_KEY = 'llm-watcher-setup-wizard';

export default function SetupWizard({ theme }: SetupWizardProps) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  // Current step (0-indexed)
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password visibility
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);

  // Wizard state
  const [state, setState] = useState<WizardState>({
    selectedProvider: 'google',
    googleApiKey: '',
    groqApiKey: '',
    googleKeyName: '',
    groqKeyName: '',
    selectedGoogleModel: GEMINI_MODELS[0].id,
    selectedGroqModel: GROQ_MODELS[0].id,
    brands: [''],
    competitors: [''],
    queries: [{ id: '', prompt: '' }],
  });

  // Load saved state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Don't restore API keys for security
        setState(prev => ({
          ...prev,
          ...parsed,
          googleApiKey: '',
          groqApiKey: '',
        }));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Auto-save state (except API keys)
  useEffect(() => {
    const toSave = {
      ...state,
      googleApiKey: '', // Don't save API keys
      groqApiKey: '',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [state]);

  // Update state helper
  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
    setErrors({}); // Clear errors on change
  }, []);

  // Validate current step
  const validateStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    switch (STEPS[currentStep].id) {
      case 'provider':
        // No validation needed - always has a default
        break;

      case 'api-keys':
        if (state.selectedProvider === 'google' || state.selectedProvider === 'both') {
          if (!state.googleApiKey.trim()) {
            newErrors.googleApiKey = 'Google API key is required';
          } else if (state.googleApiKey.trim().length < 10) {
            newErrors.googleApiKey = 'Invalid API key format';
          }
        }
        if (state.selectedProvider === 'groq' || state.selectedProvider === 'both') {
          if (!state.groqApiKey.trim()) {
            newErrors.groqApiKey = 'Groq API key is required';
          } else if (state.groqApiKey.trim().length < 10) {
            newErrors.groqApiKey = 'Invalid API key format';
          }
        }
        break;

      case 'brands':
        const validBrands = state.brands.filter(b => b.trim());
        if (validBrands.length === 0) {
          newErrors.brands = 'Add at least one brand to track';
        }
        break;

      case 'competitors':
        // Competitors are optional, no validation needed
        break;

      case 'queries':
        const validQueries = state.queries.filter(q => q.id.trim() && q.prompt.trim());
        if (validQueries.length === 0) {
          newErrors.queries = 'Add at least one search query';
        }
        // Check for empty fields in partially filled queries
        state.queries.forEach((q, i) => {
          if (q.id.trim() && !q.prompt.trim()) {
            newErrors[`query_${i}_prompt`] = 'Prompt is required';
          }
          if (!q.id.trim() && q.prompt.trim()) {
            newErrors[`query_${i}_id`] = 'ID is required';
          }
        });
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, state]);

  // Navigation handlers
  const goNext = useCallback(() => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  }, [validateStep]);

  const goBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    // Only allow going to previous steps or current step
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    navigate('/app');
  }, [navigate]);

  // Final submission
  const handleSubmit = useCallback(async () => {
    if (!token) {
      setErrors({ submit: 'Please log in to complete setup' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Save API keys
      if (state.selectedProvider === 'google' || state.selectedProvider === 'both') {
        await fetch(`${API_BASE_URL}/auth/api-keys`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider: 'google',
            api_key: state.googleApiKey,
            key_name: state.googleKeyName || 'Default',
          }),
        });
      }

      if (state.selectedProvider === 'groq' || state.selectedProvider === 'both') {
        await fetch(`${API_BASE_URL}/auth/api-keys`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider: 'groq',
            api_key: state.groqApiKey,
            key_name: state.groqKeyName || 'Default',
          }),
        });
      }

      // Save brands
      for (const brand of state.brands.filter(b => b.trim())) {
        await fetch(`${API_BASE_URL}/user/brands`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            brand_name: brand.trim(),
            is_mine: true,
          }),
        });
      }

      // Save competitors
      for (const competitor of state.competitors.filter(c => c.trim())) {
        await fetch(`${API_BASE_URL}/user/brands`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            brand_name: competitor.trim(),
            is_mine: false,
          }),
        });
      }

      // Save intents/queries
      for (const query of state.queries.filter(q => q.id.trim() && q.prompt.trim())) {
        await fetch(`${API_BASE_URL}/user/intents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            intent_alias: query.id.trim(),
            prompt: query.prompt.trim(),
          }),
        });
      }

      // Clear saved wizard state
      localStorage.removeItem(STORAGE_KEY);

      // Show success
      setShowSuccess(true);

    } catch (err) {
      setErrors({ submit: 'Failed to save configuration. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [token, state]);

  // Brand/Competitor/Query list handlers
  const addBrand = () => updateState({ brands: [...state.brands, ''] });
  const removeBrand = (index: number) => {
    if (state.brands.length > 1) {
      updateState({ brands: state.brands.filter((_, i) => i !== index) });
    }
  };
  const updateBrand = (index: number, value: string) => {
    const updated = [...state.brands];
    updated[index] = value;
    updateState({ brands: updated });
  };

  const addCompetitor = () => updateState({ competitors: [...state.competitors, ''] });
  const removeCompetitor = (index: number) => {
    if (state.competitors.length > 1) {
      updateState({ competitors: state.competitors.filter((_, i) => i !== index) });
    }
  };
  const updateCompetitor = (index: number, value: string) => {
    const updated = [...state.competitors];
    updated[index] = value;
    updateState({ competitors: updated });
  };

  const addQuery = () => updateState({ queries: [...state.queries, { id: '', prompt: '' }] });
  const removeQuery = (index: number) => {
    if (state.queries.length > 1) {
      updateState({ queries: state.queries.filter((_, i) => i !== index) });
    }
  };
  const updateQuery = (index: number, field: 'id' | 'prompt', value: string) => {
    const updated = [...state.queries];
    updated[index] = { ...updated[index], [field]: value };
    updateState({ queries: updated });
  };

  // Quick Query Template Logic
  const applyTemplate = (templateId: string) => {
    const template = INTENT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    // Replace placeholders
    let prompt = template.prompt;
    const activeBrands = state.brands.filter(b => b.trim());
    const activeCompetitors = state.competitors.filter(c => c.trim());
    
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
    
    // Check if we should append or replace the first empty slot
    const newQueries = [...state.queries];
    if (newQueries.length === 1 && !newQueries[0].id && !newQueries[0].prompt) {
        newQueries[0] = { id: template.id, prompt };
    } else {
        newQueries.push({ id: template.id, prompt });
    }
    
    updateState({ queries: newQueries });
    showToast(`Added "${template.label}"`, 'info');
  };


  // Style helpers
  const cardClass = isDark ? 'glass-card border-navy-700/50' : 'glass-card-light shadow-lg';
  const inputClass = isDark ? 'input-field' : 'input-field-light';
  const labelClass = isDark ? 'label' : 'label-light';
  const textClass = isDark ? 'text-navy-100' : 'text-slate-900';
  const mutedClass = isDark ? 'text-navy-400' : 'text-slate-500';
  const btnSecondary = isDark ? 'btn-secondary' : 'btn-secondary-light';
  
  // Polished "Add" button class
  const addBtnClass = `
    w-full py-3.5 rounded-xl border-2 border-dashed transition-all duration-200 
    flex items-center justify-center gap-2 font-medium group
    ${isDark 
      ? 'border-navy-700 bg-navy-800/20 text-navy-400 hover:border-primary-500/50 hover:bg-primary-500/5 hover:text-primary-400' 
      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-primary-500/50 hover:bg-primary-500/5 hover:text-primary-600 shadow-sm'}
  `;

  // Success screen
  if (showSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-navy-950' : 'light-mode-bg'}`}>
        <div className={`${cardClass} p-12 max-w-lg w-full text-center animate-fade-in-up`}>
          <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-8 animate-scale-in">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h1 className={`text-3xl font-bold ${textClass} mb-4`}>
            All Set!
          </h1>
          <p className={`${mutedClass} mb-10 text-lg`}>
            Your configuration is saved. You're ready to start monitoring your brand's AI presence.
          </p>
          <button
            onClick={() => navigate('/app')}
            className="btn-primary w-full py-4 text-lg"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5 ml-2 inline" />
          </button>
        </div>
      </div>
    );
  }

  // Render step content
  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center py-12 px-4">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary-500/20">
              <Search className="w-12 h-12 text-white" />
            </div>
            <h2 className={`text-4xl font-bold ${textClass} mb-6 tracking-tight`}>
              Welcome to LLM Answer Watcher
            </h2>
            <p className={`${mutedClass} max-w-xl mx-auto mb-10 text-lg leading-relaxed`}>
              We'll help you track how AI models (like Gemini & Llama) answer questions about your brand vs. competitors.
            </p>
            <div className={`${cardClass} p-8 max-w-md mx-auto text-left`}>
              <h3 className={`font-semibold ${textClass} mb-4 flex items-center gap-2`}>
                <Sparkles className="w-5 h-5 text-primary-500" /> Setup in 2 minutes:
              </h3>
              <ul className="space-y-4">
                {[
                  'Connect AI Provider (Google/Groq)',
                  'Define your Brand & Competitors',
                  'Set up Search Queries',
                ].map((item, i) => (
                  <li key={i} className={`flex items-center gap-3 ${mutedClass}`}>
                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                       <Check className="w-3.5 h-3.5 text-green-500" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'provider':
        return (
          <div className="max-w-3xl mx-auto px-4">
            <h2 className={`text-2xl font-bold ${textClass} mb-3 text-center`}>
              Choose Your AI Provider
            </h2>
            <p className={`${mutedClass} mb-8 text-center max-w-xl mx-auto`}>
              Select which AI models will be used to analyze your brand's presence.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Google Gemini */}
              <button
                onClick={() => updateState({ selectedProvider: 'google' })}
                className={`${cardClass} p-6 text-left transition-all hover:scale-[1.02] ${
                  state.selectedProvider === 'google'
                    ? 'ring-2 ring-primary-500 border-primary-500'
                    : 'opacity-80 hover:opacity-100'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                  state.selectedProvider === 'google'
                    ? 'bg-primary-500/20'
                    : isDark ? 'bg-navy-800' : 'bg-slate-100'
                }`}>
                  <Sparkles className={`w-8 h-8 ${
                    state.selectedProvider === 'google' ? 'text-primary-500' : mutedClass
                  }`} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`font-bold text-lg ${textClass}`}>Google Gemini</span>
                  <CheckCircle2 className={`w-5 h-5 text-primary-500 transition-opacity ${
                    state.selectedProvider === 'google' ? 'opacity-100' : 'opacity-0'
                  }`} />
                </div>
                <p className={`text-sm ${mutedClass}`}>
                  Includes web search grounding. Best for real-time accuracy.
                </p>
              </button>

              {/* Groq */}
              <button
                onClick={() => updateState({ selectedProvider: 'groq' })}
                className={`${cardClass} p-6 text-left transition-all hover:scale-[1.02] ${
                  state.selectedProvider === 'groq'
                    ? 'ring-2 ring-primary-500 border-primary-500'
                    : 'opacity-80 hover:opacity-100'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                  state.selectedProvider === 'groq'
                    ? 'bg-primary-500/20'
                    : isDark ? 'bg-navy-800' : 'bg-slate-100'
                }`}>
                  <Zap className={`w-8 h-8 ${
                    state.selectedProvider === 'groq' ? 'text-primary-500' : mutedClass
                  }`} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`font-bold text-lg ${textClass}`}>Groq</span>
                  <CheckCircle2 className={`w-5 h-5 text-primary-500 transition-opacity ${
                    state.selectedProvider === 'groq' ? 'opacity-100' : 'opacity-0'
                  }`} />
                </div>
                <p className={`text-sm ${mutedClass}`}>
                  Ultra-fast Llama 3 models. Great for high volume analysis.
                </p>
              </button>

              {/* Both */}
              <button
                onClick={() => updateState({ selectedProvider: 'both' })}
                className={`${cardClass} p-6 text-left transition-all hover:scale-[1.02] ${
                  state.selectedProvider === 'both'
                    ? 'ring-2 ring-accent-500 border-accent-500'
                    : 'opacity-80 hover:opacity-100'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                  state.selectedProvider === 'both'
                    ? 'bg-accent-500/20'
                    : isDark ? 'bg-navy-800' : 'bg-slate-100'
                }`}>
                  <Users className={`w-8 h-8 ${
                    state.selectedProvider === 'both' ? 'text-accent-500' : mutedClass
                  }`} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`font-bold text-lg ${textClass}`}>Use Both</span>
                  <CheckCircle2 className={`w-5 h-5 text-accent-500 transition-opacity ${
                    state.selectedProvider === 'both' ? 'opacity-100' : 'opacity-0'
                  }`} />
                </div>
                <p className={`text-sm ${mutedClass}`}>
                  Compare results side-by-side. The most comprehensive option.
                </p>
              </button>
            </div>
          </div>
        );

      case 'api-keys':
        return (
          <div className="max-w-2xl mx-auto px-4">
             <div className="text-center mb-8">
              <h2 className={`text-2xl font-bold ${textClass} mb-2`}>
                Connect Your Accounts
              </h2>
              <p className={`${mutedClass}`}>
                Enter your API keys. They are stored locally and encrypted.
              </p>
             </div>

            <div className="space-y-6">
              {/* Google Gemini API Key */}
              {(state.selectedProvider === 'google' || state.selectedProvider === 'both') && (
                <div className={`${cardClass} p-6`}>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100/10">
                    <div className="p-2 rounded-lg bg-primary-500/10">
                      <Sparkles className="w-6 h-6 text-primary-500" />
                    </div>
                    <span className={`font-bold text-lg ${textClass}`}>Google Gemini</span>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>
                        API Key <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showGoogleKey ? 'text' : 'password'}
                          value={state.googleApiKey}
                          onChange={(e) => updateState({ googleApiKey: e.target.value })}
                          placeholder="AIza..."
                          className={`${inputClass} pr-12 ${errors.googleApiKey ? 'border-red-500 focus:border-red-500' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowGoogleKey(!showGoogleKey)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${mutedClass} hover:text-primary-500 p-2`}
                        >
                          {showGoogleKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.googleApiKey && (
                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.googleApiKey}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-navy-900/50' : 'bg-slate-50'} flex items-center justify-between`}>
                    <span className={`text-xs ${mutedClass}`}>Don't have a key?</span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary-500 hover:underline flex items-center gap-1"
                    >
                      Get one from Google AI Studio <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Groq API Key */}
              {(state.selectedProvider === 'groq' || state.selectedProvider === 'both') && (
                <div className={`${cardClass} p-6`}>
                   <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100/10">
                    <div className="p-2 rounded-lg bg-accent-500/10">
                      <Zap className="w-6 h-6 text-accent-500" />
                    </div>
                    <span className={`font-bold text-lg ${textClass}`}>Groq</span>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>
                        API Key <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showGroqKey ? 'text' : 'password'}
                          value={state.groqApiKey}
                          onChange={(e) => updateState({ groqApiKey: e.target.value })}
                          placeholder="gsk_..."
                          className={`${inputClass} pr-12 ${errors.groqApiKey ? 'border-red-500 focus:border-red-500' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowGroqKey(!showGroqKey)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${mutedClass} hover:text-primary-500 p-2`}
                        >
                          {showGroqKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.groqApiKey && (
                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.groqApiKey}
                        </p>
                      )}
                    </div>
                  </div>
                   <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-navy-900/50' : 'bg-slate-50'} flex items-center justify-between`}>
                    <span className={`text-xs ${mutedClass}`}>Don't have a key?</span>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary-500 hover:underline flex items-center gap-1"
                    >
                      Get one from Groq Console <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'brands':
        return (
          <div className="max-w-2xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className={`text-2xl font-bold ${textClass} mb-2`}>
                Your Brand Identity
              </h2>
              <p className={`${mutedClass}`}>
                What brand names or products should we look for in AI responses?
              </p>
            </div>

            <div className={`${cardClass} p-8`}>
              <div className="space-y-4">
                {state.brands.map((brand, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => updateBrand(index, e.target.value)}
                        placeholder={index === 0 ? 'e.g., Acme Corp' : 'Another brand name...'}
                        className={inputClass}
                        autoFocus={index === state.brands.length - 1 && index > 0}
                      />
                    </div>
                    {state.brands.length > 1 && (
                      <button
                        onClick={() => removeBrand(index)}
                        className={`p-3 rounded-xl ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'} text-red-400 transition-colors`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {errors.brands && (
                <p className="text-red-400 text-sm mt-4 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.brands}
                </p>
              )}

              <button
                onClick={addBrand}
                className={`${addBtnClass} mt-[10px]`}
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                Add Another Brand Variant
              </button>
            </div>
          </div>
        );

      case 'competitors':
        return (
           <div className="max-w-2xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className={`text-2xl font-bold ${textClass} mb-2`}>
                Identify Competitors
              </h2>
              <p className={`${mutedClass}`}>
                Who are you up against? We'll track their visibility too.
              </p>
            </div>

             <div className={`${cardClass} p-8`}>
              <div className="space-y-4">
                {state.competitors.map((competitor, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={competitor}
                        onChange={(e) => updateCompetitor(index, e.target.value)}
                        placeholder={index === 0 ? 'e.g., Competitor Inc' : 'Another competitor...'}
                        className={inputClass}
                         autoFocus={index === state.competitors.length - 1 && index > 0}
                      />
                    </div>
                    {state.competitors.length > 1 && (
                      <button
                        onClick={() => removeCompetitor(index)}
                        className={`p-3 rounded-xl ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'} text-red-400 transition-colors`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addCompetitor}
                className={addBtnClass}
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                Add Another Competitor
              </button>

              <p className={`text-sm ${mutedClass} mt-6 text-center italic`}>
                Optional. You can add these later.
              </p>
            </div>
          </div>
        );

      case 'queries':
        return (
           <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className={`text-2xl font-bold ${textClass} mb-2`}>
                Search Queries (Intents)
              </h2>
              <p className={`${mutedClass}`}>
                What questions would your potential customers ask AI?
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Templates Column */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-2 px-1">
                    <Sparkles className="w-4 h-4 text-primary-500" />
                    <span className={`text-sm font-semibold ${textClass} uppercase tracking-wider`}>Quick Templates</span>
                 </div>
                 {INTENT_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all hover:scale-[1.02] group ${
                        isDark 
                          ? 'bg-navy-800/30 border-navy-700 hover:bg-navy-800/50 hover:border-primary-500/50' 
                          : 'bg-white border-slate-200 hover:border-primary-500/50 shadow-sm'
                      }`}
                    >
                       <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium ${textClass} group-hover:text-primary-500 transition-colors`}>{template.label}</span>
                          <Plus className={`w-4 h-4 ${mutedClass} group-hover:text-primary-500`} />
                       </div>
                       <p className={`text-xs ${mutedClass} line-clamp-2`}>
                          {template.prompt}
                       </p>
                    </button>
                 ))}
              </div>

              {/* Queries List Column */}
              <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <MessageSquare className="w-4 h-4 text-primary-500" />
                    <span className={`text-sm font-semibold ${textClass} uppercase tracking-wider`}>Your Queries</span>
                 </div>
                 
                 {state.queries.map((query, index) => (
                  <div key={index} className={`${cardClass} p-5 relative group`}>
                     <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-1/3">
                              <label className={`text-xs uppercase font-bold tracking-wider mb-1 block ${mutedClass}`}>ID</label>
                              <input
                                type="text"
                                value={query.id}
                                onChange={(e) => updateQuery(index, 'id', e.target.value)}
                                placeholder="e.g. pricing"
                                className={`${inputClass} text-sm`}
                              />
                            </div>
                            <div className="flex-1">
                               <label className={`text-xs uppercase font-bold tracking-wider mb-1 block ${mutedClass}`}>Prompt</label>
                               <textarea
                                  value={query.prompt}
                                  onChange={(e) => updateQuery(index, 'prompt', e.target.value)}
                                  placeholder="Enter your question here..."
                                  rows={2}
                                  className={`${inputClass} resize-none text-sm`}
                                />
                            </div>
                        </div>
                     </div>
                     {state.queries.length > 1 && (
                        <button
                          onClick={() => removeQuery(index)}
                          className={`absolute -right-2 -top-2 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all ${
                            isDark ? 'bg-navy-700 text-red-400 hover:bg-navy-600' : 'bg-white text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                  </div>
                 ))}
                 
                 <button
                    onClick={addQuery}
                    className={addBtnClass}
                  >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                    Add Custom Query
                  </button>
                  
                  {errors.queries && (
                    <p className="text-red-400 text-sm text-center flex items-center justify-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.queries}
                    </p>
                  )}
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="max-w-3xl mx-auto px-4">
             <div className="text-center mb-8">
              <h2 className={`text-2xl font-bold ${textClass} mb-2`}>
                Ready to Launch
              </h2>
              <p className={`${mutedClass}`}>
                Review your configuration before finishing setup.
              </p>
            </div>

            <div className="grid gap-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`${cardClass} p-6 flex flex-col items-center text-center`}>
                      <Sparkles className="w-8 h-8 text-primary-500 mb-3" />
                      <h3 className={`font-bold ${textClass}`}>Provider</h3>
                      <p className={mutedClass}>
                         {state.selectedProvider === 'both' ? 'Google + Groq' : state.selectedProvider === 'google' ? 'Google Gemini' : 'Groq'}
                      </p>
                      <button onClick={() => goToStep(1)} className="text-xs text-primary-500 hover:underline mt-2">Edit</button>
                  </div>
                  
                  <div className={`${cardClass} p-6 flex flex-col items-center text-center`}>
                      <Building2 className="w-8 h-8 text-accent-500 mb-3" />
                      <h3 className={`font-bold ${textClass}`}>Brands</h3>
                      <div className="flex flex-wrap justify-center gap-1 mt-1">
                         {state.brands.filter(b => b.trim()).map((b, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-500">{b}</span>
                         ))}
                      </div>
                      <button onClick={() => goToStep(3)} className="text-xs text-primary-500 hover:underline mt-2">Edit</button>
                  </div>
              </div>
              
              <div className={`${cardClass} p-6`}>
                 <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-bold ${textClass} flex items-center gap-2`}>
                       <Search className="w-5 h-5 text-blue-500" /> Queries Configured
                    </h3>
                    <button onClick={() => goToStep(5)} className="text-xs text-primary-500 hover:underline">Edit</button>
                 </div>
                 <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {state.queries.filter(q => q.id.trim() && q.prompt.trim()).map((q, i) => (
                       <div key={i} className={`p-3 rounded-lg flex gap-3 ${isDark ? 'bg-navy-900/50' : 'bg-slate-50'}`}>
                          <span className={`text-xs font-mono px-2 py-1 rounded h-fit ${isDark ? 'bg-navy-800 text-navy-300' : 'bg-white text-slate-500'}`}>{q.id}</span>
                          <span className={`text-sm ${textClass}`}>{q.prompt}</span>
                       </div>
                    ))}
                 </div>
              </div>
            </div>
            
             {errors.submit && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mt-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errors.submit}</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-navy-950' : 'light-mode-bg'} flex flex-col`}>
      {/* Top Navigation Bar */}
      <header className={`sticky top-0 z-40 border-b ${isDark ? 'border-navy-800/50 bg-navy-950/80' : 'border-slate-200 bg-white/80'} backdrop-blur-xl`}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
              <span className={`font-bold ${textClass} tracking-tight`}>Setup Wizard</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
               <span className={mutedClass}>Step {currentStep + 1} of {STEPS.length}</span>
               <div className={`w-32 h-2 rounded-full overflow-hidden ${isDark ? 'bg-navy-800' : 'bg-slate-200'}`}>
                  <div 
                     className="h-full bg-primary-500 transition-all duration-500 ease-out"
                     style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                  />
               </div>
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
         <div className="flex-1 flex flex-col justify-center py-12">
            {renderStepContent()}
         </div>
      </main>

      {/* Footer Controls */}
      <footer className={`sticky bottom-0 border-t ${isDark ? 'border-navy-800/50 bg-navy-950/90' : 'border-slate-200 bg-white/90'} backdrop-blur-xl`}>
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSkip}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  isDark ? 'text-navy-400 hover:text-navy-100 hover:bg-navy-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FastForward className="w-4 h-4" />
                Skip Setup
              </button>
              
              <div className={`w-px h-6 ${isDark ? 'bg-navy-800' : 'bg-slate-200'}`} />
              
              <button
                onClick={goBack}
                disabled={currentStep === 0}
                className={`px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                  currentStep === 0 
                  ? 'opacity-0 pointer-events-none' 
                  : isDark ? 'text-navy-300 hover:bg-navy-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            </div>

            {currentStep === STEPS.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary px-8 py-3 text-base shadow-lg shadow-primary-500/20 flex items-center justify-center whitespace-nowrap"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Finishing Up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={goNext}
                className="btn-primary px-8 py-3 text-base shadow-lg shadow-primary-500/20 flex items-center justify-center whitespace-nowrap"
              >
                {currentStep === 0 ? "Start Setup" : 'Continue'}
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            )}
        </div>
      </footer>
    </div>
  );
}
