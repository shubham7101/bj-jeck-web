const BASE_URL = import.meta.env.VITE_API_URL;

export const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // await new Promise((resolve) => setTimeout(resolve, 1500));
  const response = await fetch(BASE_URL + endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.statusText}`);
  }

  // Handle 204 No Content (like Delete operations)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};
