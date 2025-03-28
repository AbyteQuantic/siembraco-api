export interface FirebaseAuthError extends Error {
  code?: string;
  message: string;
  errorInfo?: {
    code: string;
    message: string;
  };
  customData?: {
    appName?: string;
    [key: string]: any;
  };
}
