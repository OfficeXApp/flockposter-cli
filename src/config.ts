import { PostizConfig } from './api';

interface ConfigOptions {
  timeout?: number;
  verbose?: boolean;
}

export function getConfig(options: ConfigOptions = {}): PostizConfig {
  const apiKey = process.env.FLOCKPOSTER_API_KEY;
  const apiUrl = process.env.FLOCKPOSTER_API_URL;
  const envTimeout = process.env.FLOCKPOSTER_TIMEOUT_MS;
  const envVerbose = process.env.FLOCKPOSTER_VERBOSE;

  if (!apiKey) {
    console.error('❌ Error: FLOCKPOSTER_API_KEY environment variable is required');
    console.error('Please set it using: export FLOCKPOSTER_API_KEY=your_api_key');
    process.exit(1);
  }

  let timeoutMs = options.timeout;
  if (timeoutMs === undefined && envTimeout) {
    timeoutMs = Number(envTimeout);
  }

  if (timeoutMs !== undefined && (!Number.isFinite(timeoutMs) || timeoutMs <= 0)) {
    console.error('❌ Error: timeout must be a positive number of milliseconds');
    process.exit(1);
  }

  const verbose =
    options.verbose !== undefined
      ? options.verbose
      : envVerbose === '1' || envVerbose === 'true';

  return {
    apiKey,
    apiUrl,
    timeoutMs,
    verbose,
  };
}
