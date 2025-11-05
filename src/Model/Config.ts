export interface Config {
  env: {
    API_BASE_PATH?: string;
  };
  get(key: string, type?: string): any;
}
