export interface StandardErrorResponse {
  error: string;
  nibrsData?: any;
  suggestions?: string[];
  confidence?: any;
  correctionContext?: any;
  warnings?: string[];
  missingFields?: string[];
  requiredLevel?: string;
  statusCode?: number;
}

export interface ValidationError {
  field: string;
  message: string;
  expectedType?: string;
  receivedValue?: any;
}

export interface NIBRSMappingError {
  field: string;
  issue: string;
  suggestedValue?: any;
  confidence?: number;
}