import { VisionService } from '../../api/vision-service';
import { VisionAnalysisRequest, VisionAnalysisResponse } from '../../types/ai';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('VisionService', () => {
  let visionService: VisionService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    visionService = new VisionService(mockApiKey);
    mockFetch.mockClear();
  });

  describe('analyzeImage', () => {
    const mockRequest: VisionAnalysisRequest = {
      imageData: 'base64-encoded-image-data',
      analysisType: 'exercise_form',
      exerciseContext: {
        exerciseName: 'squat',
        targetMuscles: ['quadriceps', 'glutes'],
      },
    };

    it('should successfully analyze image for exercise form', async () => {
      const mockResponse: VisionAnalysisResponse = {
        success: true,
        analysis: {
          exerciseDetected: 'squat',
          formFeedback: ['Keep your back straight', 'Go deeper'],
          confidence: 0.85,
          suggestions: ['Focus on proper form'],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await visionService.analyzeImage(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`,
          }),
          body: expect.stringContaining(mockRequest.imageData),
        })
      );
    });

    it('should handle exercise recognition analysis', async () => {
      const recognitionRequest: VisionAnalysisRequest = {
        ...mockRequest,
        analysisType: 'exercise_recognition',
      };

      const mockResponse: VisionAnalysisResponse = {
        success: true,
        analysis: {
          exerciseDetected: 'deadlift',
          confidence: 0.92,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await visionService.analyzeImage(recognitionRequest);

      expect(result.success).toBe(true);
      expect(result.analysis?.exerciseDetected).toBe('deadlift');
      expect(result.analysis?.confidence).toBe(0.92);
    });

    it('should handle rep counting analysis', async () => {
      const repCountRequest: VisionAnalysisRequest = {
        ...mockRequest,
        analysisType: 'rep_counting',
      };

      const mockResponse: VisionAnalysisResponse = {
        success: true,
        analysis: {
          repCount: 12,
          confidence: 0.78,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await visionService.analyzeImage(repCountRequest);

      expect(result.analysis?.repCount).toBe(12);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const result = await visionService.analyzeImage(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await visionService.analyzeImage(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should validate image data before sending', async () => {
      const invalidRequest: VisionAnalysisRequest = {
        imageData: '',
        analysisType: 'exercise_form',
      };

      const result = await visionService.analyzeImage(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid image data');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalidResponse: true }),
      });

      const result = await visionService.analyzeImage(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid response format');
    });
  });

  describe('configuration', () => {
    it('should use correct API endpoint', () => {
      expect(visionService.getEndpoint()).toContain('gemini');
    });

    it('should handle missing API key', () => {
      expect(() => new VisionService('')).toThrow('API key is required');
    });
  });
});