import { useState } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface PromptOptimizerProps {
  currentPrompt: string;
  onOptimize: (newPrompt: string) => void;
  apiKey: string;
  provider: 'google' | 'groq' | 'both';
  modelName: string;
  competitors: string[];
  myBrands: string[];
  theme: string;
}

const SYSTEM_PROMPT = `ACT AS: A Professional Prompt Engineer for AI Brand Analysis.

TASK: Transform the user's simple description into a high-quality, 
analytical search query (Intent) for an LLM.

RULES FOR GENERATING THE PROMPT:
1. TARGET: The generated prompt must be addressed to another AI (like Gemini or Llama).
2. STRUCTURE: Tell the AI to use bullet points and bold brand names (**Brand**).
3. TONE: The generated prompt must demand an objective, unbiased comparison.
4. CONTEXT: If user mentions "competitors", use the provided brand list: {{competitors}}.

EXAMPLE:
User Description: "Compare our prices"
Generated Output: "Analyze the pricing model of [MyBrand] vs [Competitors]. 
Provide a clear comparison in bullet points. Which one offers better 
value for startups? Bold all brand names."

STRICT: Output ONLY the generated prompt text. No introduction.`;

export function PromptOptimizer({ currentPrompt, onOptimize, apiKey, provider, modelName, competitors, myBrands, theme }: PromptOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { showToast } = useToast();

  const handleOptimize = async () => {
    if (!currentPrompt.trim()) {
      showToast('Please enter a basic prompt first', 'error');
      return;
    }

    if (!apiKey) {
      showToast('Please configure an API key first', 'error');
      return;
    }

    setIsOptimizing(true);

    try {
      // We will use the /api/optimize_prompt endpoint that we will create
      // For now, we will assume it exists. If not, we might need to implement the call here directly?
      // Actually, calling LLM from client-side is risky with CORS if not proxied.
      // But let's try to use the backend endpoint we plan to add.
      
      const response = await fetch('http://localhost:8000/optimize_prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          provider: provider, 
          api_key: apiKey,
          model_name: modelName,
          competitors: competitors,
          my_brands: myBrands
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to optimize prompt');
      }

      const data = await response.json();
      onOptimize(data.optimized_prompt);
      showToast('Prompt optimized successfully!', 'success');
    } catch (error) {
        console.error("Optimization error:", error);
        // Fallback: If backend endpoint is missing, maybe we can't do much.
        // But since we are the developer, we WILL add the endpoint.
        showToast(error instanceof Error ? error.message : 'Failed to optimize prompt', 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <button
      onClick={handleOptimize}
      disabled={isOptimizing || !currentPrompt.trim()}
      className={`p-3 rounded-lg border transition-all ${
        theme === 'dark' 
          ? 'bg-navy-800/50 border-navy-700 text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/50' 
          : 'bg-white border-gray-200 text-purple-600 hover:bg-purple-50 hover:border-purple-200'
      }`}
      title="AI Optimize Prompt"
    >
      {isOptimizing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Wand2 className="w-4 h-4" />
      )}
    </button>
  );
}