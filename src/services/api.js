const API_BASE_URL = 'http://localhost:5001/api';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to set auth token in localStorage
const setAuthToken = (token) => {
  localStorage.setItem('token', token);
};

// Helper function to remove auth token from localStorage
const removeAuthToken = () => {
  localStorage.removeItem('token');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Authentication API calls
export const authAPI = {
  // Login
  login: async (email, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  // Register
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  // Logout
  logout: () => {
    removeAuthToken();
    return apiRequest('/auth/logout', { method: 'POST' });
  },

  // Get current user
  getCurrentUser: () => {
    return apiRequest('/auth/me');
  },

  // Verify token
  verifyToken: () => {
    return apiRequest('/auth/verify', { method: 'POST' });
  },
};

// Users API calls
export const usersAPI = {
  getAll: () => apiRequest('/users'),
  getById: (id) => apiRequest(`/users/${id}`),
  create: (userData) => apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  update: (id, userData) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
  delete: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' }),
};

// Courses API calls
export const coursesAPI = {
  getAll: () => apiRequest('/courses'),
  getById: (id) => apiRequest(`/courses/${id}`),
  create: (courseData) => apiRequest('/courses', {
    method: 'POST',
    body: JSON.stringify(courseData),
  }),
  update: (id, courseData) => apiRequest(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(courseData),
  }),
  delete: (id) => apiRequest(`/courses/${id}`, { method: 'DELETE' }),
  getMaterials: () => apiRequest('/courses/materials/list'),
};

// Slides API calls
export const slidesAPI = {
  // Get all slides (admin only)
  getAll: () => apiRequest('/slides'),
  
  // Get active slides for homepage (public)
  getActive: (role = 'student') => apiRequest(`/slides/active?role=${role}`),
  
  // Get single slide
  getById: (id) => apiRequest(`/slides/${id}`),
  
  // Create new slide
  create: (slideData) => {
    const formData = new FormData();
    
    // Add file if present
    if (slideData.media) {
      formData.append('media', slideData.media);
    }
    
    // Add other fields
    Object.keys(slideData).forEach(key => {
      if (key !== 'media') {
        if (typeof slideData[key] === 'object') {
          formData.append(key, JSON.stringify(slideData[key]));
        } else {
          formData.append(key, slideData[key]);
        }
      }
    });
    
    return fetch(`${API_BASE_URL}/slides`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },
  
  // Update slide
  update: (id, slideData) => {
    const formData = new FormData();
    
    // Add file if present
    if (slideData.media) {
      formData.append('media', slideData.media);
    }
    
    // Add other fields
    Object.keys(slideData).forEach(key => {
      if (key !== 'media') {
        if (typeof slideData[key] === 'object') {
          formData.append(key, JSON.stringify(slideData[key]));
        } else {
          formData.append(key, slideData[key]);
        }
      }
    });
    
    return fetch(`${API_BASE_URL}/slides/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },
  
  // Delete slide
  delete: (id) => apiRequest(`/slides/${id}`, { method: 'DELETE' }),
  
  // Bulk reorder slides
  reorder: (slides) => apiRequest('/slides/reorder', {
    method: 'POST',
    body: JSON.stringify({ slides }),
  }),
  
  // Track slide view
  trackView: (id, userAgent) => apiRequest(`/slides/${id}/view`, {
    method: 'POST',
    body: JSON.stringify({ userAgent }),
  }),
  
  // Track slide click
  trackClick: (id, userAgent) => apiRequest(`/slides/${id}/click`, {
    method: 'POST',
    body: JSON.stringify({ userAgent }),
  }),
  
  // Get slide analytics
  getAnalytics: (id, period = '7d') => apiRequest(`/slides/${id}/analytics?period=${period}`),
};

// Health check
export const healthAPI = {
  check: () => apiRequest('/health'),
  dbCheck: () => apiRequest('/db-health'),
};

export { getAuthToken, setAuthToken, removeAuthToken }; 