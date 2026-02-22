import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ArrowRight, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';

export default function FAQPage({ theme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fromLanding = location.state?.from === 'landing';
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleHomeNavigation = () => {
    if (user) {
      setShowLogoutConfirm(true);
    } else {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    navigate('/', { replace: true });
    await logout();
  };

  const handleBack = () => {
    if (fromLanding) {
      navigate('/');
    } else {
      navigate('/app');
    }
  };

  const faqs = [
    {
      question: "What is LLM Answer Watcher?",
      answer: "LLM Answer Watcher is a tool that allows you to monitor how different Large Language Models (LLMs) like Gemini, ChatGPT, and Claude perceive and recommend your brand."
    },
    {
      question: "Is it free to use?",
      answer: "Yes, the open-source version is free to use forever. You just need to bring your own API keys."
    },
    {
      question: "Which LLM providers are supported?",
      answer: "We currently support Google Gemini, Groq, OpenAI, Anthropic, Mistral, and Perplexity."
    },
     {
      question: "Is my data secure?",
      answer: "Absolutely. All data is stored locally on your machine using SQLite. We do not have access to your API keys or your monitoring data."
    }
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-navy-950 text-white' : 'bg-slate-50 text-black'}`}>
       {/* Background effects */}
      <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5' : 'bg-slate-100/50'} pointer-events-none`} />
      {theme === 'dark' && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-primary-500/10 to-transparent blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial from-accent-500/10 to-transparent blur-3xl" />
        </div>
      )}

      {/* Navigation */}
      <nav className={`relative border-b ${theme === 'dark' ? 'border-navy-800/50 bg-navy-900/50' : 'border-slate-200/60 bg-white/50'} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3 cursor-pointer" onClick={handleHomeNavigation}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>LLM Answer Watcher</h1>
                <p className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>Brand Intelligence for the AI Era</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <button
                onClick={handleHomeNavigation}
                className={`btn-ghost text-sm ${theme === 'dark' ? 'text-navy-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-20 relative">
        <h1 className={`text-4xl font-bold mb-12 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Frequently Asked Questions</h1>
        
        <div className="mb-8">
            <button 
                onClick={handleBack}
                className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'} transition-colors`}
            >
                <ArrowLeft className="w-4 h-4" />
                {fromLanding ? "Back to Landing Page" : "Back to Configuration"}
            </button>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-navy-900/50 border border-navy-800/50' : 'bg-white border border-gray-200'} backdrop-blur-sm`}>
              <h3 className={`text-xl font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{faq.question}</h3>
              <p className={`${theme === 'dark' ? 'text-navy-300' : 'text-gray-600'} leading-relaxed`}>{faq.answer}</p>
            </div>
          ))}
        </div>
        
         <div className="mt-12 text-center">
            <p className={`mb-6 ${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'}`}>Still have questions?</p>
             <a
                href="https://github.com/nibzard/llm-answer-watcher"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2"
            >
                Contact us on GitHub <ArrowRight className="w-4 h-4" />
            </a>
         </div>
      </div>

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
