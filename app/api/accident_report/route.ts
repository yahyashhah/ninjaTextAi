// app/api/accident_report/route.ts - FIXED & OPTIMIZED
import { checkApiLimit, increaseAPiLimit } from "@/lib/api-limits";
import { saveHistoryReport } from "@/lib/history-reports";
import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";
import { trackReportEvent, trackUserActivity } from "@/lib/tracking";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getValidationCacheKey, getCachedValidation, setCachedValidation } from '@/lib/validation-cache';
import { getFieldExamples, enhanceCategorizedFields, calculateValidationConfidence } from '@/lib/field-utils';
import OpenAI from "openai/index.mjs";

// Import NIBRS utilities - PRESERVED AS REQUESTED
import { validateDescriptiveNibrs, validateNibrsPayload } from "@/lib/nibrs/Validator";
import { validateWithTemplate } from "@/lib/nibrs/templates";
import { buildNIBRSXML } from "@/lib/nibrs/xml";
import { NibrsMapper } from "@/lib/nibrs/mapper";
import { NIBRSErrorBuilder } from "@/lib/nibrs/errorBuilder";
import { StandardErrorResponse } from "@/lib/nibrs/errorResponse";
import { createReviewQueueItemIfNeeded, getUserOrganizationWithFallback } from "@/lib/organization-utils";

// Import Group A Offenses
import { GROUP_A_OFFENSES, OffenseType } from "@/constants/offences"
import { getTemplateByOffense } from "@/constants/offnce-templates";

// IMPORT THE UNIFIED VALIDATOR
import { unifiedOffenseValidation, UnifiedValidationResult, UNIVERSAL_REQUIRED_FIELDS, UNIVERSAL_FIELD_DEFINITIONS } from '@/lib/unified-offence-validator';

type ChatCompletionMessageParam = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define interfaces for type safety
interface ValidationResult {
  isComplete: boolean;
  missingFields: string[];
  presentFields: string[];
  ambiguousFields?: string[];
  suggestedQuestions?: string[];
  confidenceScore: number;
  promptForMissingInfo: string;
  categorizedFields: any;
  validationDetails: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'COMPLETE';
    message: string;
    color: string;
  };
  fieldExamples: Record<string, string>;
  missingUniversalFields?: string[];
}

interface MultiOffenseValidationResult {
  validatedOffenses: {
    offense: OffenseType;
    validation: UnifiedValidationResult;
  }[];
  allComplete: boolean;
  combinedMissingFields: string[];
  combinedPresentFields: string[];
  primaryOffense?: OffenseType;
  primaryTemplate?: any;
  allExtractedData?: any[];
  allStructuredData?: Record<string, any>;
}

interface ExtractedFieldData {
  field: string;
  value: string;
  confidence: number;
  source: string;
}

interface ValidationState {
  providedFields: string[];
  cumulativePrompt: string;
  originalNarrative: string;
  attemptCount: number;
}

interface OffenseValidationResult {
  suggestedOffense: OffenseType | null;
  confidence: number;
  reason: string;
  matches: string[];
  mismatches: string[];
  alternativeOffenses: OffenseType[];
}

interface CorrectionDataResponse {
  type: string;
  error: string;
  missingFields: string[];
  presentFields: string[];
  message: string;
  isComplete: boolean;
  confidenceScore: number;
  source: string;
  errorCategory: string;
  severity: string;
  guidance: string;
  categorizedFields: any;
  offenseName?: string;
  offenseCode?: string;
  offense?: OffenseType;
  offenses?: OffenseType[];
  fieldExamples: Record<string, string>;
  validationDetails: any;
  suggestions: string[];
  sessionKey?: string;
  originalNarrative?: string;
  offenseValidation?: OffenseValidationResult;
  multiOffenseValidation?: MultiOffenseValidationResult;
  newOffense?: OffenseType;
  newOffenses?: OffenseType[];
  extractedData?: any[];
  structuredData?: Record<string, any>;
  missingUniversalFields?: string[];
}

// Validation State Manager
class ValidationStateManager {
  private static instance: ValidationStateManager;
  private states: Map<string, ValidationState> = new Map();

  private constructor() {}

  static getInstance(): ValidationStateManager {
    if (!ValidationStateManager.instance) {
      ValidationStateManager.instance = new ValidationStateManager();
    }
    return ValidationStateManager.instance;
  }

  getState(sessionKey: string): ValidationState | null {
    return this.states.get(sessionKey) || null;
  }

  setState(sessionKey: string, state: ValidationState): void {
    this.states.set(sessionKey, state);
  }

  clearState(sessionKey: string): void {
    this.states.delete(sessionKey);
  }

  cleanupOldStates(maxAge: number = 30 * 60 * 1000): void {
    const now = Date.now();
    for (const [key, state] of Array.from(this.states.entries())) {
      const keyParts = key.split('-');
      const timestamp = parseInt(keyParts[keyParts.length - 1]);
      if (now - timestamp > maxAge) {
        this.states.delete(key);
      }
    }
  }
}

// Generate session keys
function generateSessionKey(userId: string, offenseId: string): string {
  return `${userId}-${offenseId}-${Date.now()}`;
}

function generateMultiOffenseSessionKey(userId: string, offenses: OffenseType[]): string {
  const offenseIds = offenses.map(o => o.id).join('-');
  return `${userId}-${offenseIds}-${Date.now()}`;
}

