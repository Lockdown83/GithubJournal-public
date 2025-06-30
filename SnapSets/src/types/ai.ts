export interface VisionAnalysisRequest {
  imageData: string; // base64 encoded image
  analysisType: 'exercise_form' | 'exercise_recognition' | 'rep_counting';
  exerciseContext?: {
    exerciseName?: string;
    targetMuscles?: string[];
  };
}

export interface VisionAnalysisResponse {
  success: boolean;
  analysis?: {
    exerciseDetected?: string;
    formFeedback?: string[];
    repCount?: number;
    confidence: number;
    suggestions?: string[];
  };
  error?: string;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
}

export interface AIAnalysisResult {
  timestamp: Date;
  imageUrl?: string;
  analysis: VisionAnalysisResponse;
  exerciseContext?: {
    workoutId: string;
    exerciseId: string;
  };
}