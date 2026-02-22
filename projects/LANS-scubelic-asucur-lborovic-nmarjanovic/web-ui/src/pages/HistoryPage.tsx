import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  ChevronRight, 
  AlertCircle, 
  ArrowLeft, 
  Database,
  Calendar,
  Layers,
  DollarSign,
  Search
} from 'lucide-react';

import { useAuth } from '../auth/AuthContext';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000');

interface Run {
  run_id: string;
  timestamp_utc: string;
  total_intents: number;
  total_models: number;
  total_cost_usd: number;
  input_tokens: number;
  output_tokens: number;
  my_brands: string;
}

export default function HistoryPage({ theme }: { theme: string }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [idFilter, setIdFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE_URL}/runs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch runs');
        return res.json();
      })
      .then(data => {
        setRuns(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load history. Make sure the backend is running.');
        setLoading(false);
      });
  }, [token]);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredRuns = runs.filter(run => {
    const matchesId = run.run_id.toLowerCase().includes(idFilter.toLowerCase());
    const matchesDate = !dateFilter || run.timestamp_utc.startsWith(dateFilter);
    const matchesBrand = !brandFilter || (run.my_brands && run.my_brands.toLowerCase().includes(brandFilter.toLowerCase()));
    
    return matchesId && matchesDate && matchesBrand;
  });

  const glassCardClass = theme === 'dark' 
    ? 'bg-navy-900/50 border-navy-700/50 backdrop-blur-xl' 
    : 'bg-white/80 border-gray-200/80 backdrop-blur-xl';

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-navy-950 text-white' : 'bg-slate-50 text-black'} p-6 md:p-12`}>
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/app')}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-navy-800 text-navy-300' : 'hover:bg-gray-200 text-gray-600'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Clock className="w-8 h-8 text-primary-500" />
                Run History
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>
                Archive of all past analysis runs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full lg:w-auto">
            {/* Brand Filter */}
            <div className="relative w-full">
              <Database className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-navy-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Filter by Brand..."
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all ${
                  theme === 'dark' 
                    ? 'bg-navy-900/50 border-navy-700 text-white placeholder-navy-400 focus:border-primary-500/50 focus:bg-navy-900' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary-500/50'
                }`}
              />
            </div>

            {/* ID Filter */}
            <div className="relative w-full">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-navy-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Filter by ID..."
                value={idFilter}
                onChange={(e) => setIdFilter(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all ${
                  theme === 'dark' 
                    ? 'bg-navy-900/50 border-navy-700 text-white placeholder-navy-400 focus:border-primary-500/50 focus:bg-navy-900' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary-500/50'
                }`}
              />
            </div>

            {/* Date Filter */}
            <div className="relative w-full">
              <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-navy-400' : 'text-gray-400'}`} />
              <input
                type="date"
                placeholder="Filter by Date..."
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all ${
                  theme === 'dark' 
                    ? 'bg-navy-900/50 border-navy-700 text-white placeholder-navy-400 focus:border-primary-500/50 focus:bg-navy-900 [color-scheme:dark]' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary-500/50'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className={`text-center py-20 rounded-2xl border border-dashed ${theme === 'dark' ? 'border-navy-700 bg-navy-900/30' : 'border-gray-300 bg-gray-50'}`}>
            <Database className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-navy-600' : 'text-gray-400'}`} />
            <h3 className="text-xl font-medium mb-2">No runs found</h3>
            <p className={`${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>
              {runs.length > 0 ? "Try adjusting your filter." : "Start your first analysis in the Dashboard to see it here."}
            </p>
            {runs.length === 0 && (
              <button 
                onClick={() => navigate('/app')}
                className="mt-6 btn-primary"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        ) : (
          <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'border-navy-700' : 'border-gray-200'} ${glassCardClass}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${theme === 'dark' ? 'border-navy-700 bg-navy-900/50' : 'border-gray-200 bg-gray-50/80'}`}>
                    <th className="p-4 font-semibold text-sm">Date</th>
                    <th className="p-4 font-semibold text-sm">Run ID</th>
                    <th className="p-4 font-semibold text-sm">Scope</th>
                    <th className="p-4 font-semibold text-sm">Tokens (In / Out)</th>
                    <th className="p-4 font-semibold text-sm">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-navy-700/50' : 'divide-gray-200/50'}`}>
                  {filteredRuns.map((run) => (
                    <tr 
                      key={run.run_id} 
                      className={`group transition-colors ${theme === 'dark' ? 'hover:bg-navy-800/50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-navy-400' : 'text-gray-400'}`} />
                          <span className="font-medium">{formatDate(run.timestamp_utc)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <code className={`px-2 py-1 rounded text-xs font-mono ${theme === 'dark' ? 'bg-navy-900 text-navy-300' : 'bg-gray-100 text-gray-600'}`}>
                          {run.run_id.substring(0, 8)}...
                        </code>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-primary-500" />
                            {run.total_intents} Intents
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-navy-800 text-navy-300' : 'bg-gray-200 text-gray-600'}`}>
                            {run.total_models} Models
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                            {run.input_tokens?.toLocaleString() || 0}
                          </span>
                          <span className={theme === 'dark' ? 'text-navy-600' : 'text-gray-300'}>/</span>
                          <span className={`${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {run.output_tokens?.toLocaleString() || 0}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => navigate(`/app?runId=${run.run_id}&tab=results`)}
                          className={`flex items-center gap-1 text-sm font-medium transition-colors ${theme === 'dark' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'}`}
                        >
                          View Report <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
