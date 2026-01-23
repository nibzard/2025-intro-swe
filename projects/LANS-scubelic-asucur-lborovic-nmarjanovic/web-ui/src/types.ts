export interface WatcherConfig {
  run_settings: RunSettings;
  extraction_settings?: ExtractionSettings;
  brands: Brands;
  intents: Intent[];
}

export interface RunSettings {
  output_dir: string;
  sqlite_db_path?: string;
  max_concurrent_requests: number;
  models: ModelConfig[];
  use_llm_rank_extraction: boolean;
}

export interface ModelConfig {
  provider: 'google' | 'groq';
  model_name: string;
  env_api_key: string;
  system_prompt?: string;
  tools?: { google_search: Record<string, never> }[];
}

export interface ExtractionSettings {
  extraction_model: ModelConfig;
  method: 'function_calling' | 'regex' | 'hybrid';
  fallback_to_regex: boolean;
  min_confidence: number;
  enable_sentiment_analysis: boolean;
  enable_intent_classification: boolean;
}

export interface Brands {
  mine: string[];
  competitors: string[];
}

export interface Intent {
  id: string;
  prompt: string;
}

export interface SearchResult {
  run_id: string;
  timestamp: string;
  intents: IntentResult[];
  total_cost_usd: number;
  status: 'success' | 'partial' | 'failed';
}

export interface IntentResult {
  intent_id: string;
  prompt: string;
  answer: string;
  mentions: BrandMention[];
  model: string;
  tokens_used: number;
  cost_usd: number;
}

export interface BrandMention {
  brand: string;
  is_mine: boolean;
  rank: number | null;
  context: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export const GEMINI_MODELS = [
  { id: 'models/gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Latest and fastest model (recommended)' },
] as const;

export const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Best quality for general tasks' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Fastest inference, great for simple tasks' },
  { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', description: 'High-quality responses with fast speed' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Good balance of speed and quality' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Google\'s Gemma model on Groq' },
] as const;

export type Provider = 'google' | 'groq';
