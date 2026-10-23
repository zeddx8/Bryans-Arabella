import rateLimit from 'express-rate-limit';

const make = (windowMs, limit, message, byUser = false) =>
  rateLimit({
    windowMs, limit, standardHeaders: true, legacyHeaders: false, message: { message },
    ...(byUser ? { keyGenerator: (req) => `user-${req.user?.id ?? 'anon'}` } : {}),
  });

const HOUR = 60 * 60 * 1000;
export const forgotLimiter = make(HOUR, 5, 'Too many reset requests. Try again in an hour.');
export const resendLimiter = make(HOUR, 3, 'We already sent you a few links. Check your spam folder, or try again in an hour.', true);
export const reviewLimiter = make(HOUR, 10, 'You are posting reviews very quickly. Try again later.', true);
export const messageLimiter = make(HOUR, 5, 'You have sent several messages already. We will reply as soon as we can.', true);
export const checkoutLimiter = make(HOUR, 20, 'Too many orders from this account. Try again later.', true);
