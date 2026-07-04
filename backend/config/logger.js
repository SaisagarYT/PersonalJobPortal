import morgan from 'morgan';

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '';
  }
  const ms = (res._startAt[0] - req._startAt[0]) * 1e3 + (res._startAt[1] - req._startAt[1]) * 1e-6;
  return ms.toFixed(3);
});

// Custom token for request body (be careful with sensitive data)
morgan.token('body', (req) => {
  // Don't log passwords or sensitive fields
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitized = { ...req.body };
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    return JSON.stringify(sanitized);
  }
  return '';
});

// Development format (detailed, colorized)
const devFormat = morgan(':method :url :status :response-time ms - :res[content-length] :body', {
  skip: (req) => req.path === '/', // Skip logging health check
});

// Production format (concise, JSON-like)
const prodFormat = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms',
  {
    skip: (req, res) => {
      // Skip logging successful health checks in production
      return req.path === '/' && res.statusCode === 200;
    },
  }
);

// Choose format based on environment
const logger = process.env.NODE_ENV === 'production' ? prodFormat : devFormat;

export default logger;
