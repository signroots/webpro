export interface CloudflareRegistrarDomain {
  name: string;
  expires_at?: string;
  registered_at?: string;
  current_registrar?: string;
  locked?: boolean;
  name_servers?: string[];
  last_known_status?: string;
}
