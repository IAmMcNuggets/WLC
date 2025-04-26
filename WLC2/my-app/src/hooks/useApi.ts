import { useState, useCallback, useEffect } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

interface UseApiProps<T> {
  url: string;
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
  options?: AxiosRequestConfig;
  initialData?: T | null;
  immediate?: boolean;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (overrideOptions?: AxiosRequestConfig) => Promise<T | null>;
  reset: () => void;
}

// Create a reusable API client
export const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

function useApi<T = any>({
  url,
  method = 'get',
  options = {},
  initialData = null as T | null,
  immediate = false,
}: UseApiProps<T>): UseApiResult<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (overrideOptions: AxiosRequestConfig = {}): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);

        const mergedOptions = { ...options, ...overrideOptions };
        const response: AxiosResponse<T> = await apiClient({
          url,
          method,
          ...mergedOptions,
        });

        const result = response.data;
        setData(result);
        return result;
      } catch (err) {
        const error = err as AxiosError;
        const errorData = error.response?.data as any;
        const errorMessage = errorData?.message || error.message || 'An unknown error occurred';
        const customError = new Error(errorMessage);
        setError(customError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url, method, options]
  );

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, execute, reset };
}

export default useApi; 