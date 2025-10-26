'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthResponse, authService, tokenStorage } from '@/lib/api/auth';

// Types
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  getProfile: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

// Actions
type AuthAction = 
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar sesión al cargar la aplicación usando la nueva lógica
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 [AuthContext] Verificando autenticación al cargar...');
      
      try {
        // Usar la nueva función checkAuthStatus recomendada por el backend
        const user = await authService.checkAuthStatus();
        
        if (user) {
          console.log('✅ [AuthContext] Usuario autenticado:', user.name);
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        } else {
          console.log('🔍 [AuthContext] Usuario no autenticado');
          // No hacer logout automático, solo si realmente no hay token
          const token = localStorage.getItem('airbnb_auth_token');
          if (!token) {
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        }
      } catch (error) {
        console.log('💥 [AuthContext] Error verificando autenticación:', error);
        // Solo hacer logout si es un error de autenticación, no de red
        if (error instanceof Error && error.message.includes('401')) {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    console.log('🔍 [AuthContext] Iniciando login para:', email);
    dispatch({ type: 'AUTH_START' });
    try {
      const response: AuthResponse = await authService.login(email, password);
      console.log('🔍 [AuthContext] Respuesta COMPLETA del backend:', JSON.stringify(response, null, 2));
      
      // El backend devuelve los datos dentro de un objeto 'data'
      const user = response.data?.user || response.user;
      const token = response.data?.token || response.token;
      
      if (response.success && user && token) {
        console.log('✅ [AuthContext] Login exitoso, token y usuario guardados automáticamente');
        console.log('👤 [AuthContext] Usuario recibido:', user);
        
        // El token y usuario ya se guardaron en authService.login()
        // Solo actualizar el estado del contexto
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
        console.log('✅ [AuthContext] Estado actualizado - isAuthenticated:', true);
      } else {
        console.log('❌ [AuthContext] Login falló - Análisis detallado:');
        console.log('  - response.success:', response.success);
        console.log('  - response.data:', response.data);
        console.log('  - user:', user);
        console.log('  - token:', token);
        console.log('  - response.message:', response.message);
        
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Error en el login' });
      }
    } catch (error) {
      console.log('💥 [AuthContext] Error en login:', error);
      dispatch({ type: 'AUTH_ERROR', payload: 'Error de conexión' });
    }
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    try {
      console.log('🔍 [AuthContext] Iniciando registro con:', { email, name });
      const response: AuthResponse = await authService.register(email, password, name);
      console.log('🔍 [AuthContext] Respuesta del backend:', response);
      
      // El backend devuelve los datos dentro de un objeto 'data'
      const user = response.data?.user || response.user;
      const token = response.data?.token || response.token;
      
      if (response.success && user && token) {
        console.log('✅ [AuthContext] Registro exitoso, token y usuario guardados automáticamente');
        
        // El token y usuario ya se guardaron en authService.register()
        // Solo actualizar el estado del contexto
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
        console.log('✅ [AuthContext] Estado actualizado - isAuthenticated:', true);
      } else {
        console.log('❌ [AuthContext] Registro falló:', {
          success: response.success,
          data: response.data,
          hasUser: !!user,
          hasToken: !!token,
          message: response.message
        });
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Error en el registro' });
      }
    } catch (error) {
      console.log('💥 [AuthContext] Error en registro:', error);
      dispatch({ type: 'AUTH_ERROR', payload: 'Error de conexión' });
    }
  };

  const logout = async (): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    try {
      // authService.logout() ya maneja la limpieza completa según recomendaciones
      await authService.logout();
      dispatch({ type: 'AUTH_LOGOUT' });
      console.log('✅ [AuthContext] Logout completado correctamente');
    } catch (error) {
      // Incluso si falla el logout en el servidor, limpiamos localmente
      console.log('💥 [AuthContext] Error en logout, limpiando localmente:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const getProfile = async (): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response: AuthResponse = await authService.getProfile();
      
      if (response.success && response.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Error al obtener perfil' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: 'Error de conexión' });
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      console.log('🔄 [AuthContext] Renovando token...');
      const response = await authService.refreshToken();
      
      if (response.success) {
        console.log('✅ [AuthContext] Token renovado exitosamente');
        // El token ya se actualizó en authService.refreshToken()
        // No necesitamos actualizar el estado del usuario
      } else {
        console.log('❌ [AuthContext] Error renovando token:', response.message);
        // Si no se puede renovar, hacer logout
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error) {
      console.error('💥 [AuthContext] Error renovando token:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        getProfile,
        refreshToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


