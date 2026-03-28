export const environment = {
  production: true,
  // In Docker, nginx proxies /api → backend container.
  // No hostname needed; the browser just calls the same origin.
  apiBase: '/api',
};