// NIBRS-specific template instructions - PRESERVED AS REQUESTED
const NIBRS_TEMPLATE_INSTRUCTIONS = `
You are a NIBRS data extraction specialist. Convert police narratives into structured NIBRS data.

CRITICAL NIBRS RULES:
1. FOCUS ON NIBRS-REPORTABLE OFFENSES: assault, theft, burglary, robbery, drug violations, weapon crimes
2. EXCLUDE: Simple traffic offenses (unless DUI or serious injury), minor incidents not requiring NIBRS reporting
3. DRUG/WEAPON OFFENSES: Use Society/Public victim (Type S) with injury "N"
4. INDIVIDUAL CRIMES: Use individual victims (Type I) with specific injuries when applicable
5. REQUIRED FIELDS: incident date, location, offense description, victim information

NIBRS-SPECIFIC TEMPLATE FORMAT:
Today is [date] at approximately [time]. I was dispatched to [location] in reference to [type of incident]. 
Upon arrival, I made contact with [victim information if applicable]. 
The victim reported that [describe what happened, including actions by offender(s)].
The offense involved is [offense description]. The offense was [attempted/completed]. 
The suspect is described as [demographics if known].
The suspect used [method/weapon/force if applicable]. 
The victim sustained [type of injury if any]. 
The property involved includes [list items with descriptions and values if applicable].

OUTPUT FORMAT - JSON ONLY:
{
  "extractedData": {
    "incidentNumber": string (optional),
    "incidentDate": "YYYY-MM-DD",
    "incidentTime": "HH:mm" (optional),
    "locationDescription": string,
    
    "offenses": [
      {
        "description": string,
        "attemptedCompleted": "A" | "C"
      }
    ],
    
    "victims": [
      {
        "type": "I" | "S" | "B" | etc.,
        "age": number (optional),
        "sex": "M" | "F" | "U",
        "race": "W" | "B" | "I" | "A" | "P" | "U",
        "ethnicity": "H" | "N" | "U",
        "injury": string
      }
    ],

    "offenders": [
      {
        "age": number (optional),
        "sex": "M" | "F" | "U",
        "race": "W" | "B" | "I" | "A" | "P" | "U",
        "ethnicity": "H" | "N" | "U"
      }
    ],

    "properties": [
      {
        "lossDescription": string,
        "propertyDescription": string,
        "value": number
      }
    ]
  },
  "narrative": "Cleaned narrative following NIBRS template"
}
`;

// NEW: Optimized multi-offense validation using unified validator
async function validateMultipleOffensesOptimized(
  narrative: string, 
  offenses: OffenseType[]
): Promise<MultiOffenseValidationResult> {
  
  console.log("🔍 STARTING OPTIMIZED MULTI-OFFENSE VALIDATION FOR:", offenses.map(o => o.name));
  
  // Use unified validation for ALL offenses - SINGLE API CALL PER OFFENSE
  const unifiedResults = await Promise.all(
    offenses.map(async (offense) => {
      console.log(`🔍 Unified validation for: ${offense.name}`);
      const validation = await unifiedOffenseValidation(narrative, offense);
      
      console.log(`🔍 Unified result for ${offense.name}:`, {
        isComplete: validation.isComplete,
        missingFields: validation.missingFields,
        missingUniversalFields: validation.missingUniversalFields,
        confidenceScore: validation.confidenceScore,
        offenseConfidence: validation.offenseValidation.confidence
      });
      
      return {
        offense,
        validation
      };
    })
  );

  // Combine all extracted data
  const allExtractedData = unifiedResults.flatMap(result => result.validation.extractedData || []);
  const allStructuredData = Object.assign({}, ...unifiedResults.map(result => result.validation.structuredData || {}));

  // Combine all missing fields (unique)
  const allMissingFields = Array.from(new Set(
    unifiedResults.flatMap(result => result.validation.missingFields)
  ));

  // Combine all present fields (unique)
  const allPresentFields = Array.from(new Set(
    unifiedResults.flatMap(result => result.validation.presentFields)
  ));

  // Determine if all offenses are complete (including universal fields)
  const allComplete = unifiedResults.every(result => result.validation.isComplete);

  // Check for universal fields across all offenses
  const hasAllUniversalFields = UNIVERSAL_REQUIRED_FIELDS.every(field => 
    allPresentFields.includes(field)
  );

  console.log("🔍 COMBINED VALIDATION RESULT:", {
    allComplete,
    hasAllUniversalFields,
    totalMissingFields: allMissingFields.length,
    totalPresentFields: allPresentFields.length,
    missingUniversal: UNIVERSAL_REQUIRED_FIELDS.filter(f => !allPresentFields.includes(f))
  });

  // Final completeness requires both offense-specific and universal fields
  const finalComplete = allComplete && hasAllUniversalFields;

  // Determine primary offense (highest severity or best match)
  const primaryOffense = determinePrimaryOffense(unifiedResults);
  const primaryTemplate = primaryOffense ? getTemplateByOffense(primaryOffense) : null;

  return {
    validatedOffenses: unifiedResults,
    allComplete: finalComplete,
    combinedMissingFields: allMissingFields,
    combinedPresentFields: allPresentFields,
    primaryOffense,
    primaryTemplate,
    allExtractedData,
    allStructuredData
  };
}

// Helper function to determine primary offense
function determinePrimaryOffense(validationResults: any[]): OffenseType | undefined {
  if (validationResults.length === 0) return undefined;
  
  return validationResults
    .sort((a, b) => {
      // Severity ranking
      const severityRank: Record<string, number> = {
        'CRITICAL': 4,
        'HIGH': 3,
        'MEDIUM': 2,
        'LOW': 1
      };
      
      const aSeverity = severityRank[a.offense.severity] || 0;
      const bSeverity = severityRank[b.offense.severity] || 0;
      
      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity;
      }
      
      // If same severity, use validation confidence
      const aConfidence = a.validation.offenseValidation?.confidence || 0;
      const bConfidence = b.validation.offenseValidation?.confidence || 0;
      
      return bConfidence - aConfidence;
    })[0].offense;
}

