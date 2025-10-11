// lib/unified-offense-validator.ts - FIXED VERSION
import { GROUP_A_OFFENSES, OffenseType } from "@/constants/offences";
import { getTemplateByOffense } from "@/constants/offnce-templates";
import { getFieldExamples, enhanceCategorizedFields, calculateValidationConfidence } from './field-utils';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Universal fields
export const UNIVERSAL_REQUIRED_FIELDS = [
  'incidentDate',
  'incidentTime', 
  'locationDescription'
];

export const UNIVERSAL_FIELD_DEFINITIONS = {
  incidentDate: {
    label: "Incident Date",
    description: "The date when the incident occurred",
    required: true,
    examples: "2024-01-15, January 15, 2024, yesterday, last Tuesday"
  },
  incidentTime: {
    label: "Incident Time", 
    description: "The time when the incident occurred",
    required: true,
    examples: "14:30, 2:30 PM, around noon, approximately 10:00"
  },
  locationDescription: {
    label: "Location Description",
    description: "Where the incident took place",
    required: true,
    examples: "123 Main Street, parking lot of Walmart, near the intersection of 5th and Elm"
  }
};

export interface UnifiedValidationResult {
  isComplete: boolean;
  missingFields: string[];
  presentFields: string[];
  extractedData: any[];
  structuredData: Record<string, any>;
  confidenceScore: number;
  promptForMissingInfo: string;
  categorizedFields: any;
  validationDetails: any;
  fieldExamples: Record<string, string>;
  missingUniversalFields: string[];
  offenseValidation: {
    suggestedOffense: OffenseType | null;
    confidence: number;
    reason: string;
    matches: string[];
    mismatches: string[];
    alternativeOffenses: OffenseType[];
  };
  recommendedTemplate?: any;
}

// Add the missing categorizeMissingFields function
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

