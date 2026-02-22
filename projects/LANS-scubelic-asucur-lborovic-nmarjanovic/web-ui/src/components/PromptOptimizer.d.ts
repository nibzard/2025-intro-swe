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
export declare function PromptOptimizer({ currentPrompt, onOptimize, apiKey, provider, modelName, competitors, myBrands, theme }: PromptOptimizerProps): import("react/jsx-runtime").JSX.Element;
export {};
