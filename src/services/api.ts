import { useAuthStore } from '../stores/authStore';
import config from '../config';

const API_URL = `${config.apiUrl}/api`;

// Helper function to create fetch options with authorization header
const createFetchOptions = (method: string, body?: any) => {
  const { token } = useAuthStore.getState();
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add authorization header if token exists
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  // Add body if provided
  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
};

// Экспортируем API_URL для использования в других частях приложения
export { API_URL };

export const AuthService = {
  // Login user
  login: async (username: string, password: string) => {
    try {
      // Try with form-urlencoded format for OAuth2PasswordRequestForm
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData,
        });
        
        if (response.ok) {
          return await response.json();
        }
        
        // If form login failed, try the JSON endpoint
        console.log('Form login failed, trying JSON endpoint');
      } catch (error) {
        console.error('Form login error:', error);
        // Continue to JSON fallback
      }
      
      // Fallback to JSON login
      const jsonResponse = await fetch(`${API_URL}/auth/login-json`, 
        createFetchOptions('POST', { username, password })
      );
      
      if (!jsonResponse.ok) {
        const error = await jsonResponse.json();
        throw new Error(error.detail || 'Login failed');
      }
      
      return await jsonResponse.json();
    } catch (error) {
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, createFetchOptions('GET'));
      if (!response.ok) {
        throw new Error('Failed to get current user');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};

export const UserService = {
  // Get all users (admin only)
  getUsers: async () => {
    try {
      const response = await fetch(`${API_URL}/users`, createFetchOptions('GET'));
      if (!response.ok) {
        throw new Error('Failed to get users');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};

export const FileService = {
  // Upload CSV file
  uploadFile: async (file: File, userId: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId.toString());

    const { token } = useAuthStore.getState();
    
    try {
      const response = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
  
  // Get user files
  getUserFiles: async (userId: number) => {
    try {
      const response = await fetch(`${API_URL}/files/user/${userId}`, createFetchOptions('GET'));
      if (!response.ok) {
        throw new Error('Failed to get user files');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
}; 