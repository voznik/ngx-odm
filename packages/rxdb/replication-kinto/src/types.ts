const DEFAULT_BUCKET_NAME = 'default';
const DEFAULT_REMOTE = 'http://localhost:8888/v1';
const DEFAULT_RETRY = 1;

export interface Emitter {
  emit(type: string, event?: any): void;
  on(type: string, handler: (event?: any) => void): void;
  off(type: string, handler: (event?: any) => void): void;
}

export interface KintoBaseOptions {
  remote?: string;
  bucket?: string;
  events?: Emitter;
  adapter?: (
    dbName: string,
    options?: { dbName?: string; migrateOldData?: boolean }
  ) => any;
  adapterOptions?: object;
  headers?: Record<string, string>;
  retry?: number;
  requestMode?: RequestMode;
  timeout?: number;
}
