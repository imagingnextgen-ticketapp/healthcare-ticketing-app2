import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const token = localStorage.getItem('token');

  // 🟢 FIXED: Define an array of all endpoints that do NOT need a token
  const anonymousEndpoints = [
    '/login',
    '/forgot-password',
    '/reset-password'
  ];

  // 🟢 FIXED: Check if the current request matches any of the anonymous endpoints
  const isAnonymousRoute = anonymousEndpoints.some(url => req.url.includes(url));

  if (isAnonymousRoute) {
    return next(req); // Let the request pass cleanly without attaching any headers
  }

  // --- Your existing logic for attaching tokens to secured routes ---
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(cloned);
  }

  return next(req);
};
