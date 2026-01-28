import { useNavigate } from 'react-router-dom';
import {
  Search,
  Zap,
  Shield,
  TrendingUp,
  Database,
  Code,
  Eye,
  Users,
  BarChart3,
  Globe,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Target,
  Clock,
  DollarSign,
  Brain,
  LineChart,
  MessageSquare,
} from 'lucide-react';

export default function LandingPage({ theme }) {
  const navigate = useNavigate();

  const features = [
    {
      icon: Globe,
      title: 'Multi-Model Intelligence',
      description:
        'Monitor responses across OpenAI, Anthropic Claude, Google Gemini, Mistral, Perplexity, and Grok from a single dashboard.',
    },
    {
      icon: Target,
      title: 'Real-Time Brand Detection',
      description:
        'Precision extraction engine uses word-boundary matching to accurately identify brand mentions without false positives.',
    },
    {
      icon: Users,
      title: 'Competitive Positioning',
      description:
        'See who appears alongside you in AI recommendations. Track competitor mentions and identify emerging threats.',
    },
    {
      icon: LineChart,
      title: 'Historical Trend Analysis',
      description:
        'Every query stored locally in SQLite for complete data ownership. Track visibility changes over time.',
    },
    {
      icon: Code,
      title: 'Developer-First Design',
      description:
        'Full CLI with JSON output for automation. Integrate into existing workflows or let AI agents monitor autonomously.',
    },
    {
      icon: Shield,
      title: 'Your Keys, Your Data',
      description:
        'Bring your own API keys. All data stays on your infrastructure. No vendor lock-in, complete privacy.',
    },
  ];

  const useCases = [
    {
      role: 'Marketing Leaders',
      description: 'Measure AI share-of-voice and prove ROI on brand initiatives.',
      icon: BarChart3,
    },
    {
      role: 'Product Teams',
      description: 'Understand how AI perceives your product vs. alternatives.',
      icon: Brain,
    },
    {
      role: 'SEO Professionals',
      description: 'Expand your toolkit beyond traditional search rankings.',
      icon: TrendingUp,
    },
    {
      role: 'Competitive Intelligence',
      description: 'Get early signals on how AI positions your market.',
      icon: Eye,
    },
  ];

  const steps = [
    { step: '1', title: 'Configure', description: 'Define your brand, competitors, and buyer-intent queries' },
    { step: '2', title: 'Monitor', description: 'Query multiple LLMs automatically on your schedule' },
    { step: '3', title: 'Extract', description: 'Get structured data on mentions, rankings, and sentiment' },
    { step: '4', title: 'Analyze', description: 'Track trends and export reports for your team' },
  ];

  const glassCardClass = theme === 'dark'
    ? 'glass-card'
    : 'bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm';

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-navy-950 text-white' : 'bg-gray-50 text-gray-800'}`}>
      {/* Background effects */}
      <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5' : 'bg-gray-100'} pointer-events-none`} />
      {theme === 'dark' && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-primary-500/10 to-transparent blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial from-accent-500/10 to-transparent blur-3xl" />
        </div>
      )}

      {/* Navigation */}
      <nav className={`relative border-b ${theme === 'dark' ? 'border-navy-800/50 bg-navy-900/50' : 'border-gray-200/50 bg-white/50'} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center animate-float">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>LLM Answer Watcher</h1>
                <p className={`text-xs ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>Brand Intelligence for the AI Era</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="https://github.com/nibzard/llm-answer-watcher"
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-ghost text-sm ${theme === 'dark' ? 'text-navy-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Documentation
              </a>
              <button
                onClick={() => navigate('/login')}
                className={`btn-ghost text-sm ${theme === 'dark' ? 'text-navy-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Login
              </button>
              <button onClick={() => navigate('/register')} className="btn-primary text-sm">
                Sign Up
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${theme === 'dark' ? 'bg-primary-500/10 border-primary-500/20' : 'bg-primary-100/50 border-primary-200/50'} mb-8 animate-fade-in-down`}>
            <Sparkles className="w-4 h-4 text-primary-400 animate-pulse" />
            <span className={`text-sm ${theme === 'dark' ? 'text-primary-300' : 'text-primary-600'}`}>Now with Google Gemini & Groq</span>
          </div>

          {/* Headline */}
          <h1 className={`text-5xl md:text-7xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6 leading-tight animate-fade-in-up`}>
            Know What AI Says
            <br />
            <span className="animated-gradient-text">
              About Your Brand
            </span>
          </h1>

          {/* Subheadline */}
          <p className={`text-xl md:text-2xl ${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'} mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200`} style={{ opacity: 0, animationFillMode: 'forwards' }}>
            The first brand monitoring platform built for the age of AI search.
            <br />
            <span className={`${theme === 'dark' ? 'text-navy-300' : 'text-gray-700'}`}>
      Track how Gemini and Groq recommend you vs. competitors.
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up animation-delay-400" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <button onClick={() => navigate('/login')} className="btn-primary text-lg px-8 py-4 animate-pulse-glow hover-lift">
              <Zap className="w-5 h-5 mr-2 inline" />
              Start Monitoring Free
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary text-lg px-8 py-4 hover-lift">
              <Users className="w-5 h-5 mr-2 inline" />
              Try Both
            </button>
            <a
              href="https://github.com/nibzard/llm-answer-watcher"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-lg px-8 py-4 hover-lift"
            >
              <Code className="w-5 h-5 mr-2 inline" />
              View on GitHub
            </a>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: '6+', label: 'LLM Providers' },
              { value: '100%', label: 'Local Data' },
              { value: '<5s', label: 'Per Query' },
              { value: '$0.001', label: 'Avg. Cost' },
            ].map((stat, i) => (
              <div
                key={i}
                className={`${glassCardClass} p-4 hover-lift card-hover-glow animate-scale-in animation-delay-${(i + 5) * 100}`}
                style={{ opacity: 0, animationFillMode: 'forwards' }}
              >
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className={`relative py-20 px-6 border-t ${theme === 'dark' ? 'border-navy-800/50' : 'border-gray-200/50'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>
            When customers ask AI for recommendations,
            <br />
            <span className="text-primary-400">is your brand in the answer?</span>
          </h2>
          <p className={`text-lg ${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'} leading-relaxed`}>
            Search is changing. Millions of purchase decisions now start with{' '}
            <span className={`${theme === 'dark' ? 'text-navy-200' : 'text-gray-700'}`}>"Hey ChatGPT, what's the best..."</span> instead of a Google search.
            If your brand isn't appearing in AI-generated recommendations, you're invisible to a growing segment of
            your market.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <span className="text-amber-300 font-medium">LLM Answer Watcher gives you the data to stay ahead.</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className={`relative py-20 px-6 border-t ${theme === 'dark' ? 'border-navy-800/50' : 'border-gray-200/50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Key Features</h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'}`}>Everything you need to monitor your AI visibility</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`${glassCardClass} p-6 hover-lift card-hover-glow group`}
              >
                <div className={`w-12 h-12 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-br from-primary-500/20 to-accent-500/20' : 'bg-gradient-to-br from-primary-100 to-accent-100'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-primary-400 group-hover-spin" />
                </div>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2 text-gradient-hover`}>{feature.title}</h3>
                <p className={`${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'} text-sm leading-relaxed`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={`relative py-20 px-6 border-t ${theme === 'dark' ? 'border-navy-800/50 bg-navy-900/30' : 'border-gray-200/50 bg-gray-100/50'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>How It Works</h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'}`}>Get started in minutes, not days</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white animate-float group-hover:animate-none group-hover:scale-110 transition-transform" style={{ animationDelay: `${i * 200}ms` }}>
                  {step.step}
                </div>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>{step.title}</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'}`}>{step.description}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className={`hidden md:block absolute top-8 -right-4 w-6 h-6 ${theme === 'dark' ? 'text-navy-600' : 'text-gray-300'} animate-pulse`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className={`relative py-20 px-6 border-t ${theme === 'dark' ? 'border-navy-800/50' : 'border-gray-200/50'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Built for Teams Who Take AI Seriously</h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'}`}>From marketing to product to intelligence</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((useCase, i) => (
              <div key={i} className={`${glassCardClass} p-6 flex items-start gap-4 hover-lift card-hover-glow group`}>
                <div className={`w-12 h-12 rounded-xl ${theme === 'dark' ? 'bg-accent-500/20' : 'bg-accent-100'} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <useCase.icon className="w-6 h-6 text-accent-400" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1 text-gradient-hover`}>{useCase.role}</h3>
                  <p className={`${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'} text-sm`}>{useCase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className={`relative py-20 px-6 border-t ${theme === 'dark' ? 'border-navy-800/50 bg-navy-900/30' : 'border-gray-200/50 bg-gray-100/50'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Pricing That Scales With You</h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'}`}>Start free, upgrade when you need more</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Open Source */}
            <div className={`${glassCardClass} p-8 hover-lift card-hover-glow`}>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Open Source</h3>
              <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>
                Free
                <span className={`text-sm font-normal ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} ml-2`}>forever</span>
              </div>
              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'}`}>Self-hosted, full control</p>
              <ul className="space-y-3 mb-8">
                {['Unlimited queries', 'All LLM providers', 'Local SQLite storage', 'CLI & JSON output', 'Community support'].map(
                  (item, i) => (
                    <li key={i} className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-navy-300' : 'text-gray-700'}`}>
                      <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" />
                      {item}
                    </li>
                  )
                )}
              </ul>
              <button onClick={() => navigate('/login')} className="btn-secondary w-full">
                Get Started
              </button>
            </div>

            {/* Pro */}
            <div className={`${glassCardClass} p-8 border-primary-500/50 animate-pulse-glow relative hover-lift`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-500 rounded-full text-xs font-medium text-white animate-pulse">
                Popular
              </div>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Pro</h3>
              <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>
                $49
                <span className={`text-sm font-normal ${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'} ml-2`}>/month</span>
              </div>
              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'}`}>Managed infrastructure</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Free',
                  'Cloud dashboard',
                  'Advanced analytics',
                  'Email alerts',
                  'Priority support',
                ].map((item, i) => (
                  <li key={i} className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-navy-300' : 'text-gray-700'}`}>
                    <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button className="btn-primary w-full">Coming Soon</button>
            </div>

            {/* Enterprise */}
            <div className={`${glassCardClass} p-8 hover-lift card-hover-glow`}>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Enterprise</h3>
              <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>Custom</div>
              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'}`}>Tailored for your needs</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Pro',
                  'Custom integrations',
                  'SSO & SAML',
                  'Dedicated success manager',
                  'SLA guarantees',
                ].map((item, i) => (
                  <li key={i} className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-navy-300' : 'text-gray-700'}`}>
                    <CheckCircle className="w-4 h-4 text-accent-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button className="btn-secondary w-full">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* CLI Demo */}
      <section className={`relative py-20 px-6 border-t ${theme === 'dark' ? 'border-navy-800/50' : 'border-gray-200/50'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Get Started in Minutes</h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'}`}>One command to install, one command to run</p>
          </div>

          <div className={`${glassCardClass} p-6 font-mono text-sm hover-lift`}>
            <div className="flex items-center gap-2 mb-4 text-navy-400">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2">Terminal</span>
            </div>
            <div className="space-y-2 text-navy-300">
              <p>
                <span className="text-primary-400">$</span> pip install llm-answer-watcher
              </p>
              <p>
                <span className="text-primary-400">$</span> llm-answer-watcher demo<span className="animate-cursor">&nbsp;</span>
              </p>
              <p className="text-navy-500"># No API keys needed for the demo!</p>
              <p className="text-navy-500"># See what AI says about any brand in 60 seconds</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`relative py-24 px-6 border-t ${theme === 'dark' ? 'border-navy-800/50 bg-gradient-to-b from-navy-900/50 to-navy-950' : 'border-gray-200/50 bg-gradient-to-b from-gray-100/50 to-white'}`}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className={`text-4xl md:text-5xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>
            Stop guessing.
            <br />
            <span className="animated-gradient-text">Start monitoring.</span>
          </h2>
          <p className={`text-xl ${theme === 'dark' ? 'text-navy-400' : 'text-gray-600'} mb-8`}>
            In a world where AI answers questions, the brands that get mentioned win.
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary text-lg px-10 py-5 animate-pulse-glow hover-lift">
            <Zap className="w-5 h-5 mr-2 inline animate-pulse" />
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2 inline" />
          </button>
          <p className={`text-sm ${theme === 'dark' ? 'text-navy-500' : 'text-gray-400'} mt-4`}>No credit card required. BYOK - Bring your own API keys.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative border-t ${theme === 'dark' ? 'border-navy-800/50 bg-navy-900/30' : 'border-gray-200/50 bg-gray-100/50'}`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
              <span className={`${theme === 'dark' ? 'text-navy-400' : 'text-gray-500'}`}>LLM Answer Watcher v0.2.0</span>
            </div>

            <div className={`flex items-center gap-6 text-sm ${theme === 'dark' ? 'text-navy-500' : 'text-gray-400'}`}>
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> BYOK
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-4 h-4" /> Local-first
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> Open Source
              </span>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="https://github.com/nibzard/llm-answer-watcher"
                target="_blank"
                rel="noopener noreferrer"
                className={`${theme === 'dark' ? 'text-navy-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                GitHub
              </a>
              <a href="#" className={`${theme === 'dark' ? 'text-navy-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                Documentation
              </a>
            </div>
          </div>

          <div className={`mt-8 pt-8 border-t ${theme === 'dark' ? 'border-navy-800/50' : 'border-gray-200/50'} text-center`}>
            <p className={`text-sm italic ${theme === 'dark' ? 'text-navy-500' : 'text-gray-400'}`}>
              "In a world where AI answers questions, the brands that get mentioned win. LLM Answer Watcher is the
              analytics layer the AI age demands."
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
