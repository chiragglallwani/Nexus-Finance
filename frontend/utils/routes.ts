export const Routes = {
  login: 'auth/login',
  signup: 'auth/signup',
  logout: 'auth/logout',
  refresh: 'auth/refresh',
  me: 'auth/me',
  uploads: 'uploads',
  uploadsTemplateDownload: 'uploads/template/download',
  uploadsTransactions: 'uploads/transactions',
  uploadsJobStatus: (jobId: string) =>
    `uploads/jobs/${encodeURIComponent(jobId)}`,
  tenantBalance: 'balance',
  userName: 'user/name',
  userTenantName: 'user/tenant/name',
}
