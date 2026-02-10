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
  answers: Answer[];
}

export interface Answer {
  answer: string;
  model: string;
  cost_usd: number;
  mentions: BrandMention[];
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
] as const;

export type Provider = 'google' | 'groq';

// Authentication types
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string | null;
  token_type: string;
}

export interface StoredAPIKey {
  id: number;
  provider: string;
  key_name: string | null;
  created_at: string;
  last_used_at: string | null;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface APIKeyCreateRequest {
  provider: string;
  api_key: string;
  key_name?: string;
}

export interface UserBrand {
  id: number;
  brand_name: string;
  is_mine: boolean;
  created_at: string;
}

export interface UserIntent {
  id: number;
  intent_alias: string;
  prompt: string;
  created_at: string;
}

export interface BrandCreateRequest {
  brand_name: string;
  is_mine: boolean;
}

export interface IntentCreateRequest {
  intent_alias: string;
  prompt: string;
}

export const INTENT_TEMPLATES = [
  { id: 'pricing-compare', label: 'Pricing Comparison', prompt: 'Compare the pricing models of [MyBrand] vs [Competitor]. Which offers better value for small businesses?' },
  { id: 'feature-analysis', label: 'Feature Analysis', prompt: 'What are the key feature differences between [MyBrand] and [Competitor]? Highlight unique selling points.' },
  { id: 'sentiment-check', label: 'Brand Sentiment', prompt: 'What is the general user sentiment towards [MyBrand] in 2024? Mention common praises and complaints.' },
  { id: 'alternatives', label: 'Best Alternatives', prompt: 'What are the top 3 alternatives to [Competitor] and why should I consider [MyBrand]?' },
  { id: 'security-review', label: 'Security Review', prompt: 'How does [MyBrand] compare to [Competitor] in terms of security and compliance certifications?' },
];