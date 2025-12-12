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
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', description: 'Latest experimental model - Free during preview' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Most capable model for complex tasks' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and cost-effective' },
  { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', description: 'Smallest and fastest model' },
] as const;
