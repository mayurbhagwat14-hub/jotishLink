import axios from './axios';

export const getNotifications = () => axios.get('/notifications');
export const markNotificationAsRead = (id) => axios.put(`/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => axios.put('/notifications/all/read');
