/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_RESELLER_API_KEY: string;
    readonly VITE_RESELLER_USER_ID: string;
    // Add more VITE_ variables here as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  