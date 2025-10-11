// lib/offence-validator.ts - UPDATED WITH MISSING FUNCTION
import { GROUP_A_OFFENSES, OffenseType } from "@/constants/offences";
import { getTemplateByOffense, OffenseTemplate } from "@/constants/offnce-templates";
import { getFieldExamples, enhanceCategorizedFields, calculateValidationConfidence } from './field-utils';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EnhancedValidationResult {
  [x: string]: any;
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
  extractedData?: any[];
  structuredData?: Record<string, any>;
  recommendedTemplate?: OffenseTemplate;
}

// ADD THE MISSING FUNCTION
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

export async function validateOffenseWithTemplate(
  narrative: string, 
  offense: OffenseType
): Promise<EnhancedValidationResult> {
  
  // Get the appropriate template for this offense
  const template = getTemplateByOffense(offense);
  
  const validationPrompt = `
OFFENSE-SPECIFIC VALIDATION: ${offense.name}

TEMPLATE TYPE: ${template.name}
CATEGORY: ${offense.category}

REQUIRED FIELDS FOR THIS OFFENSE:
${offense.requiredFields.map(field => {
  const def = offense.fieldDefinitions[field];
  const examples = getFieldExamples(field, offense.category);
  return `- ${field}: ${def?.description || 'Required field'} (Example: ${examples})`;
}).join('\n')}

NARRATIVE TO ANALYZE:
"${narrative}"

TEMPLATE STRUCTURE (for context):
${template.template}

VALIDATION TASK:
1. Check if the narrative contains information for EACH required field above
2. Only validate against the required fields for ${offense.name}
3. Ignore template fields that don't apply to this specific offense type
4. Extract any available data for the required fields

RESPONSE FORMAT - JSON ONLY:
{
  "isComplete": boolean,
  "missingFields": ["array_of_missing_fields_from_required_fields_only"],
  "presentFields": ["array_of_present_fields_from_required_fields_only"],
  "extractedData": [
    {
      "field": "field_name",
      "value": "extracted_value",
      "confidence": 0.95,
      "source": "text_from_narrative"
    }
  ],
  "structuredData": {
    // Key-value pairs of extracted data
  },
  "confidenceScore": number_between_0_and_1,
  "promptForMissingInfo": "Specific guidance for completing this offense report"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: validationPrompt }],
      temperature: 0.1,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content in validation response");
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in validation response");
    
    const result = JSON.parse(jsonMatch[0]);
    
    // Ensure arrays exist
    result.missingFields = result.missingFields || [];
    result.presentFields = result.presentFields || [];
    result.extractedData = result.extractedData || [];
    result.structuredData = result.structuredData || {};
    
    // Add template information
    result.recommendedTemplate = template;
    
    // Add categorization and examples
    result.categorizedFields = categorizeMissingFields(result.missingFields, "offense", offense.name);
    result.categorizedFields = enhanceCategorizedFields(result.categorizedFields, offense);
    
    // Calculate confidence
    const confidence = calculateValidationConfidence(
      result.presentFields, 
      result.missingFields, 
      offense
    );
    
    result.confidenceScore = confidence.score;
    result.validationDetails = confidence;
    
    // Add field examples for missing fields
    result.fieldExamples = {};
    result.missingFields.forEach((field: string) => {
      result.fieldExamples[field] = getFieldExamples(field, offense.category);
    });

    return result as EnhancedValidationResult;
    
  } catch (error) {
    console.error("Template-based validation error:", error);
    
    // Fallback result
    return {
      isComplete: false,
      missingFields: offense.requiredFields,
      presentFields: [],
      confidenceScore: 0,
      promptForMissingInfo: `Please provide all required information for ${offense.name}`,
      categorizedFields: categorizeMissingFields(offense.requiredFields, "offense", offense.name),
      validationDetails: {
        level: 'LOW',
        message: 'Validation failed',
        color: 'red'
      },
      fieldExamples: offense.requiredFields.reduce((acc: any, field: string) => {
        acc[field] = getFieldExamples(field, offense.category);
        return acc;
      }, {}),
      recommendedTemplate: getTemplateByOffense(offense)
    };
  }
}