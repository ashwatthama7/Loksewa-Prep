import api from './axios';

export const getAdminStats = () => api.get('/admin/stats');

export const getQuestions = (params) => api.get('/admin/questions', { params });
export const createQuestion = (data) => api.post('/admin/questions', data);
export const updateQuestion = (id, data) => api.put(`/admin/questions/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/admin/questions/${id}`);
export const bulkUpload = (formData) =>
  api.post('/admin/questions/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
