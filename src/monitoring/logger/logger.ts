// Simple logger implementation with metadata support
// For production, consider using winston: npm install winston

interface LogMetadata {
  [key: string]: any;
}

const formatMessage = (message: string, meta?: LogMetadata): string => {
  if (!meta || Object.keys(meta).length === 0) {
    return message;
  }
  return `${message} ${JSON.stringify(meta)}`;
};

export const logger = {
  info: (message: string, meta?: LogMetadata) => {
    console.log('[INFO]', formatMessage(message, meta));
  },
  
  error: (message: string | any, meta?: LogMetadata) => {
    if (typeof message === 'object') {
      console.error('[ERROR]', JSON.stringify(message, null, 2));
    } else {
      console.error('[ERROR]', formatMessage(message, meta));
    }
  },
  
  warn: (message: string, meta?: LogMetadata) => {
    console.warn('[WARN]', formatMessage(message, meta));
  },
  
  debug: (message: string, meta?: LogMetadata) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[DEBUG]', formatMessage(message, meta));
    }
  },
};