// Helper function to combine field examples from multiple offenses
function combineFieldExamples(offenses: OffenseType[], missingFields: string[]): Record<string, string> {
  const examples: Record<string, string> = {};
  
  missingFields.forEach(field => {
    if (UNIVERSAL_REQUIRED_FIELDS.includes(field)) {
      const def = UNIVERSAL_FIELD_DEFINITIONS[field as keyof typeof UNIVERSAL_FIELD_DEFINITIONS];
      examples[field] = def?.examples || `Provide ${field}`;
    } else {
      const offenseWithField = offenses.find(o => o.fieldDefinitions?.[field]);
      if (offenseWithField) {
        examples[field] = getFieldExamples(field, offenseWithField.category);
      } else {
        examples[field] = `Provide details about ${field}`;
      }
    }
  });
  
  return examples;
}

// Generate suggestions from unified results
function generateSuggestionsFromUnifiedResults(validationResults: any[]): string[] {
  const suggestions: string[] = [];
  
  // Check for missing universal fields
  const allMissingUniversal = validationResults.flatMap(result => 
    result.validation.missingUniversalFields || []
  );
  const uniqueMissingUniversal = Array.from(new Set(allMissingUniversal));
  
  if (uniqueMissingUniversal.length > 0) {
    const universalFieldNames = uniqueMissingUniversal.map(field => 
      UNIVERSAL_FIELD_DEFINITIONS[field as keyof typeof UNIVERSAL_FIELD_DEFINITIONS]?.label || field
    ).join(', ');
    suggestions.push(`MANDATORY: Provide ${universalFieldNames}`);
  }
  
  // Add offense-specific suggestions
  validationResults.forEach(result => {
    if (!result.validation.isComplete) {
      const offenseSpecificMissing = result.validation.missingFields.filter(
        (field: string) => !UNIVERSAL_REQUIRED_FIELDS.includes(field)
      );
      if (offenseSpecificMissing.length > 0) {
        suggestions.push(`For ${result.offense.name}: Provide ${offenseSpecificMissing.join(', ')}`);
      }
    }
    
    // Add low confidence warnings
    if (result.validation.offenseValidation.confidence < 0.7) {
      suggestions.push(`Review: ${result.offense.name} may not be the best match (${Math.round(result.validation.offenseValidation.confidence * 100)}% confidence)`);
    }
  });
  
  if (suggestions.length === 0) {
    suggestions.push("All required information appears to be present");
  }
  
  return suggestions;
}

// Enhanced error categorization function
function categorizeMissingFields(missingFields: string[], source: "template" | "nibrs" | "offense", context?: string) {
  const categories = {
    personal: ["victim", "offender", "age", "sex", "race", "ethnicity", "gender", "name", "suspect", "person"],
    incident: ["date", "time", "location", "offense", "incident", "description", "circumstances", "motive"],
    property: ["property", "value", "description", "loss", "item", "stolen", "damage", "vehicle"],
    evidence: ["evidence", "weapon", "injury", "medical", "examination", "forensic"],
    administrative: ["incident", "report", "officer", "number", "id", "agency"]
  };

  const categorized: { [key: string]: string[] } = {};

  missingFields.forEach(field => {
    const fieldLower = field.toLowerCase();
    let categorizedField = false;
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => fieldLower.includes(keyword))) {
        if (!categorized[category]) categorized[category] = [];
        categorized[category].push(field);
        categorizedField = true;
        break;
      }
    }
    
    if (!categorizedField) {
      if (!categorized.other) categorized.other = [];
      categorized.other.push(field);
    }
  });

  return categorized;
}

// Helper function to build comprehensive data context
function buildDataContext(
  extractedData: any[], 
  structuredData: Record<string, any>,
  offenses: OffenseType[]
): any {
  const context: any = {
    incident: {},
    victims: [],
    suspects: [],
    offenses: [],
    property: [],
    arrest: {},
    evidence: {},
    extractedFields: {}
  };

  // Map extracted data to categories
  extractedData.forEach(item => {
    const field = item.field.toLowerCase();
    
    // Store all extracted fields for reference
    context.extractedFields[item.field] = item.value;
    
    if (field.includes('date') || field.includes('time') || field.includes('location')) {
      context.incident[item.field] = item.value;
    } else if (field.includes('victim')) {
      if (!context.victims[0]) context.victims[0] = {};
      context.victims[0][item.field] = item.value;
    } else if (field.includes('suspect') || field.includes('offender')) {
      if (!context.suspects[0]) context.suspects[0] = {};
      context.suspects[0][item.field] = item.value;
    } else if (field.includes('property')) {
      context.property.push({ description: item.value });
    } else if (field.includes('arrest')) {
      context.arrest[item.field] = item.value;
    } else {
      context.evidence[item.field] = item.value;
    }
  });

  // Add offense information
  context.offenses = offenses.map(offense => ({
    name: offense.name,
    code: offense.code,
    description: offense.description,
    statute: offense.nibrsCode
  }));

  // Merge with structured data
  return { ...context, ...structuredData };
}

