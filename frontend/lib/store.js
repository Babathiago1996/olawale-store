import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      
      setAuth: (user, accessToken, refreshToken) => set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
      }),
      
      updateUser: (user) => set({ user }),
      
      logout: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      }),
      
      getToken: () => get().accessToken,
      
      hasRole: (role) => {
        const user = get().user
        if (!user) return false
        if (Array.isArray(role)) {
          return role.includes(user.role)
        }
        return user.role === role
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  })),
}))

export const useCartStore = create((set, get) => ({
  items: [],
  
  addItem: (item, quantity = 1) => set((state) => {
    const existingItem = state.items.find(i => i._id === item._id)
    
    if (existingItem) {
      return {
        items: state.items.map(i =>
          i._id === item._id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        ),
      }
    }
    
    return {
      items: [...state.items, { ...item, quantity }],
    }
  }),
  
  removeItem: (itemId) => set((state) => ({
    items: state.items.filter(i => i._id !== itemId),
  })),
  
  updateQuantity: (itemId, quantity) => set((state) => ({
    items: state.items.map(i =>
      i._id === itemId ? { ...i, quantity } : i
    ),
  })),
  
  clearCart: () => set({ items: [] }),
  
  getTotal: () => {
    const items = get().items
    return items.reduce((total, item) => {
      return total + (item.sellingPrice * item.quantity)
    }, 0)
  },
  
  getTotalItems: () => {
    const items = get().items
    return items.reduce((total, item) => total + item.quantity, 0)
  },
}))

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),
  
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),
  
  clearNotifications: () => set({
    notifications: [],
    unreadCount: 0,
  }),
}))