import { Logger, LogLevel } from '../../utils/logger';

// Mock console methods
const originalConsole = { ...console };
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

describe('Logger', () => {
  beforeEach(() => {
    // Replace console methods with mocks
    Object.assign(console, mockConsole);
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original console
    Object.assign(console, originalConsole);
  });

  describe('basic logging', () => {
    it('should log info messages', () => {
      Logger.info('Test info message');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'Test info message'
      );
    });

    it('should log warning messages', () => {
      Logger.warn('Test warning message');
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        'Test warning message'
      );
    });

    it('should log error messages', () => {
      Logger.error('Test error message');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Test error message'
      );
    });

    it('should log debug messages', () => {
      Logger.debug('Test debug message');
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        'Test debug message'
      );
    });
  });

  describe('log levels', () => {
    it('should respect log level filtering', () => {
      Logger.setLevel(LogLevel.WARN);
      
      Logger.debug('Debug message');
      Logger.info('Info message');
      Logger.warn('Warning message');
      Logger.error('Error message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should log all messages at DEBUG level', () => {
      Logger.setLevel(LogLevel.DEBUG);
      
      Logger.debug('Debug message');
      Logger.info('Info message');
      Logger.warn('Warning message');
      Logger.error('Error message');
      
      expect(mockConsole.debug).toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should only log errors at ERROR level', () => {
      Logger.setLevel(LogLevel.ERROR);
      
      Logger.debug('Debug message');
      Logger.info('Info message');
      Logger.warn('Warning message');
      Logger.error('Error message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should disable all logging at NONE level', () => {
      Logger.setLevel(LogLevel.NONE);
      
      Logger.debug('Debug message');
      Logger.info('Info message');
      Logger.warn('Warning message');
      Logger.error('Error message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    });
  });

  describe('structured logging', () => {
    it('should log objects and additional data', () => {
      const testData = { userId: '123', action: 'login' };
      
      Logger.info('User action', testData);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'User action',
        testData
      );
    });

    it('should handle multiple arguments', () => {
      Logger.info('Multiple', 'arguments', { test: true }, 123);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'Multiple',
        'arguments',
        { test: true },
        123
      );
    });

    it('should stringify circular objects safely', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      expect(() => Logger.info('Circular object', circular)).not.toThrow();
    });
  });

  describe('error logging', () => {
    it('should log Error objects with stack traces', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      
      Logger.error('Error occurred', error);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Error occurred',
        error
      );
    });

    it('should handle errors without stack traces', () => {
      const error = new Error('Test error');
      delete error.stack;
      
      expect(() => Logger.error('Error without stack', error)).not.toThrow();
    });

    it('should log non-Error objects as errors', () => {
      const errorLike = { message: 'Not a real error', code: 500 };
      
      Logger.error('Error-like object', errorLike);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Error-like object',
        errorLike
      );
    });
  });

  describe('timestamp formatting', () => {
    it('should include timestamps in log messages', () => {
      Logger.info('Timestamped message');
      
      const logCall = mockConsole.log.mock.calls[0][0];
      expect(logCall).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should use consistent timestamp format', () => {
      Logger.info('Message 1');
      Logger.warn('Message 2');
      
      const infoTimestamp = mockConsole.log.mock.calls[0][0];
      const warnTimestamp = mockConsole.warn.mock.calls[0][0];
      
      const timestampRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;
      expect(infoTimestamp).toMatch(timestampRegex);
      expect(warnTimestamp).toMatch(timestampRegex);
    });
  });

  describe('performance', () => {
    it('should not evaluate log messages when level is filtered', () => {
      Logger.setLevel(LogLevel.ERROR);
      
      const expensiveOperation = jest.fn(() => 'expensive result');
      
      Logger.debug('Debug message', expensiveOperation());
      
      // The expensive operation should not be called due to level filtering
      expect(expensiveOperation).not.toHaveBeenCalled();
    });

    it('should handle large volumes of logs efficiently', () => {
      Logger.setLevel(LogLevel.INFO);
      
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        Logger.info(`Log message ${i}`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
      expect(mockConsole.log).toHaveBeenCalledTimes(1000);
    });
  });

  describe('development vs production', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should enable debug logging in development', () => {
      process.env.NODE_ENV = 'development';
      Logger.setDefaultLevel();
      
      Logger.debug('Development debug message');
      
      expect(mockConsole.debug).toHaveBeenCalled();
    });

    it('should disable debug logging in production', () => {
      process.env.NODE_ENV = 'production';
      Logger.setDefaultLevel();
      
      Logger.debug('Production debug message');
      Logger.info('Production info message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalled();
    });
  });

  describe('context and metadata', () => {
    it('should support adding context to all logs', () => {
      Logger.setContext({ userId: '123', sessionId: 'abc' });
      
      Logger.info('Message with context');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'Message with context',
        expect.objectContaining({
          userId: '123',
          sessionId: 'abc'
        })
      );
    });

    it('should merge message metadata with context', () => {
      Logger.setContext({ userId: '123' });
      
      Logger.info('Message', { action: 'click', target: 'button' });
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'Message',
        expect.objectContaining({
          userId: '123',
          action: 'click',
          target: 'button'
        })
      );
    });

    it('should clear context when requested', () => {
      Logger.setContext({ userId: '123' });
      Logger.clearContext();
      
      Logger.info('Message without context');
      
      const logArgs = mockConsole.log.mock.calls[0];
      expect(logArgs).toHaveLength(2); // timestamp + message only
    });
  });

  describe('error handling', () => {
    it('should handle console method failures gracefully', () => {
      // Mock console.log to throw an error
      mockConsole.log.mockImplementation(() => {
        throw new Error('Console failure');
      });
      
      expect(() => Logger.info('This should not crash')).not.toThrow();
    });

    it('should handle invalid log levels', () => {
      expect(() => Logger.setLevel(999 as LogLevel)).not.toThrow();
    });

    it('should handle null and undefined messages', () => {
      expect(() => Logger.info(null as any)).not.toThrow();
      expect(() => Logger.info(undefined as any)).not.toThrow();
    });
  });
});