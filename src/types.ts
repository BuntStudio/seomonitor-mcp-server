export interface UserSession {
  userId: string;
  apiKey: string;
  baseUrl: string;
  sessionId?: string;
}

export interface SEOMonitorUserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  job_title?: string;
  initials?: string;
  token: string;
  trends_notification?: boolean;
  user_photo?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BackendApiClient {
  get<T>(endpoint: string): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, data: any): Promise<ApiResponse<T>>;
  put<T>(endpoint: string, data: any): Promise<ApiResponse<T>>;
  delete<T>(endpoint: string): Promise<ApiResponse<T>>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// MCP Server specific types
export interface MCPServerConfig {
  transport: 'stdio' | 'http' | 'websocket';
  port?: number;
  host?: string;
  apiKey?: string;
  enableAuth?: boolean;
  corsOrigin?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  logFile?: string;
}

export interface MCPAuthContext {
  apiKey?: string;
  userId?: string;
  authenticated: boolean;
}

export interface MCPToolRequest {
  name: string;
  arguments: Record<string, any>;
  authContext: MCPAuthContext;
}

export interface MCPToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}