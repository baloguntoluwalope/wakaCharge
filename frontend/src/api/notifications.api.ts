import api from './client'

export const notificationsApi = {
  getAll: () =>
    api.get('/notifications'),

  markAllRead: () =>
    api.patch('/notifications/read-all'),

  markOneRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),
}