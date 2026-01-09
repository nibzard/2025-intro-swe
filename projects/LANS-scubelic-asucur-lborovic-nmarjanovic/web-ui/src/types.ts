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
  provider: 'google';
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
  { id: 'models/gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast model' },
  { id: 'models/gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro', description: 'Most capable model for complex tasks' },
  { id: 'models/gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash', description: 'Fast and cost-effective' },
] as const;
