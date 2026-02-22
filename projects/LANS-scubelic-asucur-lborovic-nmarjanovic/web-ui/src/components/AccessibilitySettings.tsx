import { useState, useEffect } from 'react';
import { Sliders, Contrast, BookOpen, MousePointer, Minimize } from 'lucide-react';

interface AccessibilitySettingsProps {
  theme: string;
}

// Define a type for our settings for clarity
type AccessibilityState = {
  fontSize: number;
  highContrast: boolean;
  dyslexiaFriendly: boolean;
  largerClicks: boolean;
  reducedMotion: boolean;
};

export default function AccessibilitySettings({ theme }: AccessibilitySettingsProps) {
  
  // Initialize state from localStorage or use defaults
  const [settings, setSettings] = useState<AccessibilityState>(() => {
    try {
      const savedSettings = localStorage.getItem('accessibilitySettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Basic validation to ensure we don't crash on malformed data
        return {
          fontSize: typeof parsed.fontSize === 'number' ? parsed.fontSize : 16,
          highContrast: typeof parsed.highContrast === 'boolean' ? parsed.highContrast : false,
          dyslexiaFriendly: typeof parsed.dyslexiaFriendly === 'boolean' ? parsed.dyslexiaFriendly : false,
          largerClicks: typeof parsed.largerClicks === 'boolean' ? parsed.largerClicks : false,
          reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : false,
        };
      }
    } catch (error) {
      console.error("Failed to parse accessibility settings from localStorage", error);
    }
    // Default state if nothing is saved or parsing fails
    return {
      fontSize: 16,
      highContrast: false,
      dyslexiaFriendly: false,
      largerClicks: false,
      reducedMotion: false,
    };
  });

  // Effect to apply settings to the DOM and save to localStorage
  useEffect(() => {
    // 1. Update body classes based on settings
    const body = document.body;
    body.classList.toggle('high-contrast', settings.highContrast);
    body.classList.toggle('dyslexia-friendly', settings.dyslexiaFriendly);
    body.classList.toggle('larger-clicks', settings.largerClicks);
    body.classList.toggle('reduced-motion', settings.reducedMotion);

    // 2. Update root font size
    document.documentElement.style.setProperty('--base-font-size', `${settings.fontSize}px`);

    // 3. Save the current settings to localStorage
    try {
      localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save accessibility settings to localStorage", error);
    }
  }, [settings]);

  // Helper to update a specific setting
  const updateSetting = <K extends keyof AccessibilityState>(key: K, value: AccessibilityState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const glassCardClass = theme === 'dark' ? 'glass-card' : 'glass-card-light';
  
  const toggleClass = (isActive: boolean) => `
    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
    ${isActive ? 'bg-primary-500' : (theme === 'dark' ? 'bg-navy-700' : 'bg-gray-200')}
  `;

  const toggleSpanClass = (isActive: boolean) => `
    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
    transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}
  `;

  return (
    <div className={`${glassCardClass} p-6`}>
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Sliders className="w-5 h-5 text-purple-400" />
        Accessibility
      </h2>

      <div className="space-y-6">
        {/* Text Size */}
        <div>
          <h3 className="font-medium mb-2">Text Size</h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Aa</span>
            <input
              type="range"
              min="12"
              max="24"
              step="1"
              value={settings.fontSize}
              onChange={(e) => updateSetting('fontSize', parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              aria-label="Adjust font size"
            />
            <span className="text-2xl text-gray-500">Aa</span>
          </div>
        </div>
        
        <div className={`h-px ${theme === 'dark' ? 'bg-navy-800' : 'bg-gray-200'}`} />

        {/* Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Contrast className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="font-medium">High Contrast Mode</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>Increases text and background contrast.</p>
              </div>
            </div>
            <button onClick={() => updateSetting('highContrast', !settings.highContrast)} className={toggleClass(settings.highContrast)}>
              <span className={toggleSpanClass(settings.highContrast)} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-green-400" />
                <div>
                    <h3 className="font-medium">Dyslexia-Friendly Font</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>Uses the Lexend font for improved readability.</p>
                </div>
            </div>
            <button onClick={() => updateSetting('dyslexiaFriendly', !settings.dyslexiaFriendly)} className={toggleClass(settings.dyslexiaFriendly)}>
              <span className={toggleSpanClass(settings.dyslexiaFriendly)} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <MousePointer className="w-5 h-5 text-orange-400" />
                <div>
                    <h3 className="font-medium">Larger Clickable Elements</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>Increases the size of buttons and links.</p>
                </div>
            </div>
            <button onClick={() => updateSetting('largerClicks', !settings.largerClicks)} className={toggleClass(settings.largerClicks)}>
              <span className={toggleSpanClass(settings.largerClicks)} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Minimize className="w-5 h-5 text-red-400" />
                <div>
                    <h3 className="font-medium">Reduced Motion</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>Disables animations and transitions.</p>
                </div>
            </div>
            <button onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)} className={toggleClass(settings.reducedMotion)}>
              <span className={toggleSpanClass(settings.reducedMotion)} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
