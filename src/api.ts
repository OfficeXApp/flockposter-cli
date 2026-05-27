import fetch, { FormData } from 'node-fetch';

export interface PostizConfig {
  apiKey: string;
  apiUrl?: string;
  timeoutMs?: number;
  verbose?: boolean;
}

export const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_RETRY_DELAY_MS = 500;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export function sanitizeApiErrorBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return 'The server returned an empty error response.';
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'string') {
      return parsed;
    }

    if (parsed && typeof parsed === 'object') {
      const candidates = [
        parsed.message,
        parsed.error,
        parsed.details,
        parsed.title,
      ];

      for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
          return candidate;
        }

        if (Array.isArray(candidate) && candidate.length > 0) {
          const first = candidate.find((item) => typeof item === 'string' && item.trim());
          if (typeof first === 'string') {
            return first;
          }
        }
      }
    }
  } catch {
    // Fall back to plaintext sanitization below.
  }

  const singleLine = trimmed.replace(/\s+/g, ' ');
  if (singleLine.length > 240) {
    return `${singleLine.slice(0, 237)}...`;
  }

  return singleLine;
}

export function shouldRetryRequest(method: string, status?: number, error?: Error): boolean {
  const normalizedMethod = method.toUpperCase();
  const retryableMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

  if (status !== undefined) {
    return retryableMethods.has(normalizedMethod) && RETRYABLE_STATUS_CODES.has(status);
  }

  if (!error) {
    return false;
  }

  return retryableMethods.has(normalizedMethod);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class PostizAPI {
  private apiKey: string;
  private apiUrl: string;
  private timeoutMs: number;
  private verbose: boolean;

  constructor(config: PostizConfig) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || 'https://app.flockposter.com/api';
    this.timeoutMs = config.timeoutMs || DEFAULT_TIMEOUT_MS;
    this.verbose = config.verbose || false;
  }

  private createErrorMessage(status: number, rawBody: string) {
    const safeBody = sanitizeApiErrorBody(rawBody);
    if (this.verbose && rawBody.trim()) {
      return `API Error (${status}): ${rawBody}`;
    }
    return `API Error (${status}): ${safeBody}`;
  }

  private async request(endpoint: string, options: any = {}, requestOptions: { retries?: number } = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();
    const headers = {
      'Content-Type': 'application/json',
      Authorization: this.apiKey,
      ...options.headers,
    };

    const maxAttempts = 1 + (requestOptions.retries || 0);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorBody = await response.text();
          const requestError = new Error(this.createErrorMessage(response.status, errorBody));

          if (attempt < maxAttempts && shouldRetryRequest(method, response.status)) {
            await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
            continue;
          }

          throw requestError;
        }

        return await response.json();
      } catch (error: any) {
        const isAbort = error?.name === 'AbortError';
        const message = isAbort
          ? `Request timed out after ${this.timeoutMs}ms`
          : `Request failed: ${error.message}`;

        if (attempt < maxAttempts && shouldRetryRequest(method, undefined, error)) {
          await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
          continue;
        }

        throw new Error(message);
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new Error('Request failed: retry policy exhausted');
  }

  async createPost(data: any) {
    return this.request('/public/v1/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listPosts(filters: any = {}) {
    const queryString = new URLSearchParams(
      Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    const endpoint = queryString
      ? `/public/v1/posts?${queryString}`
      : '/public/v1/posts';

    return this.request(endpoint, {
      method: 'GET',
    }, {
      retries: 2,
    });
  }

  async deletePost(id: string) {
    return this.request(`/public/v1/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async upload(file: Buffer, filename: string) {
    const formData = new FormData();
    const extension = filename.split('.').pop()?.toLowerCase() || '';

    // Determine MIME type based on file extension
    const mimeTypes: Record<string, string> = {
      // Images
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',

      // Videos
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'mkv': 'video/x-matroska',
      'webm': 'video/webm',
      'flv': 'video/x-flv',
      'wmv': 'video/x-ms-wmv',
      'm4v': 'video/x-m4v',
      'mpeg': 'video/mpeg',
      'mpg': 'video/mpeg',
      '3gp': 'video/3gpp',

      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'aac': 'audio/aac',
      'flac': 'audio/flac',
      'm4a': 'audio/mp4',

      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    const type = mimeTypes[extension] || 'application/octet-stream';

    const blob = new Blob([file], { type });
    formData.append('file', blob, filename);

    const url = `${this.apiUrl}/public/v1/upload`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        // @ts-ignore
        body: formData,
        headers: {
          Authorization: this.apiKey,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(this.createErrorMessage(response.status, errorBody));
      }

      return await response.json();
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error(`Upload failed: request timed out after ${this.timeoutMs}ms`);
      }

      throw new Error(`Upload failed: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  async getMissingContent(postId: string) {
    return this.request(`/public/v1/posts/${postId}/missing`, {
      method: 'GET',
    }, {
      retries: 2,
    });
  }

  async updateReleaseId(postId: string, releaseId: string) {
    return this.request(`/public/v1/posts/${postId}/release-id`, {
      method: 'PUT',
      body: JSON.stringify({ releaseId }),
    });
  }

  async getAnalytics(integrationId: string, date: string) {
    return this.request(`/public/v1/analytics/${integrationId}?date=${encodeURIComponent(date)}`, {
      method: 'GET',
    }, {
      retries: 2,
    });
  }

  async getPostAnalytics(postId: string, date: string) {
    return this.request(`/public/v1/analytics/post/${postId}?date=${encodeURIComponent(date)}`, {
      method: 'GET',
    }, {
      retries: 2,
    });
  }

  async listIntegrations() {
    return this.request('/public/v1/integrations', {
      method: 'GET',
    }, {
      retries: 2,
    });
  }

  async getIntegrationSettings(integrationId: string) {
    return this.request(`/public/v1/integration-settings/${integrationId}`, {
      method: 'GET',
    }, {
      retries: 2,
    });
  }

  async triggerIntegrationTool(
    integrationId: string,
    methodName: string,
    data: Record<string, string>
  ) {
    return this.request(`/public/v1/integration-trigger/${integrationId}`, {
      method: 'POST',
      body: JSON.stringify({ methodName, data }),
    });
  }
}