// Enhanced narrative generation that FILLS the template with actual data
async function generateEnhancedNarrativeReport(
  prompt: string, 
  selectedTemplate: any, 
  selectedOffenses: OffenseType[],
  extractedData: any[],
  structuredData: Record<string, any>
): Promise<string> {
  
  // Build data context from extracted information
  const dataContext = buildDataContext(extractedData, structuredData, selectedOffenses);
  
  const systemInstructions = `
POLICE REPORT GENERATION WITH EXTRACTED DATA

TEMPLATE STRUCTURE:
${selectedTemplate?.instructions || 'Standard police report format'}

EXTRACTED DATA TO USE:
${JSON.stringify(dataContext, null, 2)}

CRITICAL INSTRUCTIONS:
1. USE THE EXTRACTED DATA ABOVE to fill the template
2. ONLY use "INFORMATION NOT PROVIDED" for fields that are truly missing
3. Preserve the officer's original wording and details
4. Combine information from multiple offenses logically
5. Maintain professional police report tone and structure

OFFENSE CONTEXT:
${selectedOffenses.map(offense => `
- ${offense.name}: ${offense.description}
- Required Elements: ${offense.requiredFields.join(', ')}
`).join('\n')}

ORIGINAL NARRATIVE (for context):
${prompt}
`;

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemInstructions },
    { role: "user", content: `Generate the final police report using the extracted data and following the template structure.` }
  ];
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
    temperature: 0.1
  });

  return response.choices[0].message.content || "";
}

// Create system instructions for narrative report
function createNarrativeSystemInstructions(template: any, offenses: OffenseType[]) {
  if (!template) {
    return `You are a professional police report writer. Convert the officer's narrative into a standardized format.`;
  }

  const fieldDefinitions = template.fieldDefinitions || {};
  const requiredFields = template.requiredFields || [];
  
  const requiredFieldsText = requiredFields.map((field: string) => {
    const def = fieldDefinitions[field];
    return `- ${field}: ${def?.description || 'No description'} ${def?.required ? '(REQUIRED)' : ''}`;
  }).join('\n') || 'No specific fields required';

  // Add offense context if available
  const offenseContext = offenses.length > 0 ? `
OFFENSE CONTEXT:
${offenses.map(offense => `
- Offense: ${offense.name} (${offense.code})
- Category: ${offense.category}
- Description: ${offense.description}
- Critical Details Required: ${offense.requiredFields?.join(', ') || 'None specified'}
`).join('\n')}
` : '';

  return `
POLICE REPORT TEMPLATE CONVERSION
${offenseContext}

TEMPLATE REQUIREMENTS:
${requiredFieldsText}

TEMPLATE INSTRUCTIONS:
${template.instructions || 'Convert the narrative into a professional police report format.'}

FORMATTING RULES:
- Use the exact structure provided in the examples
- Only include information explicitly stated in the narrative
- Mark missing information as "INFORMATION NOT PROVIDED"
- Use professional law enforcement terminology
- Ensure all offense-specific details are properly documented
- For multiple offenses, clearly document each criminal act separately
`;
}

// Helper function to parse JSON safely
function tryParseJSON(raw: string) {
  raw = (raw || "").trim();
  try {
    return JSON.parse(raw);
  } catch { /* fallthrough */ }

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1]); } catch {}
  }

  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const substr = raw.slice(first, last + 1);
    try { return JSON.parse(substr); } catch {}
  }

  throw new Error("Model output is not valid JSON.");
}

// Calculate accuracy score for NIBRS reports - PRESERVED AS REQUESTED
function calculateAccuracyScore(data: any, validationErrors: string[] = [], warnings: string[] = []): number {
  if (!data) return 0;
  
  let baseScore = 100;
  baseScore -= validationErrors.length * 10;
  baseScore -= warnings.length * 5;
  
  if (!data.offenses || data.offenses.length === 0) baseScore -= 20;
  if (!data.victims || data.victims.length === 0) baseScore -= 15;
  if (!data.properties || data.properties.length === 0) baseScore -= 10;
  
  if (data.offenses && Array.isArray(data.offenses)) {
    data.offenses.forEach((offense: any) => {
      if (offense.mappingConfidence && offense.mappingConfidence < 0.6) {
        baseScore -= 15;
      } else if (offense.mappingConfidence && offense.mappingConfidence < 0.8) {
        baseScore -= 5;
      }
    });
  }
  
  return Math.max(0, Math.min(100, baseScore));
}

// Enhanced NIBRS error extraction with better categorization - PRESERVED AS REQUESTED
function extractNIBRSErrorDetails(error: Error, descriptiveData?: any) {
  const errorMessage = error.message || "NIBRS report generation failed";
  const details = {
    error: errorMessage,
    missingFields: [] as string[],
    warnings: [] as string[],
    suggestions: [] as string[],
    categorizedFields: {} as any,
  };

  // Parse common NIBRS error patterns
  if (errorMessage.toLowerCase().includes("victim") || errorMessage.includes("Non-victimless offenses require")) {
    details.missingFields.push("Victim information");
    details.suggestions.push("Add victim type (Individual, Society/Public, or Business)");
    details.suggestions.push("For drug/weapon offenses, use 'Society/Public' victim type");
    details.suggestions.push("For assaults/thefts, use 'Individual' victim type");
  }
  
  if (errorMessage.toLowerCase().includes("offense") || errorMessage.includes("No offense descriptions")) {
    details.missingFields.push("Offense description");
    details.suggestions.push("Specify the criminal offense type (e.g., Burglary, Assault, Theft)");
    details.suggestions.push("Use NIBRS-standard offense descriptions");
  }
  
  if (errorMessage.toLowerCase().includes("property")) {
    details.missingFields.push("Property details");
    details.suggestions.push("Describe stolen/damaged property");
    details.suggestions.push("Include property values if available");
  }

  if (errorMessage.toLowerCase().includes("location")) {
    details.missingFields.push("Location information");
    details.suggestions.push("Provide specific location or address");
  }

  if (errorMessage.toLowerCase().includes("date")) {
    details.missingFields.push("Incident date");
    details.suggestions.push("Include when the incident occurred");
  }

  // Add general suggestions if no specific fields identified
  if (details.missingFields.length === 0) {
    details.suggestions.push("Review the narrative for missing crime details");
    details.suggestions.push("Ensure all required NIBRS fields are provided");
  }

  // Categorize the missing fields
  details.categorizedFields = categorizeMissingFields(details.missingFields, "nibrs");

  return details;
}

