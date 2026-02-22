import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  User,
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  LogOut,
  Shield,
  Calendar,
  Building2,
  Search,
  Palette,
  Layout,
  Check,
  Smartphone,
  Copy
} from 'lucide-react';
import type { UserBrand, UserIntent } from '../types';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000');

interface StoredAPIKey {
  id: number;
  provider: string;
  key_name: string | null;
  created_at: string;
  last_used_at: string | null;
}

interface ProfilePageProps {
  theme: string;
}

const PROVIDERS = [
  { value: 'google', label: 'Google Gemini' },
  { value: 'groq', label: 'Groq' },
];

const AVATAR_COLORS = [
  'bg-primary-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
];

const AVATAR_TEXT_COLORS: Record<string, string> = {
  'bg-primary-500': 'text-primary-500',
  'bg-blue-500': 'text-blue-500',
  'bg-green-500': 'text-green-500',
  'bg-amber-500': 'text-amber-500',
  'bg-purple-500': 'text-purple-500',
  'bg-rose-500': 'text-rose-500',
};

export default function ProfilePage({ theme }: ProfilePageProps) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Settings State (Local Storage for demo/premium feel)
  const [displayName, setDisplayName] = useState(user?.username || '');
  const [avatarColor, setAvatarColor] = useState(localStorage.getItem('user_avatar_color') || 'bg-primary-500');
  const [defaultView, setDefaultView] = useState(localStorage.getItem('default_view_mode') || 'wizard');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [apiKeys, setApiKeys] = useState<StoredAPIKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add key form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProvider, setNewProvider] = useState('google');
  const [newApiKey, setNewApiKey] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Brands & Intents state
  const [brands, setBrands] = useState<UserBrand[]>([]);
  const [intents, setIntents] = useState<UserIntent[]>([]);
  const [showAddBrandForm, setShowAddBrandForm] = useState(false);
  const [showAddIntentForm, setShowAddIntentForm] = useState(false);
  
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandIsMine, setNewBrandIsMine] = useState(true);
  
  const [newIntentAlias, setNewIntentAlias] = useState('');
  const [newIntentPrompt, setNewIntentPrompt] = useState('');

  // Fetch API keys on mount
  useEffect(() => {
    fetchApiKeys();
    fetchBrands();
    fetchIntents();
    if (user?.username) setDisplayName(user.username);
  }, [token, user]);

  const handleSaveProfile = async () => {
      setIsSavingProfile(true);
      setError('');
      setSuccess('');
      
      try {
          // Save local preferences
          localStorage.setItem('user_avatar_color', avatarColor);
          localStorage.setItem('default_view_mode', defaultView);

          // Update backend profile if changed
          if (displayName && displayName !== user?.username) {
              const res = await fetch(`${API_BASE_URL}/auth/me`, {
                  method: 'PUT',
                  headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}` 
                  },
                  body: JSON.stringify({ username: displayName })
              });

              if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.detail || "Failed to update profile");
              }
          }

          setSuccess('Profile updated successfully. Please reload to see changes globally.');
          setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
          setError(err.message || 'Failed to update profile');
      } finally {
          setIsSavingProfile(false);
      }
  };

  const fetchApiKeys = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/api-keys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      } else {
        setError('Failed to fetch API keys');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBrands = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/user/brands`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setBrands(await response.json());
      }
    } catch (err) {
      console.error('Failed to fetch brands', err);
    }
  };

  const fetchIntents = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/user/intents`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setIntents(await response.json());
      }
    } catch (err) {
      console.error('Failed to fetch intents', err);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newApiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: newProvider,
          api_key: newApiKey,
          key_name: newKeyName || null,
        }),
      });

      if (response.ok) {
        setSuccess('API key added successfully');
        setNewApiKey('');
        setNewKeyName('');
        setShowAddForm(false);
        await fetchApiKeys();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to add API key');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyKey = async (keyId: number, provider: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/api-keys/${keyId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.api_key) {
          await navigator.clipboard.writeText(data.api_key);
          setSuccess(`Copied ${provider} key to clipboard`);
          setTimeout(() => setSuccess(''), 3000);
        } else {
           setError('Key data not found');
        }
      } else {
        setError('Failed to fetch key for copying');
      }
    } catch (err) {
      setError('Failed to copy key');
    }
  };

  const handleDeleteKey = async (keyId: number) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess('API key deleted successfully');
        await fetchApiKeys();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to delete API key');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newBrandName.trim()) {
      setError('Please enter a brand name');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/brands`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand_name: newBrandName,
          is_mine: newBrandIsMine,
        }),
      });

      if (response.ok) {
        setSuccess('Brand added successfully');
        setNewBrandName('');
        setShowAddBrandForm(false);
        await fetchBrands();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to add brand');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrand = async (id: number) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/user/brands/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        await fetchBrands();
        setSuccess('Brand deleted successfully');
      } else {
        setError('Failed to delete brand');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  const handleAddIntent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newIntentAlias.trim() || !newIntentPrompt.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent_alias: newIntentAlias,
          prompt: newIntentPrompt,
        }),
      });

      if (response.ok) {
        setSuccess('Intent added successfully');
        setNewIntentAlias('');
        setNewIntentPrompt('');
        setShowAddIntentForm(false);
        await fetchIntents();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to add intent');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIntent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this intent?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/user/intents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        await fetchIntents();
        setSuccess('Intent deleted successfully');
      } else {
        setError('Failed to delete intent');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  const handleLogout = async () => {
    navigate('/', { replace: true });
    await logout();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const glassCardClass = theme === 'dark'
    ? 'glass-card'
    : 'glass-card-light';

  const inputClass = theme === 'dark'
    ? 'input-field'
    : 'input-field-light';

  const textClass = theme === 'dark' ? 'text-navy-100' : 'text-black';
  const mutedTextClass = theme === 'dark' ? 'text-navy-400' : 'text-slate-500';
  const bgClass = theme === 'dark' ? 'bg-navy-950' : 'light-mode-bg';
  const cardBgClass = theme === 'dark' ? 'bg-navy-900/50' : 'bg-white/50';

  return (
    <div className={`min-h-screen ${bgClass} px-4 py-8`}>
      <div className="max-w-4xl mx-auto">
        {/* Background gradient for light mode */}
        {theme === 'light' && (
          <div className="fixed inset-0 bg-slate-100/50 pointer-events-none -z-10" />
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/app"
            className={`inline-flex items-center gap-2 ${mutedTextClass} hover:text-primary-500 transition-colors font-medium`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <button
            onClick={handleLogout}
            className={`inline-flex items-center gap-2 ${mutedTextClass} hover:text-red-500 transition-colors font-medium`}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Profile Card */}
        <div className={`${glassCardClass} p-8 rounded-2xl mb-8 relative overflow-hidden group`}>
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <User className={`w-48 h-48 ${AVATAR_TEXT_COLORS[avatarColor] || 'text-primary-500'}`} />
           </div>
           
           <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className={`w-24 h-24 rounded-full ${avatarColor} flex items-center justify-center shadow-lg ring-4 ring-white/10`}>
                 <span className="text-3xl font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                 <h1 className={`text-3xl font-bold ${textClass} mb-2`}>{displayName}</h1>
                 <p className={mutedTextClass}>{user?.email}</p>
                 <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${theme === 'dark' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-100 text-green-700 border-green-200'}`}>
                       Active Member
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${theme === 'dark' ? 'bg-navy-800 border-navy-700 text-navy-300' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                       Free Tier
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl mb-6 flex items-start gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Personalization Section */}
        <div className={`${glassCardClass} p-6 rounded-2xl mb-8`}>
           <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-accent-500" />
              <h2 className={`text-xl font-semibold ${textClass}`}>Profile Customization</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Display Name */}
              <div>
                 <label className={`block text-sm font-medium ${textClass} mb-2`}>Display Name</label>
                 <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={inputClass}
                    placeholder="Enter your name"
                 />
              </div>

              {/* Avatar Color */}
              <div>
                 <label className={`block text-sm font-medium ${textClass} mb-2`}>Avatar Theme</label>
                 <div className="flex gap-3">
                    {AVATAR_COLORS.map(color => (
                       <button
                          key={color}
                          onClick={() => setAvatarColor(color)}
                          className={`w-8 h-8 rounded-full ${color} transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme === 'dark' ? 'focus:ring-offset-navy-900' : 'focus:ring-offset-white'} ${avatarColor === color ? 'ring-2 ring-white scale-110' : ''}`}
                       />
                    ))}
                 </div>
              </div>

              {/* Default View */}
              <div>
                 <label className={`block text-sm font-medium ${textClass} mb-2`}>Default View</label>
                 <div className="flex gap-4">
                    <button
                       onClick={() => setDefaultView('wizard')}
                       className={`flex-1 p-3 rounded-xl border flex items-center gap-3 transition-all ${
                          defaultView === 'wizard'
                            ? (theme === 'dark' ? 'bg-primary-500/20 border-primary-500 text-primary-300' : 'bg-primary-50 border-primary-500 text-primary-700')
                            : (theme === 'dark' ? 'bg-navy-800/50 border-navy-700 hover:border-navy-600' : 'bg-white border-gray-200 hover:bg-gray-50')
                       }`}
                    >
                       <Layout className="w-5 h-5" />
                       <span className="font-medium">Wizard</span>
                    </button>
                    <button
                       onClick={() => setDefaultView('classic')}
                       className={`flex-1 p-3 rounded-xl border flex items-center gap-3 transition-all ${
                          defaultView === 'classic'
                            ? (theme === 'dark' ? 'bg-primary-500/20 border-primary-500 text-primary-300' : 'bg-primary-50 border-primary-500 text-primary-700')
                            : (theme === 'dark' ? 'bg-navy-800/50 border-navy-700 hover:border-navy-600' : 'bg-white border-gray-200 hover:bg-gray-50')
                       }`}
                    >
                       <Smartphone className="w-5 h-5" />
                       <span className="font-medium">Classic</span>
                    </button>
                 </div>
              </div>
           </div>

           <div className="mt-8 flex justify-end">
              <button 
                 onClick={handleSaveProfile} 
                 disabled={isSavingProfile}
                 className="btn-primary flex items-center gap-2"
              >
                 {isSavingProfile ? (
                    <>
                       <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                       Saving...
                    </>
                 ) : (
                    <>
                       <Check className="w-4 h-4" />
                       Save Preferences
                    </>
                 )}
              </button>
           </div>
        </div>

        {/* API Keys Section */}
        <div className={`${glassCardClass} p-6 rounded-2xl mb-8`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Key className="w-6 h-6 text-primary-500" />
              <h2 className={`text-xl font-semibold ${textClass}`}>API Keys</h2>
            </div>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Key
              </button>
            )}
          </div>

          <p className={`${mutedTextClass} mb-6`}>
            Store your LLM provider API keys securely. Keys are encrypted before storage and never exposed.
          </p>

          {/* Add Key Form */}
          {showAddForm && (
            <form onSubmit={handleAddKey} className={`${cardBgClass} p-4 rounded-xl mb-6 border border-navy-700/50`}>
              <h3 className={`font-medium ${textClass} mb-4`}>Add New API Key</h3>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${textClass} mb-2`}>
                      Provider
                    </label>
                    <select
                      value={newProvider}
                      onChange={(e) => setNewProvider(e.target.value)}
                      className={inputClass}
                      disabled={isSubmitting}
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${textClass} mb-2`}>
                      Key Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production"
                      className={inputClass}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textClass} mb-2`}>
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showNewKey ? 'text' : 'password'}
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      placeholder="Paste your API key here"
                      className={`${inputClass} pr-12`}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewKey(!showNewKey)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${mutedTextClass} hover:text-primary-500 transition-colors`}
                    >
                      {showNewKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Save Key
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewApiKey('');
                      setNewKeyName('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* API Keys List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className={`text-center py-12 ${mutedTextClass}`}>
              <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No API keys stored yet</p>
              <p className="text-sm mt-1">Add your first API key to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className={`${cardBgClass} p-4 rounded-xl border border-navy-700/50 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                      <Key className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <div className={`font-medium ${textClass}`}>
                        {PROVIDERS.find((p) => p.value === key.provider)?.label || key.provider}
                        {key.key_name && (
                          <span className={`ml-2 text-sm ${mutedTextClass}`}>({key.key_name})</span>
                        )}
                      </div>
                      <div className={`text-sm ${mutedTextClass}`}>
                        Added {formatDate(key.created_at)}
                        {key.last_used_at && ` • Last used ${formatDate(key.last_used_at)}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyKey(key.id, key.provider)}
                      className={`p-2 rounded-lg ${mutedTextClass} hover:text-primary-500 hover:bg-primary-500/10 transition-colors`}
                      title="Copy key"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      className={`p-2 rounded-lg ${mutedTextClass} hover:text-red-500 hover:bg-red-500/10 transition-colors`}
                      title="Delete key"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Brands Section */}
        <div className={`${glassCardClass} p-6 rounded-2xl mb-8`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-primary-500" />
              <h2 className={`text-xl font-semibold ${textClass}`}>Brands & Competitors</h2>
            </div>
            {!showAddBrandForm && (
              <button
                onClick={() => setShowAddBrandForm(true)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Brand
              </button>
            )}
          </div>

          {/* Add Brand Form */}
          {showAddBrandForm && (
            <form onSubmit={handleAddBrand} className={`${cardBgClass} p-4 rounded-xl mb-6 border border-navy-700/50`}>
              <h3 className={`font-medium ${textClass} mb-4`}>Add New Brand</h3>
              <div className="grid gap-4">
                <div>
                  <label className={`block text-sm font-medium ${textClass} mb-2`}>Brand Name</label>
                  <input
                    type="text"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="e.g., My Company Inc."
                    className={inputClass}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${textClass} mb-2`}>Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={newBrandIsMine}
                        onChange={() => setNewBrandIsMine(true)}
                        className="form-radio text-primary-500"
                        disabled={isSubmitting}
                      />
                      <span className={textClass}>My Brand</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!newBrandIsMine}
                        onChange={() => setNewBrandIsMine(false)}
                        className="form-radio text-primary-500"
                        disabled={isSubmitting}
                      />
                      <span className={textClass}>Competitor</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                    {isSubmitting ? 'Saving...' : 'Save Brand'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddBrandForm(false); setNewBrandName(''); }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Brands List */}
          <div className="space-y-3">
            {brands.map((brand) => (
              <div key={brand.id} className={`${cardBgClass} p-4 rounded-xl border border-navy-700/50 flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${brand.is_mine ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                    <Building2 className={`w-5 h-5 ${brand.is_mine ? 'text-green-500' : 'text-orange-500'}`} />
                  </div>
                  <div>
                    <div className={`font-medium ${textClass}`}>{brand.brand_name}</div>
                    <div className={`text-sm ${mutedTextClass}`}>{brand.is_mine ? 'My Brand' : 'Competitor'}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBrand(brand.id)}
                  className={`p-2 rounded-lg ${mutedTextClass} hover:text-red-500 hover:bg-red-500/10 transition-colors`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {brands.length === 0 && <p className={`text-center py-6 ${mutedTextClass}`}>No brands added yet.</p>}
          </div>
        </div>

        {/* Intents Section */}
        <div className={`${glassCardClass} p-6 rounded-2xl mb-8`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Search className="w-6 h-6 text-primary-500" />
              <h2 className={`text-xl font-semibold ${textClass}`}>Search Intents</h2>
            </div>
            {!showAddIntentForm && (
              <button
                onClick={() => setShowAddIntentForm(true)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Intent
              </button>
            )}
          </div>

          {/* Add Intent Form */}
          {showAddIntentForm && (
            <form onSubmit={handleAddIntent} className={`${cardBgClass} p-4 rounded-xl mb-6 border border-navy-700/50`}>
              <h3 className={`font-medium ${textClass} mb-4`}>Add New Intent</h3>
              <div className="grid gap-4">
                <div>
                  <label className={`block text-sm font-medium ${textClass} mb-2`}>Alias (ID)</label>
                  <input
                    type="text"
                    value={newIntentAlias}
                    onChange={(e) => setNewIntentAlias(e.target.value)}
                    placeholder="e.g., best-email-tools"
                    className={inputClass}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${textClass} mb-2`}>Prompt</label>
                  <textarea
                    value={newIntentPrompt}
                    onChange={(e) => setNewIntentPrompt(e.target.value)}
                    placeholder="What are the best tools for..."
                    className={`${inputClass} min-h-[100px]`}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                    {isSubmitting ? 'Saving...' : 'Save Intent'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddIntentForm(false); setNewIntentAlias(''); setNewIntentPrompt(''); }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Intents List */}
          <div className="space-y-3">
            {intents.map((intent) => (
              <div key={intent.id} className={`${cardBgClass} p-4 rounded-xl border border-navy-700/50 flex items-center justify-between`}>
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Search className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${textClass}`}>{intent.intent_alias}</div>
                    <div className={`text-sm ${mutedTextClass} line-clamp-2`}>{intent.prompt}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteIntent(intent.id)}
                  className={`p-2 rounded-lg ${mutedTextClass} hover:text-red-500 hover:bg-red-500/10 transition-colors`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {intents.length === 0 && <p className={`text-center py-6 ${mutedTextClass}`}>No intents added yet.</p>}
          </div>
        </div>

        {/* Security Note */}
        <div className={`mt-6 p-4 rounded-xl border ${theme === 'dark' ? 'border-navy-700/50 bg-navy-900/30' : 'border-slate-200 bg-slate-100/50'}`}>
          <div className="flex items-start gap-3">
            <Shield className={`w-5 h-5 ${mutedTextClass} flex-shrink-0 mt-0.5`} />
            <div className={`text-sm ${mutedTextClass}`}>
              <p className="font-medium mb-1 text-black dark:text-navy-300">Security Note</p>
              <p>
                Your API keys are encrypted using AES-256 before storage and are never exposed in API responses.
                Only you can decrypt and use your keys through authenticated requests.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}