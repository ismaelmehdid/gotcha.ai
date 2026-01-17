export type ResponseWrapper<T> =
  | { result: 'success'; payload: T }
  | { result: 'failure'; reason: string };
