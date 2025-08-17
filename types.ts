
export interface User {
  nickname: string;
  isAdmin?: boolean;
}

export interface Hazard {
    hazard: string;
    description: string;
}

export interface Disease {
    name: string;
    cause: string;
    precautions: string[];
}

export interface AnalysisResult {
    hazards: Hazard[];
    diseases: Disease[];
    summary: string;
}

export interface LocationAnalysisResult extends AnalysisResult {
    locationName: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'bot';
    text: string;
}

export interface Facility {
  name: string;
  type: 'Hospital' | 'Pharmacy' | 'Clinic';
  lat: number;
  lng: number;
  distance?: string;
}

export interface Medicine {
  name: string;
  dosage: string;
}

export interface PrescriptionAnalysisResult {
  summary: string;
  medicines: Medicine[];
  precautions: string[];
}

export interface RiskFactor {
    name: string;
    level: 'Low' | 'Moderate' | 'High' | 'Very High';
    description: string;
}

export interface HealthForecast {
    locationName: string;
    summary: string;
    riskFactors: RiskFactor[];
    recommendations: string[];
}

export interface CopingStrategy {
  title: string;
  description: string;
}

export interface PotentialConcern {
  name: string;
  explanation: string;
}

export interface MentalHealthResult {
  summary: string;
  potentialConcerns: PotentialConcern[];
  copingStrategies: CopingStrategy[];
  recommendation: string;
}

export interface PotentialCondition {
  name: string;
  description: string;
}

export interface SymptomAnalysisResult {
  summary: string;
  triageRecommendation: string;
  potentialConditions: PotentialCondition[];
  nextSteps: string[];
  disclaimer: string;
}

// --- History Event Types ---

export type HistoryEventType = 'login' | 'image_analysis' | 'location_analysis' | 'prescription_analysis' | 'symptom_check' | 'mental_health_check';

interface BaseHistoryEvent {
    id: string;
    timestamp: string;
}

export interface LoginEventPayload {}

export interface ImageAnalysisEventPayload {
  result: AnalysisResult;
}

export interface LocationAnalysisEventPayload {
  result: LocationAnalysisResult;
  coords: { lat: number; lng: number };
}

export interface PrescriptionAnalysisEventPayload {
  result: PrescriptionAnalysisResult;
}

export interface SymptomCheckEventPayload {
  result: SymptomAnalysisResult;
  symptoms: string;
}

export interface MentalHealthCheckEventPayload {
  result: MentalHealthResult;
}

export type HistoryEvent = 
  | (BaseHistoryEvent & { type: 'login'; payload: LoginEventPayload })
  | (BaseHistoryEvent & { type: 'image_analysis'; payload: ImageAnalysisEventPayload })
  | (BaseHistoryEvent & { type: 'location_analysis'; payload: LocationAnalysisEventPayload })
  | (BaseHistoryEvent & { type: 'prescription_analysis'; payload: PrescriptionAnalysisEventPayload })
  | (BaseHistoryEvent & { type: 'symptom_check'; payload: SymptomCheckEventPayload })
  | (BaseHistoryEvent & { type: 'mental_health_check'; payload: MentalHealthCheckEventPayload });