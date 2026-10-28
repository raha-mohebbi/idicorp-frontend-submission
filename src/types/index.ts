/**
 * Domain & API Type Definitions
 * IDICorp Service Console
 */

// ==========================================
// Authentication Types
// ==========================================

export interface CaptchaData {
  captcha: string; // Base64 data URL (e.g. data:image/jpeg;base64,...)
  salt: string;
}

export interface LoginPayload {
  username: string;
  password: string;
  salt: string;
  captcha_answer: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { username: string } | null;
}

// ==========================================
// Task Types
// ==========================================

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  completed?: boolean;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  completed?: boolean;
}

export interface TaskFilterParams {
  q?: string;
  completed?: boolean;
}

export type TaskStatusFilter = 'all' | 'completed' | 'pending';

// ==========================================
// Calculator WebSocket Types
// ==========================================

export type CalculatorOperation = 'add' | 'subtract' | 'multiply' | 'divide';

export interface CalculatorAuthMessage {
  token: string;
}

export interface CalculatorRequestPayload {
  operation?: CalculatorOperation;
  numbers: number[];
}

export interface CalculatorReadyMessage {
  type: 'ready';
}

export interface CalculatorSuccessMessage {
  result: number;
  value?: number;
  output?: number;
}

export interface CalculatorErrorMessage {
  error: string;
  type?: string;
  message?: string;
}

export type CalculatorServerMessage =
  | CalculatorReadyMessage
  | CalculatorSuccessMessage
  | CalculatorErrorMessage
  | { [key: string]: unknown };

export interface CalculatorHistoryItem {
  id: string;
  operation: CalculatorOperation;
  numbers: number[];
  result: number;
  timestamp: number;
}

// ==========================================
// Echo Types
// ==========================================

export type EchoMessageKind = 'sent' | 'received' | 'system';

export interface EchoMessage {
  id: string;
  kind: EchoMessageKind;
  text: string;
  timestamp: number;
}

export interface EchoReadyMessage {
  type: 'ready';
}

// ==========================================
// WebSocket Helper Types
// ==========================================

export type SocketState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';

export interface WebSocketOptions {
  headers?: Record<string, string>;
  protocols?: string | string[];
  onOpen?: (event: Event) => void;
  onMessage?: (data: unknown, rawEvent: MessageEvent) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

// ==========================================
// API Error Types
// ==========================================

export interface ApiValidationErrorDetail {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

export interface ApiErrorData {
  detail?: string | ApiValidationErrorDetail[];
  message?: string;
}
