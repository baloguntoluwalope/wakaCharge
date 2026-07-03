import api from './client'

export const trustApi = {
  getTrustScore: () =>
    api.get('/trust/score'),

  payRNPL: () =>
    api.post('/trust/pay-rnpl'),

  getRNPLStudents: () =>
    api.get('/trust/rnpl-students'),
}