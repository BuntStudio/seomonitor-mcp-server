import axios, { AxiosInstance } from 'axios';
import { UserSession, ApiResponse, BackendApiClient } from '../types.js';
import { logger } from '../logger.js';

export class DynamicApiClient implements BackendApiClient {
  private axiosInstance: AxiosInstance;

  constructor(private session: UserSession) {
    this.axiosInstance = axios.create({
      baseURL: session.baseUrl,
      headers: {
        'Authorization': `Bearer ${session.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Add response interceptor for consistent error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error(`API Error for user ${session.userId}:`, error.message);
        throw error;
      }
    );
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      logger.debug(`GET ${endpoint} for user ${this.session.userId}`);
      const response = await this.axiosInstance.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      logger.error(`GET ${endpoint} failed for user ${this.session.userId}`, error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      logger.debug(`POST ${endpoint} for user ${this.session.userId}`, data);
      const response = await this.axiosInstance.post(endpoint, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      logger.error(`POST ${endpoint} failed for user ${this.session.userId}`, error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      logger.debug(`PUT ${endpoint} for user ${this.session.userId}`, data);
      const response = await this.axiosInstance.put(endpoint, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      logger.error(`PUT ${endpoint} failed for user ${this.session.userId}`, error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      logger.debug(`DELETE ${endpoint} for user ${this.session.userId}`);
      const response = await this.axiosInstance.delete(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      logger.error(`DELETE ${endpoint} failed for user ${this.session.userId}`, error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Update session (useful for refreshing API keys)
  updateSession(newSession: UserSession) {
    this.session = newSession;
    this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${newSession.apiKey}`;
    this.axiosInstance.defaults.baseURL = newSession.baseUrl;
    logger.info(`Updated session for user ${newSession.userId}`);
  }
}