export type TokenProvider = () => string | null | Promise<string | null>;
export type UnauthorizedHandler = () => void | Promise<void>;

export type CreateApiClientOptions = {
  baseUrl: string;
  getToken?: TokenProvider;
  onUnauthorized?: UnauthorizedHandler;
  defaultHeaders?: HeadersInit;
};

export type ApiFetchOptions = RequestInit & {
  skipAuth?: boolean;
  token?: string | null;
};

export type ApiFetcher = <T>(path: string, options?: ApiFetchOptions) => Promise<T>;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let configuredApiFetch: ApiFetcher | null = null;
let configuredBaseUrl = "";

export function createApiClient({
  baseUrl,
  getToken,
  onUnauthorized,
  defaultHeaders,
}: CreateApiClientOptions) {
  return async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
    const { skipAuth, token: explicitToken, headers: optionHeaders, ...requestOptions } = options ?? {};
    const resolvedToken =
      explicitToken !== undefined
        ? explicitToken
        : !skipAuth && getToken
          ? await getToken()
          : null;

    const headers = {
      "Content-Type": "application/json",
      ...(defaultHeaders ?? {}),
      ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
      ...(optionHeaders ?? {}),
    };

    const response = await fetch(`${baseUrl}${path}`, {
      ...requestOptions,
      headers,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message =
        body?.error?.message
        ?? body?.message
        ?? (typeof body?.error === "string" ? body.error : null)
        ?? `Request failed (${response.status})`;

      if (response.status === 401 && onUnauthorized) {
        await onUnauthorized();
      }

      throw new ApiError(message, response.status);
    }

    if (response.status === 204 || response.status === 205) {
      return undefined as T;
    }

    const raw = await response.text();
    if (!raw.trim()) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return JSON.parse(raw) as T;
    }

    return raw as T;
  };
}

export function configureApiClient(options: CreateApiClientOptions): ApiFetcher {
  configuredBaseUrl = options.baseUrl;
  configuredApiFetch = createApiClient(options);
  return configuredApiFetch;
}

export function getConfiguredApiBaseUrl(): string {
  return configuredBaseUrl;
}

export function resetApiClient(): void {
  configuredApiFetch = null;
  configuredBaseUrl = "";
}

export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  if (!configuredApiFetch) {
    throw new Error("API client is not configured.");
  }

  return configuredApiFetch<T>(path, options);
}