// NIBRS Report Generation - PRESERVED AS REQUESTED
async function generateNIBRSReport(prompt: string): Promise<any> {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: NIBRS_TEMPLATE_INSTRUCTIONS },
    { role: "user", content: prompt }
  ];

  console.log("=== GENERATING NIBRS REPORT ===");
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.1,
    response_format: { type: "json_object" }
  });

  const raw = completion.choices?.[0]?.message?.content ?? "";
  let parsed: { extractedData: any; narrative: string };

  try {
    parsed = tryParseJSON(raw);
  } catch (e: any) {
    console.error("JSON parsing failed:", e.message);
    throw new Error("NIBRS data extraction failed - invalid JSON format");
  }

  const descriptiveData = parsed.extractedData || {};
  const narrative = (parsed.narrative || "").trim();

  if (!narrative) {
    throw new Error("Narrative missing from NIBRS extraction");
  }

  // Validate descriptive NIBRS data
  const professionalValidation = validateDescriptiveNibrs({
    ...descriptiveData,
    offenses: descriptiveData.offenses || [],
    victims: descriptiveData.victims || [],
    offenders: descriptiveData.offenders || [],
    properties: descriptiveData.properties || [],
    narrative: narrative
  });

  if (professionalValidation.errors.length > 0) {
    throw new Error(`NIBRS validation failed: ${professionalValidation.errors.join(', ')}`);
  }

  // Map to NIBRS codes
  const mapperValidation = NibrsMapper.validateAndMapExtract({
    ...descriptiveData,
    narrative
  });

  if (mapperValidation.errors.length > 0) {
    throw new Error(`NIBRS mapping failed: ${mapperValidation.errors.join(', ')}`);
  }

  const mapped = mapperValidation.data;

  // Validate NIBRS payload
  const { ok, data, errors, warnings: validationWarnings } = validateNibrsPayload(mapped);

  console.log("NIBRS Validation result:", { ok, errors, warnings: validationWarnings });

  const warnings: string[] = [...validationWarnings];
  
  if (!ok && errors.length > 0) {
    throw new Error(`NIBRS payload validation failed: ${errors.join(', ')}`);
  }

  // Calculate accuracy score
  const accuracyScore = calculateAccuracyScore(data || {}, errors, warnings);

  // Validate with template
  const templateErrors = validateWithTemplate(data || {});
  if (templateErrors.length > 0) {
    warnings.push(...templateErrors);
  }

  // Build XML
  const xml = buildNIBRSXML(data);

  return {
    nibrs: data,
    xml,
    accuracyScore,
    warnings
  };
} 

