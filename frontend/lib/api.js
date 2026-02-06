import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            window.location.href = '/login'
          }
          return Promise.reject(error)
        }

        // Try to refresh the token
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh-token`,
          { refreshToken }
        )

        const { accessToken } = response.data.data

        // Save new access token
        localStorage.setItem('accessToken', accessToken)

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  getCurrentUser: () => api.get('/auth/me'),
  requestPasswordReset: (email) => api.post('/auth/request-password-reset', { email }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.post('/auth/change-password', data),
}

export const itemsAPI = {
  getAll: (params) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.patch(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
  search: (query) => api.get('/items/search', { params: { q: query } }),
  getLowStock: () => api.get('/items/low-stock'),
  getStatistics: () => api.get('/items/statistics'),
  restock: (id, data) => api.post(`/items/${id}/restock`, data),
  addImages: (id, files) => {
    const formData = new FormData()
    files.forEach(file => formData.append('images', file))
    return api.post(`/items/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  removeImage: (itemId, imageId) => api.delete(`/items/${itemId}/images/${imageId}`),
  setPrimaryImage: (itemId, imageId) => api.patch(`/items/${itemId}/images/${imageId}/primary`),
}

export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.patch(`/categories/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/categories/${id}`),
  getStatistics: () => api.get('/categories/statistics'),
  getCategoryWithItems: (id, params) => api.get(`/categories/${id}/items`, { params }),
}

export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  cancel: (id, reason) => api.post(`/sales/${id}/cancel`, { reason }),
  updatePayment: (id, data) => api.patch(`/sales/${id}/payment`, data),
  getStatistics: (params) => api.get('/sales/statistics', { params }),
  getTopSelling: (params) => api.get('/sales/top-selling', { params }),
  getDailyReport: (params) => api.get('/sales/reports/daily', { params }),
  getMonthlyReport: (params) => api.get('/sales/reports/monthly', { params }),
  getByPaymentMethod: (params) => api.get('/sales/payment-methods', { params }),
}

export const alertsAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  getUnread: () => api.get('/alerts/unread'),
  getUnresolved: (params) => api.get('/alerts/unresolved', { params }),
  getCritical: () => api.get('/alerts/critical'),
  getStatistics: () => api.get('/alerts/statistics'),
  markAsRead: (id) => api.post(`/alerts/${id}/read`),
  markMultipleAsRead: (ids) => api.post('/alerts/mark-multiple-read', { alertIds: ids }),
  markAllAsRead: () => api.post('/alerts/mark-all-read'),
  resolve: (id, notes) => api.post(`/alerts/${id}/resolve`, { notes }),
  delete: (id) => api.delete(`/alerts/${id}`),
}

export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getSalesAnalytics: (params) => api.get('/dashboard/analytics/sales', { params }),
  getInventoryAnalytics: () => api.get('/dashboard/analytics/inventory'),
  getRecentActivity: (params) => api.get('/dashboard/activity', { params }),
  getExecutiveSummary: () => api.get('/dashboard/executive-summary'),
}

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  changeRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  updateProfile: (data) => api.patch('/users/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getStatistics: () => api.get('/users/statistics'),
  getActivity: (id) => api.get(`/users/${id}/activity`),
}