export interface User {
  id: number
  username: string
  email: string
  is_admin: boolean
}

export interface DashboardStats {
  gateway_status: 'online' | 'degraded' | 'offline'
  nvidia_connected: boolean
  default_model: string
  requests_today: number
  total_requests: number
  tokens_today: number
  avg_latency_ms: number
  online_users: number
  requests_24h: Array<{ hour: string; count: number }>
  success_rate: number
}

export interface ModelConfig {
  id: number
  model_id: string
  display_name: string
  is_enabled: boolean
  is_default: boolean
  temperature: number
  max_tokens: number
  context_length: number | null
  description: string | null
}

export interface RequestLog {
  id: number
  timestamp: string
  username: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  latency_ms: number
  status: 'success' | 'error'
  is_streaming: boolean
  error_message: string | null
  ip_address: string | null
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  gateway: { status: string; latency_ms: number }
  database: { status: string; latency_ms: number }
  nvidia: { status: string; latency_ms: number; connected: boolean }
  version: string
  uptime_seconds: number
}

export interface Settings {
  has_api_key: boolean
  gateway_name: string
  nvidia_connected: boolean
}

// Providers
export interface Provider {
  id: number
  name: string
  display_name: string
  base_url: string
  is_enabled: boolean
  is_default: boolean
  priority: number
  health_status: 'online' | 'offline' | 'unknown' | 'degraded'
  latency_ms: number
  total_requests: number
  error_rate: number
  last_health_check: string | null
}

// MCP Servers
export interface MCPServer {
  id: number
  name: string
  transport: 'stdio' | 'http' | 'sse'
  command: string | null
  args: string | null
  url: string | null
  env_vars: string | null
  is_enabled: boolean
  is_connected: boolean
  capabilities: string | null
  version: string | null
  last_seen_at: string | null
  last_error: string | null
  created_at: string
}

// Agent Profiles
export interface AgentProfile {
  id: number
  name: string
  display_name: string
  capabilities: string // JSON array string
  is_enabled: boolean
  config: string | null
}

// Routing
export interface RoutingRule {
  id: number
  name: string
  description: string | null
  is_enabled: boolean
  priority: number
  condition_type: string
  condition_value: string | null
  provider_id: number | null
  model_override: string | null
}
export interface RoutingConfig {
  mode: 'manual' | 'auto' | 'cost' | 'latency' | 'reliability'
}

// Users
export interface GatewayUser {
  id: number
  username: string
  email: string
  is_admin: boolean
  is_active: boolean
  created_at: string
  last_login: string | null
  request_count: number
  token_count: number
}
export interface GatewayToken {
  id: number
  name: string
  token_prefix: string
  scopes: string
  is_active: boolean
  last_used_at: string | null
  expires_at: string | null
  created_at: string
  token?: string // only returned on creation
}

// Analytics
export interface AnalyticsSummary {
  total_requests: number
  total_tokens: number
  total_input_tokens: number
  total_output_tokens: number
  avg_latency_ms: number
  error_rate: number
  success_rate: number
  streaming_rate: number
  top_models: Array<{ model: string; count: number; tokens: number }>
  top_users: Array<{ username: string; count: number; tokens: number }>
  requests_by_period: Array<{ period: string; count: number }>
  provider_usage: Array<{ provider: string; count: number; tokens: number }>
  errors_over_time: Array<{ period: string; count: number }>
}

// Live requests
export interface LiveRequest {
  id: number
  timestamp: string
  username: string
  model: string
  provider: string
  endpoint: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  latency_ms: number
  status: 'success' | 'error'
  is_streaming: boolean
  error_message: string | null
  ip_address: string | null
}

// Extended health
export interface ExtendedHealth extends HealthStatus {
  cpu_percent: number
  memory_percent: number
  active_connections: number
  mcp_servers: Array<{ name: string; status: string }>
  providers: Array<{ name: string; status: string }>
}

// Extended settings
export interface ExtendedSettings extends Settings {
  routing_mode: string
  streaming_enabled: boolean
  max_retries: number
  timeout_seconds: number
  max_context_tokens: number
  debug_mode: boolean
  rate_limit_rpm: number
  cache_enabled: boolean
  health_check_interval: number
}
