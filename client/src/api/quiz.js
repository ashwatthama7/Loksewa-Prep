import api from './axios';

export const startQuiz = () => api.post('/quiz/start');
export const getCurrentSession = () => api.get('/quiz/current');
export const saveAnswer = (questionIndex, selectedAnswer) =>
  api.put('/quiz/answer', { questionIndex, selectedAnswer });
export const submitQuiz = () => api.post('/quiz/submit');
export const getHistory = () => api.get('/quiz/history');
export const getReview = (sessionId) => api.get(`/quiz/${sessionId}/review`);
