import { StandardErrorResponse } from "./errorResponse";
import { NibrsMapper } from "./mapper";
import { validateProfessionalNibrs } from "./Validator";

export class NIBRSErrorBuilder {
  static fromProfessionalValidation(
    validationResult: ReturnType<typeof validateProfessionalNibrs>,
    descriptiveData: any
  ): StandardErrorResponse {
    return {
      error: "Incomplete report for NIBRS standards",
      missingFields: validationResult.errors,
      warnings: validationResult.warnings,
      suggestions: validationResult.correctionSuggestions,
      requiredLevel: "Police Agency Professional",
      nibrsData: descriptiveData
    };
  }

  static fromSchemaValidation(
    errors: string[],
    warnings: string[],
    nibrsData: any,
    correctionContext: any
  ): StandardErrorResponse {
    return {
      error: "NIBRS validation failed",
      warnings,
      nibrsData,
      correctionContext,
      suggestions: errors.map(error => `Validation error: ${error}`)
    };
  }

  static fromTemplateValidation(
    templateErrors: string[],
    warnings: string[],
    nibrsData: any,
    correctionContext: any
  ): StandardErrorResponse {
    return {
      error: "Template validation failed",
      warnings,
      nibrsData,
      correctionContext,
      suggestions: templateErrors.map(error => `Template error: ${error}`),
      missingFields: this.extractMissingFieldsFromTemplateErrors(templateErrors)
    };
  }

  static fromGenericError(error: string, nibrsData: any = {}): StandardErrorResponse {
    return {
      error,
      nibrsData,
      suggestions: ["Please review your input and try again"]
    };
  }

  static fromMapperValidation(result: ReturnType<typeof NibrsMapper.validateAndMapExtract>): StandardErrorResponse {
    return {
      error: "NIBRS mapping validation failed",
      warnings: result.warnings,
      nibrsData: result.data,
      suggestions: result.errors.map(error => `Mapping error: ${error}`),
      missingFields: result.errors
    };
  }

  private static extractMissingFieldsFromTemplateErrors(templateErrors: string[]): string[] {
    const missingFields: string[] = [];
    
    templateErrors.forEach(error => {
      if (error.includes("is required")) {
        const fieldMatch = error.match(/(Victim|Offender) (\w+) is required/);
        if (fieldMatch) {
          missingFields.push(`${fieldMatch[1]} ${fieldMatch[2]}`);
        } else if (error.includes("Property information is required")) {
          missingFields.push("Property details");
        } else if (error.includes("Evidence information is required")) {
          missingFields.push("Evidence details");
        }
      }
    });
    
    return missingFields;
  }
}