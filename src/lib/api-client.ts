export class ApiError extends Error {
  code?: number;
  type?: string;
  details?: any;
  resolution?: string;

  constructor(
    message: string,
    options: {
      code?: number;
      type?: string;
      details?: any;
      resolution?: string;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.type = options.type;
    this.details = options.details;
    this.resolution = options.resolution;
  }
}

export const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  // await new Promise((resolve) => setTimeout(resolve, 1500));
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `API Error: ${response.statusText}`,
      {
        code: errorData.code || response.status,
        type: errorData.type,
        details: errorData.details,
        resolution: errorData.resolution,
      },
    );
  }

  // Handle 204 No Content (like Delete operations)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};
