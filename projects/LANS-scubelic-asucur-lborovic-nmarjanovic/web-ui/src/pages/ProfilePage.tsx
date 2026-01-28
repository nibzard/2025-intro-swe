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
} from 'lucide-react';

// API base URL - same pattern as Dashboard
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
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'perplexity', label: 'Perplexity' },
  { value: 'grok', label: 'Grok' },
];

export default function ProfilePage({ theme }: ProfilePageProps) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

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

  // Fetch API keys on mount
  useEffect(() => {
    fetchApiKeys();
  }, [token]);

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
    : 'bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm';

  const inputClass = theme === 'dark'
    ? 'input-field'
    : 'input-field bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500';

  const textClass = theme === 'dark' ? 'text-navy-100' : 'text-gray-900';
  const mutedTextClass = theme === 'dark' ? 'text-navy-400' : 'text-gray-500';
  const bgClass = theme === 'dark' ? 'bg-navy-950' : 'bg-gray-50';
  const cardBgClass = theme === 'dark' ? 'bg-navy-900/50' : 'bg-white/80';

  return (
    <div className={`min-h-screen ${bgClass} px-4 py-8`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/app"
            className={`inline-flex items-center gap-2 ${mutedTextClass} hover:text-primary-500 transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <button
            onClick={handleLogout}
            className={`inline-flex items-center gap-2 ${mutedTextClass} hover:text-red-500 transition-colors`}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Profile Section */}
        <div className={`${glassCardClass} p-6 rounded-2xl mb-8`}>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary-500" />
            </div>
            <div className="flex-1">
              <h1 className={`text-2xl font-bold ${textClass}`}>{user?.username}</h1>
              <p className={mutedTextClass}>{user?.email}</p>
              <div className={`flex items-center gap-4 mt-2 text-sm ${mutedTextClass}`}>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                </span>
                <span className={`flex items-center gap-1 ${user?.is_active ? 'text-green-500' : 'text-red-400'}`}>
                  <Shield className="w-4 h-4" />
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* API Keys Section */}
        <div className={`${glassCardClass} p-6 rounded-2xl`}>
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

                  <button
                    onClick={() => handleDeleteKey(key.id)}
                    className={`p-2 rounded-lg ${mutedTextClass} hover:text-red-500 hover:bg-red-500/10 transition-colors`}
                    title="Delete key"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Note */}
        <div className={`mt-6 p-4 rounded-xl border ${theme === 'dark' ? 'border-navy-700/50 bg-navy-900/30' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-start gap-3">
            <Shield className={`w-5 h-5 ${mutedTextClass} flex-shrink-0 mt-0.5`} />
            <div className={`text-sm ${mutedTextClass}`}>
              <p className="font-medium mb-1">Security Note</p>
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
