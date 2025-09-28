import { checkApiLimit, increaseAPiLimit } from "@/lib/api-limits";
import { saveHistoryReport } from "@/lib/history-reports";
import { checkSubscription } from "@/lib/subscription";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai/index.mjs";

type ChatCompletionMessageParam = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validation function - FIXED to only check required fields
async function validateNarrativeCompleteness(narrative: string, template: any) {
  // Only validate against the actual required fields defined in the template
  const requiredFields = template.requiredFields || [];

  console.log("template structue:", template);
  
  if (requiredFields.length === 0) {
    return {
      isComplete: true,
      missingFields: [],
      presentFields: [],
      confidenceScore: 1.0,
      promptForMissingInfo: "No specific fields required for this template."
    };
  }

  const validationPrompt = `
CRITICAL TASK: Police Report Field Validation

You are validating if a police narrative contains specific required information. ONLY check for the fields listed below.

REQUIRED FIELDS TO VALIDATE:
${requiredFields.map((field: string) => {
  const fieldDef = template.fieldDefinitions?.[field];
  return `- ${field}: ${fieldDef?.label || field} - ${fieldDef?.description || 'No description'}`;
}).join('\n')}

NARRATIVE TO VALIDATE:
"${narrative}"

YOUR TASK: Check if the narrative contains information for EACH of the required fields above.

RESPONSE FORMAT - JSON ONLY:
{
  "isComplete": true or false,
  "missingFields": ["only_fields_from_required_list_above"],
  "presentFields": ["only_fields_from_required_list_above"],
  "confidenceScore": number between 0-1,
  "promptForMissingInfo": "Brief, professional prompt asking only for the missing required fields"
}

IMPORTANT RULES:
- ONLY check for the fields in the "REQUIRED FIELDS TO VALIDATE" list above
- Ignore any other fields not in that list
- A field is considered "present" if the narrative mentions something relevant to it
- Be reasonable - if the narrative has "Officer Johnson assisted", that counts for officer_name
- If "123 Main Street" is mentioned, that counts for location
- If "2:30 PM" is mentioned, that counts for date_time

Example: If required fields are ["date_time", "location", "officer_name"], only check for those three.
`;

  try {
    const validationResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: validationPrompt }],
      temperature: 0.1,
      max_tokens: 500
    });

    const content = validationResponse.choices[0].message.content;
    if (!content) {
      throw new Error("No content in validation response");
    }
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("Raw validation response:", content);
      throw new Error("No JSON found in validation response");
    }
    
    const result = JSON.parse(jsonMatch[0]);
    console.log("Validation Result:", result);
    return result;
  } catch (error) {
    console.error("Validation error:", error);
    // Return incomplete to be safe when validation fails
    return {
      isComplete: false,
      missingFields: requiredFields,
      presentFields: [],
      confidenceScore: 0.9,
      promptForMissingInfo: `System validation error. Please ensure you provide: ${requiredFields.join(', ')}`
    };
  }
}

// Create strict system instructions
function createStrictSystemInstructions(template: any) {
  if (!template) {
    return `You are a professional police report writer. Convert the officer's narrative into a standardized format.`;
  }

  const fieldDefinitions = template.fieldDefinitions || {};
  const requiredFields = template.requiredFields || [];
  
  const requiredFieldsText = requiredFields.map((field: string) => {
    const def = fieldDefinitions[field];
    return `- ${field}: ${def?.description || 'No description'} ${def?.required ? '(REQUIRED)' : ''}`;
  }).join('\n') || 'No specific fields required';

  return `
POLICE REPORT TEMPLATE CONVERSION

TEMPLATE REQUIREMENTS:
${requiredFieldsText}

TEMPLATE INSTRUCTIONS:
${template.instructions || 'Convert the narrative into a professional police report format.'}

FORMATTING RULES:
- Use the exact structure provided in the examples
- Only include information explicitly stated in the narrative
- Mark missing information as "INFORMATION NOT PROVIDED"
- Use professional law enforcement terminology
`;
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { prompt, selectedTemplate } = body;

    if (!userId) {
      return new NextResponse("Unauthorized User", { status: 401 });
    }
    if (!openai.apiKey) {
      return new NextResponse("OpenAI API key is Invalid", { status: 500 });
    }
    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    const freeTrail = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrail && !isPro) {
      return new NextResponse("Free Trial has expired", { status: 403 });
    }

    // STEP 1: VALIDATE NARRATIVE COMPLETENESS
    if (selectedTemplate?.strictMode !== false && selectedTemplate?.requiredFields?.length > 0) {
      console.log("=== STARTING VALIDATION ===");
      console.log("Template:", selectedTemplate.templateName);
      console.log("Required fields to validate:", selectedTemplate.requiredFields);
      console.log("Narrative:", prompt);
      
      const validationResult = await validateNarrativeCompleteness(prompt, selectedTemplate);
      
      console.log("=== VALIDATION RESULT ===");
      console.log("Is Complete:", validationResult.isComplete);
      console.log("Missing Fields:", validationResult.missingFields);
      console.log("Present Fields:", validationResult.presentFields);
      console.log("Confidence Score:", validationResult.confidenceScore);

      // Only fail validation if there are missing required fields
      if (!validationResult.isComplete && validationResult.missingFields.length > 0) {
        console.log("=== VALIDATION FAILED - MISSING REQUIRED FIELDS ===");
        return NextResponse.json({
          type: "validation_error",
          missingFields: validationResult.missingFields,
          presentFields: validationResult.presentFields,
          message: validationResult.promptForMissingInfo,
          isComplete: false,
          confidenceScore: validationResult.confidenceScore
        }, { status: 200 });
      }
      
      console.log("=== VALIDATION PASSED - ALL REQUIRED FIELDS PRESENT ===");
    } else {
      console.log("=== NO VALIDATION NEEDED ===");
      console.log("Strict mode:", selectedTemplate?.strictMode);
      console.log("Required fields:", selectedTemplate?.requiredFields);
    }

    // STEP 2: GENERATE THE REPORT
    const systemInstructions = createStrictSystemInstructions(selectedTemplate);
    
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemInstructions },
      ...(selectedTemplate?.examples ? [{ role: "system" as const, content: `EXAMPLE FORMAT:\n${selectedTemplate.examples}` }] : []),
      { role: "user", content: `OFFICER NARRATIVE TO CONVERT:\n${prompt}` }
    ];
    
    console.log("=== GENERATING REPORT ===");
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.1
    });

    if (!isPro) {
      await increaseAPiLimit();
    }

    const responseContent = response.choices[0].message.content;
    
    await saveHistoryReport(
      userId,
      `${Date.now()}`,
      responseContent || "",
      "arrest"
    );

    console.log("=== REPORT GENERATED SUCCESSFULLY ===");
    return NextResponse.json({
      type: "success",
      content: responseContent,
      isComplete: true
    }, { status: 200 });

  } catch (error) {
    console.log("[CONVERSATION_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}