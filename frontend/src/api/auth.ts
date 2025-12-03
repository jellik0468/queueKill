import api from './axios';
import type { User } from '@/store/authStore';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface AuthData {
  user: User;
  token: string;
}

interface RegisterCustomerInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface RegisterOwnerInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantType?: string;
  restaurantDescription?: string;
  restaurantLongDescription?: string;
  restaurantMenuText?: string;
  initialQueueName?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  /**
   * Register as customer
   */
  registerCustomer: async (data: RegisterCustomerInput): Promise<ApiResponse<AuthData>> => {
    const response = await api.post<ApiResponse<AuthData>>('/auth/register-customer', data);
    return response.data;
  },

  /**
   * Register as owner
   */
  registerOwner: async (data: RegisterOwnerInput): Promise<ApiResponse<AuthData>> => {
    const response = await api.post<ApiResponse<AuthData>>('/auth/register-owner', data);
    return response.data;
  },

  /**
   * Login
   */
  login: async (data: LoginInput): Promise<ApiResponse<AuthData>> => {
    const response = await api.post<ApiResponse<AuthData>>('/auth/login', data);
    return response.data;
  },

  /**
   * Get current user
   */
  me: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },
};

export default authApi;
