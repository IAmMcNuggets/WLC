import { useState, useCallback, useMemo } from 'react';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

interface CurrentRMSHookResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  fetchData: (endpoint: string, params?: Record<string, any>) => Promise<T | null>;
  rmsApi: AxiosInstance;
}

const useCurrentRms = <T = any>(): CurrentRMSHookResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Create a memoized axios instance for Current RMS API
  const rmsApi = useMemo(() => {
    return axios.create({
      baseURL: '/api/v1',
      headers: {
        'Content-Type': 'application/json',
        'X-CurrentRMS-Token': process.env.REACT_APP_CURRENT_RMS_TOKEN || '',
        'X-SubDomain': process.env.REACT_APP_CURRENT_RMS_SUBDOMAIN || '',
      },
    });
  }, []);

  const fetchWithRetry = useCallback(async <R>(
    endpoint: string,
    options: AxiosRequestConfig = {},
    retries = 3,
    delay = 1000
  ): Promise<R | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await rmsApi.request<R>({
        url: endpoint,
        ...options,
      });
      
      setData(response.data as unknown as T);
      return response.data;
    } catch (err) {
      if (retries > 0) {
        console.log(`Retrying ${endpoint}... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(endpoint, options, retries - 1, delay * 1.5);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error(`Error fetching from ${endpoint}:`, err);
        setError(new Error(`API Error: ${errorMessage}`));
        return null;
      }
    } finally {
      setLoading(false);
    }
  }, [rmsApi]);

  const fetchData = useCallback(async (
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T | null> => {
    return fetchWithRetry<T>(endpoint, { params });
  }, [fetchWithRetry]);

  return { data, loading, error, fetchData, rmsApi };
};

export default useCurrentRms; 