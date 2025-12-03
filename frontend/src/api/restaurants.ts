import api from './axios';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface RestaurantQueue {
  id: string;
  name: string;
  isActive: boolean;
  waitingCount?: number;
  entries?: Array<{
    id: string;
    status: string;
    position: number;
  }>;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  type?: string | null;
  description?: string | null;
  longDescription?: string | null;
  menuText?: string | null;
  ownerId: string;
  createdAt: string;
  queues: RestaurantQueue[];
}

export interface UpdateRestaurantInput {
  name?: string;
  address?: string;
  type?: string;
  description?: string;
  longDescription?: string;
  menuText?: string;
}

export const restaurantsApi = {
  /**
   * Search restaurants by name or address
   */
  search: async (query: string, limit?: number): Promise<ApiResponse<Restaurant[]>> => {
    const params = new URLSearchParams();
    params.set('q', query);
    if (limit) params.set('limit', String(limit));
    
    const response = await api.get<ApiResponse<Restaurant[]>>(`/restaurants/search?${params}`);
    return response.data;
  },

  /**
   * Get all restaurants
   */
  getAll: async (limit?: number): Promise<ApiResponse<Restaurant[]>> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get<ApiResponse<Restaurant[]>>(`/restaurants${params}`);
    return response.data;
  },

  /**
   * Get restaurant by ID
   */
  getById: async (restaurantId: string): Promise<ApiResponse<Restaurant>> => {
    const response = await api.get<ApiResponse<Restaurant>>(`/restaurants/${restaurantId}`);
    return response.data;
  },

  /**
   * Get owner's restaurant
   */
  getMyRestaurant: async (): Promise<ApiResponse<Restaurant>> => {
    const response = await api.get<ApiResponse<Restaurant>>('/restaurants/my-restaurant');
    return response.data;
  },

  /**
   * Update owner's restaurant
   */
  updateMyRestaurant: async (data: UpdateRestaurantInput): Promise<ApiResponse<Restaurant>> => {
    const response = await api.patch<ApiResponse<Restaurant>>('/restaurants/my-restaurant', data);
    return response.data;
  },
};

export default restaurantsApi;

