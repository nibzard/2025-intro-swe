import { Moon, Sun } from 'lucide-react';

const ThemeToggler = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className={`fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
      ${
        theme === 'dark'
          ? 'bg-navy-700 hover:bg-navy-600 text-yellow-400'
          : 'bg-gray-200 hover:bg-gray-300 text-orange-500'
      }`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
    </button>
  );
};

export default ThemeToggler;
