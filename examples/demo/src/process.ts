import * as processShim from 'process/browser';

try {
  process?.platform;
} catch (error) {
  globalThis.process = processShim;
}