// MAIN POST FUNCTION - UPDATED WITH OPTIMIZED VALIDATION
export async function POST(req: Request) {
  let startTime = Date.now();
  let userId: string | null = null;
  let sessionKey: string | null = null;
  let currentSelectedOffenses: OffenseType[] = [];
  let extractedDataForReport: any[] = [];
  let structuredDataForReport: Record<string, any> = {};
  let offenseTemplate: any = null;

  try {
    const authResult = auth();
    userId = authResult.userId;
    const body = await req.json();
    const { 
      prompt, 
      selectedTemplate, 
      generateBoth = false, 
      correctedData, 
      selectedOffense,
      selectedOffenses,
      sessionKey: clientSessionKey,
      newOffense,
      newOffenses
    } = body;
    startTime = Date.now();

    if (!userId) return new NextResponse("Unauthorized User", { status: 401 });
    if (!openai.apiKey) return new NextResponse("OpenAI API Key not configured", { status: 500 });
    if (!prompt) return new NextResponse("Prompt is required", { status: 400 });

    const freeTrail = await checkApiLimit();
    const isPro = await checkSubscription();

    // Get user's organization
    const organization = await getUserOrganizationWithFallback(userId);

    // Get validation state manager
    const stateManager = ValidationStateManager.getInstance();

    // Handle offense selection
    if (selectedOffenses && Array.isArray(selectedOffenses)) {
      currentSelectedOffenses = selectedOffenses;
    } else if (selectedOffense) {
      currentSelectedOffenses = [selectedOffense];
    }

    // Handle offense changes
    if (newOffenses && Array.isArray(newOffenses)) {
      currentSelectedOffenses = newOffenses;
    } else if (newOffense) {
      currentSelectedOffenses = [newOffense];
    }

    // Generate or use existing session key
    if (correctedData && clientSessionKey) {
      sessionKey = clientSessionKey;
    } else if (currentSelectedOffenses.length > 0) {
      if (currentSelectedOffenses.length === 1) {
        sessionKey = generateSessionKey(userId, currentSelectedOffenses[0].id);
      } else {
        sessionKey = generateMultiOffenseSessionKey(userId, currentSelectedOffenses);
      }
    }

    let previousState: ValidationState | null = null;
    if (sessionKey) {
      previousState = stateManager.getState(sessionKey);
    }

    // STEP 1: OPTIMIZED VALIDATION USING UNIFIED VALIDATOR
    if (currentSelectedOffenses.length > 0 && prompt && !correctedData) {
      console.log("=== OPTIMIZED VALIDATION STARTED ===");
      
      if (currentSelectedOffenses.length === 1) {
        // SINGLE OFFENSE: Use unified validation (1 API call instead of 2)
        const unifiedResult = await unifiedOffenseValidation(prompt, currentSelectedOffenses[0]);
        
        // Check offense validation confidence
        if (unifiedResult.offenseValidation.confidence < 0.7 && unifiedResult.offenseValidation.suggestedOffense) {
          console.log("=== OFFENSE TYPE VALIDATION FAILED ===");
          
          await trackReportEvent({
            userId: userId,
            reportType: "narrative",
            processingTime: Date.now() - startTime,
            success: false,
            templateUsed: selectedTemplate?.templateName,
            offenseType: currentSelectedOffenses[0]?.name,
            error: `Offense validation failed: Suggested ${unifiedResult.offenseValidation.suggestedOffense.name}`
          });

          const errorResponse: CorrectionDataResponse = {
            type: "offense_type_validation_error",
            error: `The narrative appears to better match a different offense type.`,
            missingFields: unifiedResult.missingFields,
            presentFields: unifiedResult.presentFields,
            message: unifiedResult.offenseValidation.reason,
            isComplete: false,
            confidenceScore: unifiedResult.confidenceScore,
            source: "offense_type",
            errorCategory: "OFFENSE_CLASSIFICATION",
            severity: "WARNING",
            guidance: `Consider using "${unifiedResult.offenseValidation.suggestedOffense.name}" instead of "${currentSelectedOffenses[0].name}"`,
            categorizedFields: unifiedResult.categorizedFields,
            offenseName: currentSelectedOffenses[0].name,
            offenseCode: currentSelectedOffenses[0].code,
            offense: currentSelectedOffenses[0],
            fieldExamples: unifiedResult.fieldExamples,
            validationDetails: unifiedResult.validationDetails,
            suggestions: [
              `Switch to ${unifiedResult.offenseValidation.suggestedOffense.name}`,
              `Continue with ${currentSelectedOffenses[0].name} if intentional`,
              ...unifiedResult.offenseValidation.alternativeOffenses.slice(0, 2).map(o => `Alternative: ${o.name}`)
            ],
            sessionKey: sessionKey || undefined,
            originalNarrative: prompt,
            offenseValidation: unifiedResult.offenseValidation,
            extractedData: unifiedResult.extractedData,
            structuredData: unifiedResult.structuredData,
            missingUniversalFields: unifiedResult.missingUniversalFields
          };
          
          return NextResponse.json(errorResponse, { status: 200 });
        }
        
        // Store extracted data for successful validation
        extractedDataForReport = unifiedResult.extractedData;
        structuredDataForReport = unifiedResult.structuredData;
        offenseTemplate = unifiedResult.recommendedTemplate;
        
        // Check for missing fields (including universal)
        if (!unifiedResult.isComplete) {
          console.log("=== MISSING FIELDS DETECTED ===");
          
          const errorResponse: CorrectionDataResponse = {
            type: "offense_validation_error",
            error: "Please provide missing information",
            missingFields: unifiedResult.missingFields,
            presentFields: unifiedResult.presentFields,
            message: unifiedResult.promptForMissingInfo,
            isComplete: false,
            confidenceScore: unifiedResult.confidenceScore,
            source: "offense",
            errorCategory: "OFFENSE_REQUIREMENTS",
            severity: "REQUIRED",
            guidance: unifiedResult.missingUniversalFields && unifiedResult.missingUniversalFields.length > 0
              ? "Date, time, and location are mandatory for all police reports"
              : "Please provide the missing details below",
            categorizedFields: unifiedResult.categorizedFields,
            offenseName: currentSelectedOffenses[0].name,
            offense: currentSelectedOffenses[0],
            fieldExamples: unifiedResult.fieldExamples,
            validationDetails: unifiedResult.validationDetails,
            suggestions: unifiedResult.missingUniversalFields && unifiedResult.missingUniversalFields.length > 0
              ? [`MANDATORY: Provide ${unifiedResult.missingUniversalFields.map(f => UNIVERSAL_FIELD_DEFINITIONS[f as keyof typeof UNIVERSAL_FIELD_DEFINITIONS]?.label || f).join(', ')}`]
              : [`Provide missing fields: ${unifiedResult.missingFields.filter((f: string) => !UNIVERSAL_REQUIRED_FIELDS.includes(f)).join(', ')}`],
            sessionKey: sessionKey || undefined,
            originalNarrative: prompt,
            extractedData: unifiedResult.extractedData,
            structuredData: unifiedResult.structuredData,
            missingUniversalFields: unifiedResult.missingUniversalFields
          };
          
          return NextResponse.json(errorResponse, { status: 200 });
        }
        
      } else {
        // MULTIPLE OFFENSES: Use optimized multi-offense validation
        const multiOffenseValidation = await validateMultipleOffensesOptimized(prompt, currentSelectedOffenses);

        // Store extracted data
        extractedDataForReport = multiOffenseValidation.allExtractedData || [];
        structuredDataForReport = multiOffenseValidation.allStructuredData || {};
        offenseTemplate = multiOffenseValidation.primaryTemplate;

        // Check for completeness
        if (!multiOffenseValidation.allComplete) {
          console.log("=== MULTI-OFFENSE VALIDATION FAILED ===");
          
          const errorResponse: CorrectionDataResponse = {
            type: "offense_validation_error",
            error: "Please provide missing information",
            missingFields: multiOffenseValidation.combinedMissingFields,
            presentFields: multiOffenseValidation.combinedPresentFields,
            message: "Some required information is missing for the selected offenses",
            isComplete: false,
            confidenceScore: Math.min(...multiOffenseValidation.validatedOffenses.map(r => r.validation.confidenceScore)),
            source: "offense",
            errorCategory: "OFFENSE_REQUIREMENTS",
            severity: "REQUIRED",
            guidance: "Please provide the missing details below",
            categorizedFields: categorizeMissingFields(multiOffenseValidation.combinedMissingFields, "offense", "multiple"),
            offenses: currentSelectedOffenses,
            fieldExamples: combineFieldExamples(currentSelectedOffenses, multiOffenseValidation.combinedMissingFields),
            validationDetails: {
              level: 'LOW',
              message: 'Required information missing',
              color: 'red'
            },
            suggestions: generateSuggestionsFromUnifiedResults(multiOffenseValidation.validatedOffenses),
            sessionKey: sessionKey || undefined,
            originalNarrative: prompt,
            multiOffenseValidation: multiOffenseValidation,
            extractedData: extractedDataForReport,
            structuredData: structuredDataForReport,
            missingUniversalFields: UNIVERSAL_REQUIRED_FIELDS.filter(field => 
              !multiOffenseValidation.combinedPresentFields.includes(field)
            )
          };
          
          return NextResponse.json(errorResponse, { status: 200 });
        }
      }
      
      console.log(`✅ Validation completed for ${currentSelectedOffenses.length} offenses`);
    }

    // STEP 2: HANDLE CORRECTED DATA (similar optimization)
    if (correctedData && currentSelectedOffenses.length > 0) {
      console.log("=== VALIDATING CORRECTED DATA ===");
      
      let validationResult: UnifiedValidationResult;
      
      if (currentSelectedOffenses.length === 1) {
        // Single offense with unified validation
        validationResult = await unifiedOffenseValidation(prompt, currentSelectedOffenses[0]);
        offenseTemplate = validationResult.recommendedTemplate;
      } else {
        // Multiple offenses with optimized validation
        const multiOffenseValidation = await validateMultipleOffensesOptimized(prompt, currentSelectedOffenses);
        validationResult = {
          isComplete: multiOffenseValidation.allComplete,
          missingFields: multiOffenseValidation.combinedMissingFields,
          presentFields: multiOffenseValidation.combinedPresentFields,
          extractedData: multiOffenseValidation.allExtractedData || [],
          structuredData: multiOffenseValidation.allStructuredData || {},
          confidenceScore: multiOffenseValidation.validatedOffenses.reduce((sum, result) => sum + result.validation.confidenceScore, 0) / currentSelectedOffenses.length,
          promptForMissingInfo: "Please provide all required information for the selected offenses",
          categorizedFields: categorizeMissingFields(multiOffenseValidation.combinedMissingFields, "offense", "multiple"),
          validationDetails: {
            level: multiOffenseValidation.allComplete ? 'COMPLETE' : 'LOW',
            message: multiOffenseValidation.allComplete ? 'All offenses complete' : 'Required information missing for multiple offenses',
            color: multiOffenseValidation.allComplete ? 'green' : 'red'
          },
          fieldExamples: combineFieldExamples(currentSelectedOffenses, multiOffenseValidation.combinedMissingFields),
          missingUniversalFields: UNIVERSAL_REQUIRED_FIELDS.filter(field => 
            !multiOffenseValidation.combinedPresentFields.includes(field)
          ),
          offenseValidation: {
            suggestedOffense: null,
            confidence: 1.0,
            reason: "Corrected data validation",
            matches: [],
            mismatches: [],
            alternativeOffenses: []
          },
          recommendedTemplate: multiOffenseValidation.primaryTemplate
        };

        extractedDataForReport = multiOffenseValidation.allExtractedData || [];
        structuredDataForReport = multiOffenseValidation.allStructuredData || {};
        offenseTemplate = multiOffenseValidation.primaryTemplate;
      }

      // Update state
      if (sessionKey) {
        const newState: ValidationState = {
          providedFields: validationResult.presentFields,
          cumulativePrompt: prompt,
          originalNarrative: previousState?.originalNarrative || prompt,
          attemptCount: previousState ? previousState.attemptCount + 1 : 1
        };
        stateManager.setState(sessionKey, newState);
      }

      // Check if still incomplete
      if (!validationResult.isComplete) {
        console.log("=== CORRECTION VALIDATION FAILED ===");
        
        const errorResponse: CorrectionDataResponse = {
          type: "offense_validation_error",
          error: validationResult.promptForMissingInfo,
          missingFields: validationResult.missingFields,
          presentFields: validationResult.presentFields,
          message: validationResult.promptForMissingInfo,
          isComplete: false,
          confidenceScore: validationResult.confidenceScore,
          source: "offense",
          errorCategory: "OFFENSE_REQUIREMENTS",
          severity: "REQUIRED",
          guidance: validationResult.missingUniversalFields && validationResult.missingUniversalFields.length > 0
            ? "Date, time, and location are mandatory for all police reports"
            : "Some required information is still missing. Please provide the details below.",
          categorizedFields: validationResult.categorizedFields,
          offenseName: currentSelectedOffenses.length === 1 ? currentSelectedOffenses[0]?.name : `Multiple Offenses (${currentSelectedOffenses.length})`,
          offenses: currentSelectedOffenses.length > 1 ? currentSelectedOffenses : undefined,
          fieldExamples: validationResult.fieldExamples,
          validationDetails: validationResult.validationDetails,
          suggestions: validationResult.missingUniversalFields && validationResult.missingUniversalFields.length > 0
            ? [`MANDATORY: Provide ${validationResult.missingUniversalFields.map(f => UNIVERSAL_FIELD_DEFINITIONS[f as keyof typeof UNIVERSAL_FIELD_DEFINITIONS]?.label || f).join(', ')}`]
            : ["Please provide the remaining missing information"],
          sessionKey: sessionKey || undefined,
          originalNarrative: previousState?.originalNarrative || prompt,
          extractedData: validationResult.extractedData,
          structuredData: validationResult.structuredData,
          missingUniversalFields: validationResult.missingUniversalFields
        };
        
        return NextResponse.json(errorResponse, { status: 200 });
      }
      
      // If validation passed, clear the session state
      if (sessionKey) {
        stateManager.clearState(sessionKey);
      }
    }

    // STEP 3: GENERATE REPORT
    console.log("=== GENERATING NARRATIVE REPORT ===");
    
    let narrativeContent: string;
    
    if (offenseTemplate) {
      narrativeContent = await generateEnhancedNarrativeReport(
        prompt, 
        offenseTemplate, 
        currentSelectedOffenses,
        extractedDataForReport,
        structuredDataForReport
      );
    } else if (extractedDataForReport.length > 0) {
      narrativeContent = await generateEnhancedNarrativeReport(
        prompt, 
        selectedTemplate, 
        currentSelectedOffenses,
        extractedDataForReport,
        structuredDataForReport
      );
    } else {
      // Fallback to basic generation
      const systemInstructions = createNarrativeSystemInstructions(selectedTemplate, currentSelectedOffenses);
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemInstructions },
        { role: "user", content: `OFFICER NARRATIVE TO CONVERT:\n${prompt}` }
      ];
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages,
        temperature: 0.1
      });
      narrativeContent = response.choices[0].message.content || "";
    }
    
    const processingTime = Date.now() - startTime;

    // STEP 4: SAVE REPORT AND TRACK
    if (narrativeContent) {
      const savedReport = await prismadb.userReports.create({
        data: {
          userId: userId,
          reportName: `${currentSelectedOffenses.length > 0 ? currentSelectedOffenses.map(o => o.name).join(', ') : offenseTemplate?.name || 'Narrative'} Report - ${new Date().toLocaleDateString()}`,
          reportText: narrativeContent,
          tag: 'narrative_report',
          offenseType: currentSelectedOffenses.length === 1 ? currentSelectedOffenses[0]?.name : `Multiple: ${currentSelectedOffenses.length} offenses`,
          offenseCode: currentSelectedOffenses.length === 1 ? currentSelectedOffenses[0]?.code : 'MULTIPLE'
        }
      });

      // Save to DepartmentReport table using shared organization
      if (organization) {
        const departmentReport = await prismadb.departmentReport.create({
          data: {
            organizationId: organization.id,
            clerkUserId: userId,
            reportType: 'narrative_report',
            title: `${currentSelectedOffenses.length > 0 ? currentSelectedOffenses.map(o => o.name).join(', ') : offenseTemplate?.name || 'Narrative'} Report - ${new Date().toLocaleDateString()}`,
            content: narrativeContent,
            status: 'submitted',
            submittedAt: new Date(),
            flagged: false,
            offenseType: currentSelectedOffenses.length === 1 ? currentSelectedOffenses[0]?.name : `Multiple: ${currentSelectedOffenses.length} offenses`,
            offenseCode: currentSelectedOffenses.length === 1 ? currentSelectedOffenses[0]?.code : 'MULTIPLE',
            templateUsed: offenseTemplate?.name || selectedTemplate?.templateName
          }
        });

        // Update organization report count
        await prismadb.organization.update({
          where: { id: organization.id },
          data: { 
            reportCount: { increment: 1 },
            updatedAt: new Date()
          }
        });
      }

      // Track success
      await trackReportEvent({
        userId: userId,
        reportType: "narrative_report",
        processingTime: processingTime,
        success: true,
        templateUsed: offenseTemplate?.name || selectedTemplate?.templateName,
        offenseType: currentSelectedOffenses.length === 1 ? currentSelectedOffenses[0]?.name : `Multiple: ${currentSelectedOffenses.length} offenses`,
      });

      await trackUserActivity({
        userId: userId,
        activity: "report_created",
        metadata: {
          reportType: "narrative_report",
          templateUsed: offenseTemplate?.name || selectedTemplate?.templateName,
          offenseType: currentSelectedOffenses.length === 1 ? currentSelectedOffenses[0]?.name : `Multiple: ${currentSelectedOffenses.length} offenses`,
          reportId: savedReport.id,
          organizationId: organization?.id,
          hasNibrs: false,
        }
      });

      // Track department activity
      if (organization) {
        await prismadb.departmentActivityLog.create({
          data: {
            organizationId: organization.id,
            userId: userId,
            activityType: 'report_submitted',
            description: `Submitted ${currentSelectedOffenses.length === 1 ? currentSelectedOffenses[0]?.name : 'multiple offenses'} report using ${offenseTemplate?.name || 'standard'} template`,
            metadata: JSON.stringify({
              reportType: 'narrative_report',
              template: offenseTemplate?.name || selectedTemplate?.templateName,
              offenseType: currentSelectedOffenses.length === 1 ? currentSelectedOffenses[0]?.name : `Multiple: ${currentSelectedOffenses.length} offenses`,
              processingTime: processingTime,
              hasNibrs: false,
            })
          }
        });
      }

      if (!isPro) await increaseAPiLimit();

      // Save to history
      await saveHistoryReport(userId, `${Date.now()}`, narrativeContent, "narrative_report");

      console.log("✅ NARRATIVE REPORT GENERATED SUCCESSFULLY");
      
      // Return narrative report only
      return NextResponse.json({
        narrative: narrativeContent,
        success: true,
        templateUsed: offenseTemplate?.name
      }, { status: 200 });
    } else {
      // If narrative generation failed
      return NextResponse.json({
        narrative: "",
        success: false,
        message: "Narrative report generation failed"
      }, { status: 200 });
    }

  } catch (error) {
    console.log("[UNIFIED_REPORT_ERROR]", error);
    
    if (sessionKey) {
      ValidationStateManager.getInstance().clearState(sessionKey);
    }
    
    if (userId) {
      await trackReportEvent({
        userId: userId,
        reportType: "narrative_report",
        processingTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
    
    return new NextResponse("Internal Error", { status: 500 });
  }
}