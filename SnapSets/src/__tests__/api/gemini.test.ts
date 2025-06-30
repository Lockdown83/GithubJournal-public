import { GeminiService } from '../../api/gemini';
import { GeminiConfig } from '../../types/ai';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('GeminiService', () => {
  let geminiService: GeminiService;
  const mockConfig: GeminiConfig = {
    apiKey: 'test-gemini-key',
    model: 'gemini-pro-vision',
    temperature: 0.7,
    maxTokens: 1000,
  };

  beforeEach(() => {
    geminiService = new GeminiService(mockConfig);
    mockFetch.mockClear();
  });

  describe('generatePrompt', () => {
    it('should generate exercise form analysis prompt', () => {
      const prompt = geminiService.generatePrompt('exercise_form', {
        exerciseName: 'squat',
        targetMuscles: ['quadriceps'],
      });

      expect(prompt).toContain('squat');
      expect(prompt).toContain('quadriceps');
      expect(prompt).toContain('form');
    });

    it('should generate exercise recognition prompt', () => {
      const prompt = geminiService.generatePrompt('exercise_recognition');

      expect(prompt).toContain('identify');
      expect(prompt).toContain('exercise');
    });

    it('should generate rep counting prompt', () => {
      const prompt = geminiService.generatePrompt('rep_counting', {
        exerciseName: 'push-up',
      });

      expect(prompt).toContain('count');
      expect(prompt).toContain('repetitions');
      expect(prompt).toContain('push-up');
    });
  });

  describe('analyzeImageWithPrompt', () => {
    const mockImageData = 'base64-image-data';
    const mockPrompt = 'Analyze this exercise form';

    it('should successfully send request to Gemini API', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    exerciseDetected: 'squat',
                    formFeedback: ['Good depth'],
                    confidence: 0.9,
                  }),
                },
              ],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await geminiService.analyzeImageWithPrompt(
        mockImageData,
        mockPrompt
      );

      expect(result.success).toBe(true);
      expect(result.analysis?.exerciseDetected).toBe('squat');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle invalid JSON in response', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Invalid JSON response' }],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await geminiService.analyzeImageWithPrompt(
        mockImageData,
        mockPrompt
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should handle API rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const result = await geminiService.analyzeImageWithPrompt(
        mockImageData,
        mockPrompt
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit');
    });

    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const result = await geminiService.analyzeImageWithPrompt(
        mockImageData,
        mockPrompt
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
    });

    it('should retry on temporary failures', async () => {
      // First call fails with 500
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        // Second call succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        exerciseDetected: 'squat',
                        confidence: 0.8,
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        });

      const result = await geminiService.analyzeImageWithPrompt(
        mockImageData,
        mockPrompt
      );

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('configuration validation', () => {
    it('should validate required API key', () => {
      expect(() => new GeminiService({ ...mockConfig, apiKey: '' })).toThrow(
        'API key is required'
      );
    });

    it('should validate model name', () => {
      expect(() => new GeminiService({ ...mockConfig, model: '' })).toThrow(
        'Model name is required'
      );
    });

    it('should use default temperature if not provided', () => {
      const service = new GeminiService({
        apiKey: 'test-key',
        model: 'gemini-pro',
      });
      expect(service.getConfig().temperature).toBe(0.7);
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
      );

      const result = await geminiService.analyzeImageWithPrompt(
        mockImageData,
        'test prompt'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
    });

    it('should handle malformed responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Empty response
      });

      const result = await geminiService.analyzeImageWithPrompt(
        mockImageData,
        'test prompt'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid response structure');
    });
  });
});