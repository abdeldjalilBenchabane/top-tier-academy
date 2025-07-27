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

  // Forgot password
  forgotPassword: async (email, platform = 'tth') => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, platform }),
    });
  },

  // Verify reset token
  verifyResetToken: async (token) => {
    return apiRequest('/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
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
  uploadAvatar: (id, avatarFile) => {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    
    return fetch(`${API_BASE_URL}/users/${id}/avatar`, {
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
  
  // Create course with file uploads
  submitCourseWithFiles: (formData) => {
    return fetch(`${API_BASE_URL}/courses`, {
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
  
  // Admin endpoint to scan course files
  scanFiles: () => apiRequest('/courses/admin/scan-files'),
};

// Points API calls
export const pointsAPI = {
  // Get user points balance
  getBalance: () => apiRequest('/points/balance'),
  
  // Update user points balance
  updateBalance: (points) => apiRequest('/points/balance', {
    method: 'PUT',
    body: JSON.stringify({ points }),
  }),
  
  // Get available point packages
  getPackages: () => apiRequest('/points/packages'),
  
  // Get all point packages (admin only) - includes inactive packages
  getAllPackages: () => apiRequest('/points/packages/all'),
  
  // Get user transaction history
  getTransactions: (page = 1, limit = 10) => 
    apiRequest(`/points/transactions?page=${page}&limit=${limit}`),
  
  // Create purchase transaction
  createPurchase: (purchaseData) => apiRequest('/points/purchase', {
    method: 'POST',
    body: JSON.stringify(purchaseData),
  }),
  
  // Get transaction by ID
  getTransaction: (id) => apiRequest(`/points/transaction/${id}`),

  // Buy a course with points
  buyCourse: (courseId) => apiRequest('/points/buy-course', {
    method: 'POST',
    body: JSON.stringify({ courseId }),
  }),

  // Buy a live session with points
  buyLiveSession: (sessionId) => apiRequest('/points/buy-live-session', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  }),

  // Get my own point transaction history
  getMyTransactions: () => apiRequest('/points/transactions/me'),

  // Get all purchased course IDs for the logged-in user
  getMyCourses: () => apiRequest('/points/my-courses'),

  // Get purchased live sessions for the logged-in user
  getMyLiveSessions: () => apiRequest('/points/my-live-sessions'),

  // Get purchased individual live sessions for the logged-in user
  getMyIndividualLiveSessions: () => apiRequest('/points/my-individual-live-sessions'),
};

// Payments API calls
export const paymentsAPI = {
  // Create Chargily checkout
  createCheckout: (checkoutData) => apiRequest('/payments/create-checkout', {
    method: 'POST',
    body: JSON.stringify(checkoutData),
  }),
  
  // Get transaction status
  getTransactionStatus: (id) => apiRequest(`/payments/transaction/${id}`),
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

// General API for fetching structure data
export const api = {
  getLevels: () => apiRequest('/levels'),
  getYears: () => apiRequest('/years'),
  getSpecialities: () => apiRequest('/specialities'),
  getMaterials: () => apiRequest('/materials'),
  getLanguages: () => apiRequest('/languages'),
  getLanguageLevels: () => apiRequest('/language-levels'),
  getHomeSlides: () => slidesAPI.getActive(),
  getCourses: () => coursesAPI.getAll(),
  getUsers: () => usersAPI.getAll(),
  getPendingCourses: () => apiRequest('/courses?status=pending'),
  getCourseById: (id) => coursesAPI.getById(id),
  getProfessorById: (id) => usersAPI.getById(id),
};


// Health check
export const healthAPI = {
  check: () => apiRequest('/health'),
  dbCheck: () => apiRequest('/db-health'),
};

// Structure Management API calls
export const structureAPI = {
  // Levels
  getLevels: async () => {
    const data = await apiRequest('/levels');
    return data.map(level => ({
      id: level.id,
      name: level.name
    }));
  },
  createLevel: (levelData) => apiRequest('/levels', {
    method: 'POST',
    body: JSON.stringify(levelData),
  }),
  updateLevel: (id, levelData) => apiRequest(`/levels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(levelData),
  }),
  deleteLevel: (id) => apiRequest(`/levels/${id}`, { method: 'DELETE' }),
  
  // Years
  getYears: async (levelId) => {
    const data = await (levelId ? apiRequest(`/levels/${levelId}/years`) : apiRequest('/years'));
    return data.map(year => ({
      id: year.id,
      name: year.name,
      levelId: year.levelId || year.level_id // Handle both camelCase and snake_case
    }));
  },
  createYear: (yearData) => apiRequest('/years', {
    method: 'POST',
    body: JSON.stringify(yearData),
  }),
  updateYear: (id, yearData) => apiRequest(`/years/${id}`, {
    method: 'PUT',
    body: JSON.stringify(yearData),
  }),
  deleteYear: (id) => apiRequest(`/years/${id}`, { method: 'DELETE' }),
  
  // Specialities
  getSpecialities: async (yearId) => {
    const data = await (yearId ? apiRequest(`/years/${yearId}/specialities`) : apiRequest('/specialities'));
    return data.map(speciality => ({
      id: speciality.id,
      name: speciality.name,
      yearId: speciality.yearId || speciality.year_id // Handle both camelCase and snake_case
    }));
  },
  createSpeciality: (specialityData) => apiRequest('/specialities', {
    method: 'POST',
    body: JSON.stringify(specialityData),
  }),
  updateSpeciality: (id, specialityData) => apiRequest(`/specialities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(specialityData),
  }),
  deleteSpeciality: (id) => apiRequest(`/specialities/${id}`, { method: 'DELETE' }),
  
  // Materials
  getMaterials: async (specialityId) => {
    const data = await (specialityId ? apiRequest(`/specialities/${specialityId}/materials`) : apiRequest('/materials'));
    return data.map(material => ({
      id: material.id,
      name: material.name,
      specialityId: material.specialityId || material.speciality_id,
      yearId: material.yearId || material.year_id,
      price: material.price
    }));
  },
  createMaterial: (materialData) => apiRequest('/materials', {
    method: 'POST',
    body: JSON.stringify(materialData),
  }),
  updateMaterial: (id, materialData) => apiRequest(`/materials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(materialData),
  }),
  deleteMaterial: (id) => apiRequest(`/materials/${id}`, { method: 'DELETE' }),
  
  // Languages
  getLanguages: async () => {
    const data = await apiRequest('/languages');
    return data.map(language => ({
      id: language.id,
      name: language.name,
      code: language.code,
      flag: language.flag,
      isActive: language.is_active
    }));
  },
  createLanguage: (languageData) => apiRequest('/languages', {
    method: 'POST',
    body: JSON.stringify(languageData),
  }),
  updateLanguage: (id, languageData) => apiRequest(`/languages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(languageData),
  }),
  deleteLanguage: (id) => apiRequest(`/languages/${id}`, { method: 'DELETE' }),
  
  // Language Levels
  getLanguageLevels: async (languageId) => {
    const data = await (languageId ? apiRequest(`/languages/${languageId}/levels`) : apiRequest('/language-levels'));
    return data.map(level => ({
      id: level.id,
      name: level.name,
      description: level.description,
      languageId: level.language_id,
      order: level.order,
      isActive: level.is_active
    }));
  },
  createLanguageLevel: (levelData) => apiRequest('/language-levels', {
    method: 'POST',
    body: JSON.stringify(levelData),
  }),
  updateLanguageLevel: (id, levelData) => apiRequest(`/language-levels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(levelData),
  }),
  deleteLanguageLevel: (id) => apiRequest(`/language-levels/${id}`, { method: 'DELETE' }),
};

export { getAuthToken, setAuthToken, removeAuthToken }; 