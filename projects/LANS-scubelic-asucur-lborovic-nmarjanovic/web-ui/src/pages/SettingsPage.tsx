import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Database,
  Shield,
  Trash2,
  Download,
  Info,
  LogOut,
  Mail,
  Smartphone,
  Globe,
  Monitor,
  AlignJustify,
  Layout,
  Rows,
  Sliders
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import AccessibilitySettings from '../components/AccessibilitySettings';


// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000');

interface SettingsPageProps {
  theme: string;
  toggleTheme: () => void;
}

export default function SettingsPage({ theme, toggleTheme }: SettingsPageProps) {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState({
    email: true,
    browser: false,
    updates: true,
    marketing: false
  });

  const [appearance, setAppearance] = useState({
    density: 'comfortable',
    fontSize: 'medium'
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    if (!token) return;
    
    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/user/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Object.keys(data).length > 0) {
                    if (data.notifications) setNotifications(data.notifications);
                    if (data.appearance) {
                        const { theme: savedTheme, ...rest } = data.appearance;
                        setAppearance(rest);
                        // Sync theme if different (optional, might cause flicker if App doesn't handle it)
                        if (savedTheme && savedTheme !== theme) {
                            toggleTheme(); 
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Failed to load settings", err);
        } finally {
            setIsLoading(false);
        }
    };
    fetchSettings();
  }, [token]); // Run once on mount (and when token changes)

  // Save settings when changed (debounced)
  useEffect(() => {
    if (!token || isLoading) return;

    const saveSettings = async () => {
        try {
            await fetch(`${API_BASE_URL}/user/settings`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    settings: { 
                        notifications, 
                        appearance: { ...appearance, theme } // Include theme in saved settings
                    } 
                })
            });
        } catch (err) {
            console.error("Failed to save settings", err);
        }
    };

    const timer = setTimeout(saveSettings, 1000);
    return () => clearTimeout(timer);
  }, [notifications, appearance, theme, token, isLoading]);


  const saveNotificationsImmediate = async (newNotifications: any) => {
      try {
          await fetch(`${API_BASE_URL}/user/settings`, {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ 
                  settings: { 
                      notifications: newNotifications, 
                      appearance: { ...appearance, theme } 
                  } 
              })
          });
      } catch (err) {
          console.error("Failed to save settings", err);
      }
  };

  const handleBrowserNotificationToggle = async () => {
    let newState = notifications.browser;

    // If turning off
    if (notifications.browser) {
      newState = false;
      const newNotifs = { ...notifications, browser: newState };
      setNotifications(newNotifs);
      saveNotificationsImmediate(newNotifs);
      return;
    }

    // If turning on, check permissions
    if (!('Notification' in window)) {
      showToast('This browser does not support desktop notifications', 'error');
      return;
    }

    const grantPermission = () => {
        const newNotifs = { ...notifications, browser: true };
        setNotifications(newNotifs);
        saveNotificationsImmediate(newNotifs);
        new Notification('Notifications Enabled', {
          body: 'You will now receive alerts when your scans complete.',
          icon: '/vite.svg'
        });
    };

    if (Notification.permission === 'granted') {
      grantPermission();
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        grantPermission();
      } else {
        showToast('Notification permission denied', 'error');
      }
    } else {
      showToast('Notifications are blocked. Please enable them in your browser settings.', 'error');
    }
  };

  const handleEmailNotificationToggle = () => {
    const newState = !notifications.email;
    const newNotifs = { ...notifications, email: newState };
    setNotifications(newNotifs);
    saveNotificationsImmediate(newNotifs);
    
    if (newState) {
      showToast(`Subscribed to weekly updates at ${user?.email}`, 'success');
    } else {
      showToast('Unsubscribed from email updates', 'info');
    }
  };

  const handleLogout = async () => {
    navigate('/', { replace: true });
    await logout();
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all your search history? This action cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/history`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
          showToast('Search history cleared successfully', 'success');
      } else {
          throw new Error('Failed to clear history');
      }
    } catch (error) {
      showToast('Failed to clear history', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
        const res = await fetch(`${API_BASE_URL}/user/export`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Export failed");
        
        const data = await res.json();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('Data exported successfully', 'success');
    } catch (error) {
        showToast('Failed to export data', 'error');
        console.error(error);
    } finally {
        setIsExporting(false);
    }
  };

  const glassCardClass = theme === 'dark'
    ? 'glass-card'
    : 'glass-card-light';

  const toggleClass = (isActive: boolean) => `
    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
    ${isActive ? 'bg-primary-500' : (theme === 'dark' ? 'bg-navy-700' : 'bg-gray-200')}
  `;

  const toggleSpanClass = (isActive: boolean) => `
    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
    transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}
  `;

  // Dynamic styles based on density
  const getDensityStyles = () => {
    switch (appearance.density) {
      case 'compact':
        return {
          containerSpace: 'space-y-4',
          cardPadding: 'p-4',
          cardSpace: 'space-y-4',
          itemPadding: 'p-3',
          headerMb: 'mb-4',
          fontSize: 'text-sm'
        };
      case 'spacious':
        return {
          containerSpace: 'space-y-8',
          cardPadding: 'p-8',
          cardSpace: 'space-y-8',
          itemPadding: 'p-6',
          headerMb: 'mb-8',
          fontSize: 'text-base'
        };
      case 'comfortable':
      default:
        return {
          containerSpace: 'space-y-6',
          cardPadding: 'p-6',
          cardSpace: 'space-y-6',
          itemPadding: 'p-4',
          headerMb: 'mb-6',
          fontSize: 'text-base'
        };
    }
  };

  const styles = getDensityStyles();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-navy-950 text-white' : 'light-mode-bg text-gray-900'} px-4 py-8`}>
      <div className="max-w-4xl mx-auto">
         {/* Background gradient for light mode */}
         {theme === 'light' && (
          <div className="fixed inset-0 bg-slate-100/50 pointer-events-none -z-10" />
        )}

        {/* Header */}
        <div className={`flex items-center justify-between ${styles.headerMb}`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app')}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-navy-800 text-navy-300' : 'hover:bg-gray-200 text-gray-600'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Settings className="w-8 h-8 text-primary-500" />
                Settings
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>
                Manage your application preferences and account
              </p>
            </div>
          </div>
        </div>

        <div className={styles.containerSpace}>
          
          {/* Appearance Section */}
          <div className={`${glassCardClass} ${styles.cardPadding}`}>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary-400" />
              Appearance
            </h2>
            
            <div className={styles.cardSpace}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Theme Mode</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>
                    Toggle between dark and light themes
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    theme === 'dark' 
                      ? 'bg-navy-800 border-navy-700 hover:bg-navy-700' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-yellow-400" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-primary-500" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
              </div>

               <div className={`h-px ${theme === 'dark' ? 'bg-navy-800' : 'bg-gray-200'}`} />

               <div>
                 <div className="mb-4">
                    <h3 className="font-medium">Interface Density</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>
                      Adjust the spacing of UI elements
                    </p>
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'compact', label: 'Compact', desc: 'High density', space: 'space-y-1', height: 'h-1.5' },
                      { id: 'comfortable', label: 'Comfortable', desc: 'Standard', space: 'space-y-3', height: 'h-2' },
                      { id: 'spacious', label: 'Spacious', desc: 'Relaxed', space: 'space-y-5', height: 'h-2.5' }
                    ].map((opt) => {
                       const isSelected = appearance.density === opt.id;
                       
                       return (
                       <button
                          key={opt.id}
                          onClick={() => setAppearance({ ...appearance, density: opt.id })}
                          className={`flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all h-full ${
                             isSelected
                               ? (theme === 'dark' ? 'bg-primary-500/10 border-primary-500 shadow-lg shadow-primary-500/10' : 'bg-primary-50 border-primary-500 shadow-md')
                               : (theme === 'dark' ? 'bg-navy-800/50 border-navy-800 hover:border-navy-600' : 'bg-white border-gray-200 hover:border-gray-300')
                          }`}
                       >
                          {/* Visual Preview */}
                          <div className={`w-16 ${opt.space} mb-4 p-2 rounded border ${theme === 'dark' ? 'border-navy-700 bg-navy-900/50' : 'border-gray-100 bg-gray-50'}`}>
                              <div className={`${opt.height} w-full rounded-full ${isSelected ? 'bg-primary-500' : (theme === 'dark' ? 'bg-navy-600' : 'bg-gray-300')}`} />
                              <div className={`${opt.height} w-3/4 rounded-full ${isSelected ? 'bg-primary-400' : (theme === 'dark' ? 'bg-navy-700' : 'bg-gray-200')}`} />
                              <div className={`${opt.height} w-5/6 rounded-full ${isSelected ? 'bg-primary-500' : (theme === 'dark' ? 'bg-navy-600' : 'bg-gray-300')}`} />
                              {opt.id === 'compact' && <div className={`${opt.height} w-full rounded-full ${isSelected ? 'bg-primary-400' : (theme === 'dark' ? 'bg-navy-700' : 'bg-gray-200')}`} />}
                          </div>

                          <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{opt.label}</span>
                          <span className={`text-xs mt-1 ${theme === 'dark' ? 'text-navy-500' : 'text-gray-500'}`}>{opt.desc}</span>
                       </button>
                    )})}
                                   </div>
                                </div>
                             </div>
                           </div>
                 
                           {/* Accessibility Section */}
                           <AccessibilitySettings theme={theme} />
                 
                           {/* Notifications Section */}
                           <div className={`${glassCardClass} ${styles.cardPadding}`}>
                             <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                               <Bell className="w-5 h-5 text-accent-400" />
                               Notifications
                             </h2>
            <div className={styles.cardSpace}>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-navy-800' : 'bg-gray-100'}`}>
                       <Mail className="w-4 h-4 text-primary-500" />
                    </div>
                    <div>
                       <h3 className="font-medium">Email Notifications</h3>
                       <p className={`text-sm ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>
                          Receive weekly summaries and alerts
                       </p>
                    </div>
                 </div>
                 <button 
                    onClick={handleEmailNotificationToggle}
                    className={toggleClass(notifications.email)}
                 >
                    <span className={toggleSpanClass(notifications.email)} />
                 </button>
              </div>

              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-navy-800' : 'bg-gray-100'}`}>
                       <Smartphone className="w-4 h-4 text-accent-500" />
                    </div>
                    <div>
                       <h3 className="font-medium">Browser Notifications</h3>
                       <p className={`text-sm ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>
                          Get real-time alerts when scans finish
                       </p>
                    </div>
                 </div>
                 <button 
                    onClick={handleBrowserNotificationToggle}
                    className={toggleClass(notifications.browser)}
                 >
                    <span className={toggleSpanClass(notifications.browser)} />
                 </button>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className={`${glassCardClass} ${styles.cardPadding}`}>
             <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
               <Database className="w-5 h-5 text-emerald-400" />
               Data Management
             </h2>

             <div className="space-y-4">
                <button
                   onClick={handleExportData}
                   disabled={isExporting}
                   className={`w-full flex items-center justify-between ${styles.itemPadding} rounded-xl border transition-all ${
                      theme === 'dark' 
                        ? 'bg-navy-800/50 border-navy-700 hover:bg-navy-800 hover:border-navy-600' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                   }`}
                >
                   <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-emerald-500" />
                      <div className="text-left">
                         <h3 className="font-medium">Export All Data</h3>
                         <p className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>
                            Download a copy of your configuration and history
                         </p>
                      </div>
                   </div>
                   {isExporting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent" />
                   ) : (
                      <span className={`text-sm ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>JSON</span>
                   )}
                </button>

                <button
                   onClick={handleClearHistory}
                   disabled={isDeleting}
                   className={`w-full flex items-center justify-between ${styles.itemPadding} rounded-xl border transition-all ${
                      theme === 'dark' 
                        ? 'bg-navy-800/50 border-navy-700 hover:bg-rose-900/10 hover:border-rose-900/30' 
                        : 'bg-white border-gray-200 hover:bg-rose-50 hover:border-rose-200'
                   } group`}
                >
                   <div className="flex items-center gap-3">
                      <Trash2 className="w-5 h-5 text-rose-500 group-hover:text-rose-600" />
                      <div className="text-left">
                         <h3 className="font-medium group-hover:text-rose-600 transition-colors">Clear Search History</h3>
                         <p className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>
                            Permanently delete all past search runs
                         </p>
                      </div>
                   </div>
                   {isDeleting && (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-rose-500 border-t-transparent" />
                   )}
                </button>
             </div>
          </div>

          {/* Account */}
          <div className={`${glassCardClass} ${styles.cardPadding}`}>
             <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Account
             </h2>

             <div className="space-y-4">
                <div className={`flex items-center justify-between ${styles.itemPadding} rounded-xl bg-primary-500/5 border border-primary-500/10`}>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500 font-bold">
                         {user?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                         <h3 className="font-medium">{user?.username}</h3>
                         <p className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>{user?.email}</p>
                      </div>
                   </div>
                   <button 
                      onClick={() => navigate('/profile')}
                      className={`text-sm font-medium ${theme === 'dark' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'}`}
                   >
                      Manage Keys
                   </button>
                </div>

                <button
                   onClick={handleLogout}
                   className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-transparent font-medium transition-colors ${
                      theme === 'dark' 
                        ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' 
                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                   }`}
                >
                   <LogOut className="w-4 h-4" />
                   Sign Out
                </button>
             </div>
          </div>

          {/* About */}
          <div className="text-center py-6">
             <button
               onClick={() => navigate('/app')}
               className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 mb-4 shadow-lg shadow-primary-500/20 hover:scale-105 transition-transform"
               title="Back to Configuration"
             >
                <ArrowLeft className="w-6 h-6 text-white" />
             </button>
             <h3 className="text-lg font-bold mb-1">LLM Answer Watcher</h3>
             <p className={`text-sm ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} mb-4`}>
                Version 0.2.0-beta
             </p>
             <div className="flex items-center justify-center gap-4 text-sm">
                <a href="#" className="hover:underline opacity-70 hover:opacity-100">Documentation</a>
                <span>•</span>
                <a href="#" className="hover:underline opacity-70 hover:opacity-100">Privacy Policy</a>
                <span>•</span>
                <a href="#" className="hover:underline opacity-70 hover:opacity-100">Terms of Service</a>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}