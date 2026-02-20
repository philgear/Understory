declare const GEMINI_API_KEY: string;

interface Window {
  aistudio: {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  };
}

declare namespace NodeJS {
  interface ProcessEnv {
    GEMINI_API_KEY: string;
  }
}