export async function unifiedOffenseValidation(
  narrative: string, 
  offense: OffenseType
): Promise<UnifiedValidationResult> {
  
  const combinedPrompt = `
COMBINED OFFENSE VALIDATION AND DATA EXTRACTION

*** MANDATORY UNIVERSAL FIELDS (REQUIRED FOR ALL REPORTS) ***
${UNIVERSAL_REQUIRED_FIELDS.map(field => {
  const def = UNIVERSAL_FIELD_DEFINITIONS[field as keyof typeof UNIVERSAL_FIELD_DEFINITIONS];
  return `- ${field}: ${def?.description} (Example: ${def?.examples}) - MANDATORY`;
}).join('\n')}

*** OFFENSE BEING VALIDATED ***
- Name: ${offense.name}
- Code: ${offense.code}  
- Category: ${offense.category}
- Description: ${offense.description}
- Required Fields: ${offense.requiredFields.join(', ')}

*** OFFENSE-SPECIFIC FIELD DEFINITIONS ***
${offense.requiredFields.map(field => {
  const def = offense.fieldDefinitions?.[field];
  const examples = getFieldExamples(field, offense.category);
  return `- ${field}: ${def?.description || 'Required field'} (Example: ${examples})`;
}).join('\n')}

*** TOP RELEVANT OFFENSES FOR COMPARISON ***
${GROUP_A_OFFENSES
  .filter(o => o.category === offense.category || o.severity === offense.severity)
  .slice(0, 6)
  .map(o => `- ${o.name} (${o.code}): ${o.description}`)
  .join('\n')}

*** NARRATIVE TO ANALYZE ***
"${narrative}"

*** COMBINED VALIDATION TASKS ***
1. OFFENSE MATCHING: Does this narrative clearly describe ${offense.name}? Provide confidence (0-1).
2. UNIVERSAL FIELDS: Extract date, time, location (MANDATORY - mark missing if not found)
3. DATA EXTRACTION: Extract values for all offense-specific required fields
4. COMPLETENESS: Determine if report has all mandatory universal fields + offense-specific fields

*** IMPORTANT FOR MULTI-OFFENSE SCENARIOS ***
- For universal fields (date, time, location): mark as present if found ANYWHERE in narrative
- For offense-specific fields: only validate against THIS specific offense
- Report isComplete as FALSE if ANY universal fields are missing
- Report isComplete as FALSE if ANY offense-specific required fields are missing

*** RESPONSE FORMAT - JSON ONLY ***
{
  "offenseValidation": {
    "suggestedOffenseId": "offense_id_or_null_if_correct",
    "confidence": 0.95,
    "reason": "detailed_explanation_of_match_quality",
    "matches": ["specific_matching_elements_from_narrative"],
    "mismatches": ["specific_missing_or_mismatched_elements"],
    "alternativeOffenseIds": ["array_of_better_alternative_offense_ids"]
  },
  "dataExtraction": {
    "isComplete": boolean,
    "missingFields": ["array_of_missing_offense_specific_fields"],
    "presentFields": ["array_of_all_present_fields_including_universal"],
    "extractedData": [
      {
        "field": "field_name",
        "value": "actual_extracted_value",
        "confidence": 0.95,
        "source": "exact_text_from_narrative"
      }
    ],
    "structuredData": {
      "incidentDate": "extracted_date_if_found",
      "incidentTime": "extracted_time_if_found",
      "locationDescription": "extracted_location_if_found"
    },
    "missingUniversalFields": ["array_of_missing_universal_fields"],
    "promptForMissingInfo": "specific_guidance_for_completion"
  }
}

CRITICAL: 
- If any universal fields are missing, isComplete MUST be false
- presentFields should include ALL fields found (both universal and offense-specific)
- missingFields should include ONLY offense-specific missing fields
- missingUniversalFields should include ONLY universal fields that are missing
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: combinedPrompt }],
      temperature: 0.1,
      max_tokens: 3000
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content in unified validation response");
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in unified validation response");
    
    const result = JSON.parse(jsonMatch[0]);
    
    // Process offense validation
    const suggestedOffense = result.offenseValidation?.suggestedOffenseId ? 
      GROUP_A_OFFENSES.find(o => o.id === result.offenseValidation.suggestedOffenseId) || null : null;
    
    const alternativeOffenses = (result.offenseValidation?.alternativeOffenseIds || [])
      .map((id: string) => GROUP_A_OFFENSES.find(o => o.id === id))
      .filter(Boolean) as OffenseType[];

    const offenseValidationResult = {
      suggestedOffense,
      confidence: result.offenseValidation?.confidence || 0.5,
      reason: result.offenseValidation?.reason || "Validation completed",
      matches: result.offenseValidation?.matches || [],
      mismatches: result.offenseValidation?.mismatches || [],
      alternativeOffenses
    };

    // Process data extraction
    const extraction = result.dataExtraction || {};
    const missingUniversal = extraction.missingUniversalFields || [];
    
    // Combine all missing fields (offense-specific + universal)
    const allMissingFields = Array.from(new Set([
      ...(extraction.missingFields || []),
      ...missingUniversal
    ]));
    
    const allPresentFields = extraction.presentFields || [];

    // Calculate final completeness - MUST be false if universal fields missing
    const finalComplete = extraction.isComplete && missingUniversal.length === 0;

    // Calculate confidence score
    const baseConfidence = calculateValidationConfidence(
      allPresentFields,
      allMissingFields,
      offense
    );

    // Penalize heavily for missing universal fields
    let finalConfidence = baseConfidence.score;
    if (missingUniversal.length > 0) {
      finalConfidence = Math.max(0, finalConfidence - (missingUniversal.length * 0.4));
      baseConfidence.level = 'LOW';
      baseConfidence.message = `Missing mandatory fields: ${missingUniversal.join(', ')}`;
      baseConfidence.color = 'red';
    }

    // Adjust validation details based on offense validation confidence
    if (offenseValidationResult.confidence < 0.7) {
      baseConfidence.level = 'MEDIUM';
      baseConfidence.message = 'Offense type may be incorrect';
      baseConfidence.color = 'orange';
      finalConfidence = Math.min(finalConfidence, offenseValidationResult.confidence);
    }

    // Build field examples
    const fieldExamples: Record<string, string> = {};
    
    allMissingFields.forEach((field: string) => {
      if (UNIVERSAL_REQUIRED_FIELDS.includes(field)) {
        const def = UNIVERSAL_FIELD_DEFINITIONS[field as keyof typeof UNIVERSAL_FIELD_DEFINITIONS];
        fieldExamples[field] = def?.examples || `Provide ${field}`;
      } else {
        fieldExamples[field] = getFieldExamples(field, offense.category);
      }
    });

    const finalResult: UnifiedValidationResult = {
      isComplete: finalComplete,
      missingFields: allMissingFields,
      presentFields: allPresentFields,
      extractedData: extraction.extractedData || [],
      structuredData: extraction.structuredData || {},
      confidenceScore: finalConfidence,
      promptForMissingInfo: extraction.promptForMissingInfo || "Please provide missing information",
      categorizedFields: categorizeMissingFields(allMissingFields, "offense", offense.name),
      validationDetails: baseConfidence,
      fieldExamples,
      missingUniversalFields: missingUniversal,
      offenseValidation: offenseValidationResult,
      recommendedTemplate: getTemplateByOffense(offense)
    };

    // Enhance categorization
    finalResult.categorizedFields = enhanceCategorizedFields(finalResult.categorizedFields, offense);

    return finalResult;

  } catch (error) {
    console.error("Unified validation error:", error);
    
    // Fallback to separate validations
    return await fallbackToSeparateValidations(narrative, offense);
  }
}

// Fallback function that uses your existing validators
async function fallbackToSeparateValidations(narrative: string, offense: OffenseType): Promise<UnifiedValidationResult> {
  // Import the existing validators
  const { validateOffenseWithTemplate } = await import('./offence-validator');
  
  // Use your existing template-based validation
  const dataExtraction = await validateOffenseWithTemplate(narrative, offense);
  
  // For offense validation, we'll create a simple one since we don't have the standalone function
  const offenseValidationResult = {
    suggestedOffense: null,
    confidence: 0.7, // Default medium confidence
    reason: "Used fallback validation method",
    matches: [],
    mismatches: [],
    alternativeOffenses: []
  };

  // Check for universal fields
  const missingUniversal = UNIVERSAL_REQUIRED_FIELDS.filter(field => 
    !dataExtraction.presentFields?.includes(field)
  );

  const allMissingFields = Array.from(new Set([
    ...(dataExtraction.missingFields || []),
    ...missingUniversal
  ]));

  const finalComplete = dataExtraction.isComplete && missingUniversal.length === 0;

  // Build field examples
  const fieldExamples: Record<string, string> = {};
  allMissingFields.forEach((field: string) => {
    if (UNIVERSAL_REQUIRED_FIELDS.includes(field)) {
      const def = UNIVERSAL_FIELD_DEFINITIONS[field as keyof typeof UNIVERSAL_FIELD_DEFINITIONS];
      fieldExamples[field] = def?.examples || `Provide ${field}`;
    } else {
      fieldExamples[field] = getFieldExamples(field, offense.category);
    }
  });

  return {
    isComplete: finalComplete,
    missingFields: allMissingFields,
    presentFields: dataExtraction.presentFields || [],
    extractedData: dataExtraction.extractedData || [],
    structuredData: dataExtraction.structuredData || {},
    confidenceScore: dataExtraction.confidenceScore,
    promptForMissingInfo: dataExtraction.promptForMissingInfo,
    categorizedFields: dataExtraction.categorizedFields,
    validationDetails: dataExtraction.validationDetails,
    fieldExamples,
    missingUniversalFields: missingUniversal,
    offenseValidation: offenseValidationResult,
    recommendedTemplate: getTemplateByOffense(offense)
  };
}