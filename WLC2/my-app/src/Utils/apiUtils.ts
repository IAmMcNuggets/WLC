import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * Creates a configured axios instance for API calls
 * @param baseUrl The base URL for API requests
 * @param headers Additional headers to include in requests
 * @returns Configured axios instance
 */
export const createApiClient = (baseUrl: string, headers: Record<string, string> = {}) => {
  return axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
};

/**
 * Handles API errors consistently
 * @param error The error from an API call
 * @param defaultMessage Default message to return if error details are not available
 * @returns Error message string
 */
export const handleApiError = (error: unknown, defaultMessage: string = 'An unexpected error occurred'): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Handle server response errors
    if (axiosError.response) {
      // Try to get detailed error from response data
      const data = axiosError.response.data as any;
      if (data?.message) {
        return data.message;
      }
      if (data?.error) {
        return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      }
      
      // Fallback to status text
      return `${axiosError.response.status}: ${axiosError.response.statusText || defaultMessage}`;
    }
    
    // Handle network errors
    if (axiosError.request) {
      return 'Network error: Please check your internet connection';
    }
    
    // Handle other axios errors
    return axiosError.message;
  }
  
  // Handle non-axios errors
  if (error instanceof Error) {
    return error.message;
  }
  
  // Default case
  return defaultMessage;
};

/**
 * Makes an API request with retries
 * @param apiCall The API call function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param delay Delay between retries in milliseconds
 * @returns Promise resolving to the API response
 */
export const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // If not the last attempt, wait before retrying
        const backoffDelay = delay * Math.pow(2, attempt);
        console.log(`API call failed, retrying in ${backoffDelay}ms... (${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError;
};

/**
 * Creates pagination parameters for API requests
 * @param page Current page number (1-based)
 * @param perPage Number of items per page
 * @returns Object with pagination parameters
 */
export const getPaginationParams = (page: number = 1, perPage: number = 20): Record<string, number> => {
  return {
    page,
    per_page: perPage
  };
};

/**
 * Adds query parameters to a URL
 * @param baseUrl Base URL
 * @param params Object containing query parameters
 * @returns URL with query parameters
 */
export const addQueryParams = (baseUrl: string, params: Record<string, any>): string => {
  const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://placeholder.com${baseUrl}`);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return baseUrl.startsWith('http') ? url.toString() : url.pathname + url.search;
};

/**
 * Formats API parameters for nested filters (e.g., for Ruby on Rails API)
 * @param prefix Filter prefix
 * @param filters Object containing filters
 * @returns Formatted filter parameters
 */
export const formatNestedParams = (prefix: string, filters: Record<string, any>): Record<string, string> => {
  const formattedParams: Record<string, string> = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formattedParams[`${prefix}[${key}]`] = String(value);
    }
  });
  
  return formattedParams;
}; 