import api from './axios';

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email });

export const resetPassword = (token, password, confirmPassword) =>
  api.post(`/auth/reset-password/${token}`, { password, confirmPassword });
