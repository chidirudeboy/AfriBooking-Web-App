'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/utils/api';
import { loginUser as loginEndpoint, userProfile, createAccount, updateProfile, deleteAccount } from '@/lib/endpoints';
import toast from 'react-hot-toast';

interface User {
  _id?: string;
  id?: string;
  email: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
}

interface AuthContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  error: string | null;
  loginUser: (email: string, password: string) => Promise<void>;
  createAccount: (first_name: string, last_name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  getProfile: () => Promise<void>;
  updateProfile: (first_name: string, last_name: string, email: string, phone: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadUserFromStorage = () => {
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            getProfile(parsedUser.accessToken || parsedUser.token);
          }
        } catch (error) {
          console.error('Failed to load user from storage:', error);
        }
      };
      loadUserFromStorage();
    }
  }, []);

  const getProfile = async (token?: string) => {
    const authToken = token || user?.accessToken || user?.token;
    if (!authToken) {
      console.error('Token is undefined');
      return;
    }

    try {
      const response = await api.get(userProfile, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data && response.data._id) {
        setProfile(response.data);
      } else {
        console.error('Unexpected profile response structure:', response.data);
      }
    } catch (error: any) {
      console.error('Profile Error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        setUser(null);
        setProfile(null);
        toast.error('Your session has expired. Please login again.');
        router.push('/login');
      }
    }
  };

  const loginUser = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post(loginEndpoint, {
        email: email.toLowerCase(),
        password: password,
      });

      if (response.data.message === 'User login successful') {
        const userResponse: User = {
          _id: response.data.user._id,
          email: response.data.user.email,
          token: response.data.accessToken,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          user: response.data.user,
        };

        setUser(userResponse);
        localStorage.setItem('user', JSON.stringify(userResponse));
        
        // Set default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${userResponse.token}`;

        // Fetch profile
        await getProfile(userResponse.token);
        
        toast.success('Login Successful');
        router.push('/apartments');
      } else {
        toast.error(response.data.message || 'Login failed');
        setError(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Login Error:', error);

      let errorMessage = 'An error occurred during login';
      const errors = error.response?.data?.errors;
      const serverMessage = error.response?.data?.message;
      const serverError = error.response?.data?.error;

      if (error.response?.status === 400) {
        if (serverError === 'Failed to login, user not registered' || serverMessage?.includes('not registered')) {
          errorMessage = 'This email is not registered. Please create an account or check your email address.';
        } else if (serverMessage?.includes('password')) {
          errorMessage = 'Incorrect password. Please try again.';
        } else {
          errorMessage = serverMessage || serverError || 'Invalid login credentials. Please check your email and password.';
        }
      } else if (error.response?.status === 404) {
        errorMessage = 'Account not found. Please check your email or create a new account.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (serverMessage || serverError) {
        errorMessage = serverMessage || serverError;
      }

      if (errors) {
        const key = Object.keys(errors)[0];
        errorMessage = errors[key][0];
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createAccountFunction = async (
    first_name: string,
    last_name: string,
    email: string,
    phone: string,
    password: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post(createAccount, {
        first_name,
        last_name,
        email,
        phone,
        password,
      });

      if (response.data.message === 'User signup successful') {
        const userResponse: User = {
          email: response.data.user.email,
          token: response.data.accessToken,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          user: response.data.user,
        };

        setUser(userResponse);
        localStorage.setItem('user', JSON.stringify(userResponse));
        setError(null);

        toast.success('Registration Successful');
        router.push('/apartments');
      } else {
        toast.error(response.data.message || 'Registration failed');
        setError(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Registration Error:', error);

      const errorMessage = error.response?.data?.error || 'An error occurred during registration';
      const errors = error.response?.data?.errors;

      if (errors) {
        const key = Object.keys(errors)[0];
        setError(errors[key][0]);
        toast.error(errors[key][0]);
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfileFunction = async (
    first_name: string,
    last_name: string,
    email: string,
    phone: string
  ) => {
    setLoading(true);
    setError(null);

    const authToken = user?.accessToken || user?.token;
    if (!authToken) {
      toast.error('Please login to update your profile');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post(updateProfile, {
        first_name,
        last_name,
        email,
        phone,
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data?.status === 'success') {
        toast.success('Profile updated successfully');
        await getProfile(authToken);
      } else {
        toast.error(response.data?.message || 'Failed to update profile');
        setError(response.data?.message || 'Failed to update profile');
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Update Profile Error:', error);

      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'An error occurred while updating your profile';
      const errors = error.response?.data?.errors;

      if (errors) {
        const key = Object.keys(errors)[0];
        setError(errors[key][0]);
        toast.error(errors[key][0]);
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteAccountFunction = async (password: string) => {
    setLoading(true);
    setError(null);

    const authToken = user?.accessToken || user?.token;
    if (!authToken) {
      toast.error('Please login to delete your account');
      setLoading(false);
      return;
    }

    try {
      const response = await api.delete(deleteAccount, {
        data: { password },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data?.success) {
        toast.success('Account deleted successfully');
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        toast.error(response.data?.message || 'Failed to delete account');
        setError(response.data?.message || 'Failed to delete account');
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Delete Account Error:', error);

      let errorMessage = 'Failed to delete account';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid password. Please try again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      setUser(null);
      setProfile(null);
      setError(null);
      delete api.defaults.headers.common['Authorization'];
      toast.success('Logout Successful');
      router.push('/login');
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    error,
    loginUser,
    createAccount: createAccountFunction,
    logout,
    getProfile: () => getProfile(),
    updateProfile: updateProfileFunction,
    deleteAccount: deleteAccountFunction,
    token: user?.accessToken || user?.token || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

