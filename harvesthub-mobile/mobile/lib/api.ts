import { API_BASE_URL } from '@/lib/config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
}

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const fullUrl = `${API_BASE_URL}${path}`;

  let response;
  try {
    response = await fetch(fullUrl, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('Network request failed - server unreachable');
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message || payload?.title || payload?.error || 'Ошибка запроса к серверу';
    throw new ApiError(message, response.status);
  }

  if (payload && payload.success === false) {
    throw new ApiError(payload.message || 'Ошибка ответа API', response.status);
  }

  return payload?.data ?? payload;
}
