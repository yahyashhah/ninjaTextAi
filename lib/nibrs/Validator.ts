import { NibrsSegmentsSchema } from "./schema";
import { 
  NIBRS_OFFENSE_CODES,
  NIBRS_LOCATION_CODES,
  NIBRS_WEAPON_CODES,
  NIBRS_RELATIONSHIP_CODES,
  NIBRS_PROPERTY_CODES,
  NIBRS_GROUP_A_OFFENSE_CODES,
  NIBRS_GROUP_B_OFFENSE_CODES
} from "./codes";
import { NIBRS_TEMPLATES } from "./templates";
import { NibrsMapper } from "./mapper";

// NEW: Professional validation for police standards
export function validateProfessionalNibrs(data: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  correctionSuggestions: string[];
  missingFields?: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const missingFields: string[] = [];

  // 1. Validate offense types
  const hasGroupA = data.offenses && data.offenses.some((offense: any) => 
    Object.values(NIBRS_GROUP_A_OFFENSE_CODES).includes(offense.code)
  );
  
  const hasGroupB = data.offenses && data.offenses.some((offense: any) => 
    Object.values(NIBRS_GROUP_B_OFFENSE_CODES).includes(offense.code)
  );

  if (!hasGroupA && hasGroupB) {
    warnings.push("Report contains only Group B offenses. These typically require arrest data.");
  }

  if (!hasGroupA && !hasGroupB) {
    errors.push("No valid NIBRS offenses identified");
    suggestions.push("Describe specific criminal acts like assault, theft, drug violations, etc.");
  }

  // 2. Validate victim assignment
  const hasVictimless = data.offenses && data.offenses.some((offense: any) => 
    NibrsMapper.isVictimlessOffense(offense.code)
  );
  
  const hasSocietyVictim = data.victims && data.victims.some((victim: any) => victim.type === "S");
  const hasIndividualVictim = data.victims && data.victims.some((victim: any) => victim.type === "I" || victim.type === "B");

  if (hasVictimless && !hasSocietyVictim) {
    errors.push("Drug/weapon offenses require a Society/Public victim (Type S)");
    suggestions.push("Add a society victim for drug/weapon offenses");
  }

  if (!hasVictimless && data.offenses && data.offenses.length > 0 && !hasIndividualVictim) {
    errors.push("Non-victimless offenses require individual or business victims");
    suggestions.push("Add individual victim information including type and injury details");
  }

  // 3. Validate required fields for police standards
  if (!data.administrative?.incidentDate) {
    errors.push("Incident date is required");
    missingFields.push("Incident Date");
    suggestions.push("Include the exact date of the incident (YYYY-MM-DD format)");
  }

  // Check location code at the segment level
  if (!data.locationCode || data.locationCode === "29") {
    warnings.push("Location description is vague or missing");
    suggestions.push("Specify the exact location where the incident occurred");
  }

  // 4. Validate offender information for serious crimes
  const seriousOffenses = data.offenses && data.offenses.filter((offense: any) => 
    ['09A', '11A', '120', '121', '13A', '220'].includes(offense.code)
  );

  if (seriousOffenses && seriousOffenses.length > 0 && (!data.offenders || data.offenders.length === 0)) {
    warnings.push("Serious offenses should include offender information");
    suggestions.push("Add offender demographics (age, sex, race) for serious crimes");
  }

  // 5. Validate traffic scenarios
  const trafficErrors = validateTrafficScenario(data);
  errors.push(...trafficErrors);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    correctionSuggestions: suggestions,
    missingFields
  };
}

// Add this to your validator.ts - NEW function for descriptive data (pre-mapping)
export function validateDescriptiveNibrs(data: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  correctionSuggestions: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // 1. Validate offense descriptions (not codes yet!)
  const hasValidOffenses = data.offenses && data.offenses.some((offense: any) => 
    offense.description && offense.description.length > 0
  );

  if (!hasValidOffenses) {
    errors.push("No offense descriptions found");
    suggestions.push("Describe specific criminal acts like assault, theft, drug violations, etc.");
  }

  // 2. Validate victim assignment (check types, not codes)
  const hasSocietyVictim = data.victims && data.victims.some((victim: any) => victim.type === "S");
  const hasIndividualVictim = data.victims && data.victims.some((victim: any) => victim.type === "I" || victim.type === "B");

  // Check if we have drug/weapon descriptions but no society victim
  const hasDrugWeaponDescription = data.offenses && data.offenses.some((offense: any) => 
    offense.description && /drug|narcotic|cocaine|weapon|firearm/i.test(offense.description.toLowerCase())
  );

  if (hasDrugWeaponDescription && !hasSocietyVictim) {
    warnings.push("Drug/weapon offenses typically require a Society/Public victim");
    suggestions.push("Consider adding a society victim for drug/weapon offenses");
  }

  // 3. Validate required fields
  if (!data.incidentDate) {
    errors.push("Incident date is required");
    suggestions.push("Include the exact date of the incident (YYYY-MM-DD format)");
  }

  if (!data.locationDescription || data.locationDescription.toLowerCase().includes("unknown")) {
    warnings.push("Location description is vague or missing");
    suggestions.push("Specify the exact location where the incident occurred");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    correctionSuggestions: suggestions
  };
}

function validateTrafficScenario(data: any): string[] {
  const errors: string[] = [];
  const narrativeLower = data.narrative?.toLowerCase() || "";

  // Check if narrative describes traffic collision but no valid offenses
  const hasTrafficTerms = /collision|accident|crash|vehicle.*accident|rear.*end|at.fault/i.test(narrativeLower);
  const hasValidOffenses = data.offenses && data.offenses.length > 0;
  
  if (hasTrafficTerms && !hasValidOffenses) {
    errors.push("Traffic collision described but no NIBRS-reportable offenses found. Include criminal offenses like DUI or drug violations.");
  }

  return errors;
}

// Helper function to check if a value exists in location codes
function isValidLocationCode(code: string): boolean {
  return Object.values(NIBRS_LOCATION_CODES).includes(code);
}

// Helper function to check if a value exists in offense codes  
function isValidOffenseCode(code: string): boolean {
  return Object.values(NIBRS_OFFENSE_CODES).includes(code);
}

export function validateNibrsPayload(raw: unknown): {
  ok: boolean;
  data?: any;
  errors: string[];
  warnings: string[];
  correctionContext?: any;
  missingFields?: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const correctionContext: any = {
    missingVictims: [],
    ambiguousProperties: [],
    requiredFields: [],
    multiOffenseIssues: [],
    professionalSuggestions: []
  };
  const missingFields: string[] = [];

  try {
    // Basic schema validation
    const result = NibrsSegmentsSchema.safeParse(raw);
    if (!result.success) {
      result.error.issues.forEach(issue => {
        errors.push(`${issue.path.join(".")}: ${issue.message}`);
      });
      return { ok: false, errors, warnings, correctionContext, missingFields };
    }

    const d = result.data;

    // PROFESSIONAL VALIDATION
    const professionalValidation = validateProfessionalNibrs(d);
    errors.push(...professionalValidation.errors);
    warnings.push(...professionalValidation.warnings);
    correctionContext.professionalSuggestions = professionalValidation.correctionSuggestions;
    if (professionalValidation.missingFields) {
      missingFields.push(...professionalValidation.missingFields);
    }

    // 1. Validate offense codes
    if (d.offenses) {
      for (const offense of d.offenses) {
        if (offense.code && !isValidOffenseCode(offense.code)) {
          warnings.push(`Offense code ${offense.code} may not be standard NIBRS`);
        }
      }
    }

    // 2. Validate location code - NOW AT SEGMENT LEVEL
    if (d.locationCode && !isValidLocationCode(d.locationCode)) {
      warnings.push(`Location code ${d.locationCode} may not be standard NIBRS`);
    }

    // 3. MULTI-OFFENSE VICTIM ANALYSIS (CRITICAL FIX)
    if (d.offenses) {
      const victimRequirements = analyzeMultiOffenseVictimRequirements(d.offenses);
      
      // Check for missing society victims
      if (victimRequirements.needsSocietyVictim) {
        const hasSocietyVictim = d.victims && d.victims.some((v: any) => v.type === 'S');
        if (!hasSocietyVictim) {
          errors.push("Drug/weapon offenses require a Society/Public victim (Type S)");
          victimRequirements.societyOffenses.forEach(offenseCode => {
            correctionContext.missingVictims.push({
              type: 'society',
              offenseCode: offenseCode,
              offenseDescription: Object.entries(NIBRS_OFFENSE_CODES).find(([k, v]) => v === offenseCode)?.[0] || offenseCode
            });
          });
        }
      }

      // Check for missing individual victims
      if (victimRequirements.needsIndividualVictims) {
        const hasIndividualVictims = d.victims && d.victims.some((v: any) => v.type === 'I' || v.type === 'B');
        if (!hasIndividualVictims) {
          errors.push("Non-victimless offenses require individual or business victims");
          victimRequirements.individualOffenses.forEach(offenseCode => {
            correctionContext.missingVictims.push({
              type: 'individual',
              offenseCode: offenseCode,
              offenseDescription: Object.entries(NIBRS_OFFENSE_CODES).find(([k, v]) => v === offenseCode)?.[0] || offenseCode
            });
          });
        }
      }
    }

    // 4. Property validation with enhanced context
    if (d.properties && Array.isArray(d.properties)) {
      d.properties.forEach((prop: any, index: number) => {
        if (!prop.descriptionCode || prop.descriptionCode === '34') {
          warnings.push(`Property "${prop.description}" needs better classification`);
          correctionContext.ambiguousProperties.push({
            description: prop.description,
            suggestedCodes: getPropertySuggestions(prop.description),
            relatedOffense: determineRelatedOffense(prop.description, d.offenses || [])
          });
        }
        
        // Validate drug properties
        if (prop.descriptionCode === "10" && !prop.seized) {
          warnings.push("Drug properties should be marked as seized");
        }
        if (prop.descriptionCode === "10" && prop.value === undefined) {
          warnings.push("Drug properties should include estimated value");
        }
        
        // Validate loss type codes
        if (prop.lossType && !['1','2','3','4','5','6','7','8','9'].includes(prop.lossType)) {
          errors.push(`Invalid loss type code: ${prop.lossType}`);
        }
      });
    }

    // 5. Data quality checks
    if (d.victims) {
      for (const victim of d.victims) {
        if (victim.age !== undefined && (victim.age < 0 || victim.age > 130)) {
          warnings.push("Victim age appears to be outside valid range (0-130)");
        }
      }
    }

    if (d.offenders) {
      for (const offender of d.offenders) {
        if (offender.age !== undefined && (offender.age < 0 || offender.age > 130)) {
          warnings.push("Offender age appears to be outside valid range (0-130)");
        }
      }
    }

    // 6. Temporal validation
    if (d.administrative?.incidentDate && isNaN(Date.parse(d.administrative.incidentDate))) {
      errors.push("Invalid incident date format");
    }

    if (d.administrative?.exceptionalClearanceDate && isNaN(Date.parse(d.administrative.exceptionalClearanceDate))) {
      errors.push("Invalid exceptional clearance date format");
    }

    if (d.administrative?.clearedExceptionally === "Y" && !d.administrative.exceptionalClearanceDate) {
      warnings.push("Exceptional clearance date is recommended when clearedExceptionally is 'Y'");
    }

    // 7. Multi-offense consistency checks
    if (d.offenses && d.offenses.length > 1) {
      const multiOffenseWarnings = checkMultiOffenseConsistency(d);
      warnings.push(...multiOffenseWarnings);
      correctionContext.multiOffenseIssues = multiOffenseWarnings;
    }

    if (errors.length > 0) {
      return { ok: false, errors, warnings, correctionContext };
    }

    return {
      ok: errors.length === 0,
      data: d,
      errors,
      warnings,
      correctionContext,
      missingFields
    };

  } catch (error) {
    console.error("Validation error:", error);
    return { 
      ok: false, 
      errors: ["Internal validation error"], 
      warnings: [],
      correctionContext,
      missingFields: []
    };
  }
}

// NEW: Multi-offense victim requirement analysis
function analyzeMultiOffenseVictimRequirements(offenses: any[]): {
  needsSocietyVictim: boolean;
  needsIndividualVictims: boolean;
  societyOffenses: string[];
  individualOffenses: string[];
} {
  const societyOffenses: string[] = [];
  const individualOffenses: string[] = [];
  
  offenses.forEach(offense => {
    if (NibrsMapper.isVictimlessOffense(offense.code)) {
      societyOffenses.push(offense.code);
    } else {
      individualOffenses.push(offense.code);
    }
  });
  
  return {
    needsSocietyVictim: societyOffenses.length > 0,
    needsIndividualVictims: individualOffenses.length > 0,
    societyOffenses,
    individualOffenses
  };
}

// NEW: Property suggestion helper
function getPropertySuggestions(description: string): Array<{code: string, description: string}> {
  const descLower = description.toLowerCase();
  const suggestions: Array<{code: string, description: string}> = [];
  
  if (descLower.includes('cocaine') || descLower.includes('drug') || descLower.includes('narcotic') || descLower.includes('meth')) {
    suggestions.push({code: '10', description: 'Drugs/Narcotics'});
  }
  if (descLower.includes('vehicle') || descLower.includes('car') || descLower.includes('auto')) {
    suggestions.push({code: '08', description: 'Motor Vehicle'});
  }
  if (descLower.includes('phone') || descLower.includes('electronic') || descLower.includes('laptop')) {
    suggestions.push({code: '14', description: 'Electronics'});
  }
  if (descLower.includes('cash') || descLower.includes('money') || descLower.includes('currency')) {
    suggestions.push({code: '01', description: 'Currency'});
  }
  if (descLower.includes('jewelry') || descLower.includes('watch') || descLower.includes('ring')) {
    suggestions.push({code: '02', description: 'Jewelry/Precious Metals'});
  }
  if (descLower.includes('firearm') || descLower.includes('gun') || descLower.includes('weapon')) {
    suggestions.push({code: '11', description: 'Firearms'});
  }
  if (descLower.includes('scale') || descLower.includes('baggie') || descLower.includes('paraphernalia')) {
    suggestions.push({code: '34', description: 'Other Property/Drug Paraphernalia'});
  }
  
  return suggestions.length > 0 ? suggestions : [{code: '34', description: 'Other Property'}];
}

// NEW: Determine which offense a property relates to
function determineRelatedOffense(propertyDesc: string, offenses: any[]): string {
  const descLower = propertyDesc.toLowerCase();
  
  if (descLower.includes('drug') || descLower.includes('cocaine') || descLower.includes('narcotic') || descLower.includes('meth')) {
    return offenses.find(off => off.code === '35A' || off.code === '35B')?.code || '';
  }
  if (descLower.includes('vehicle') || descLower.includes('car') || descLower.includes('auto')) {
    return offenses.find(off => off.code === '64A' || off.code === '240')?.code || '';
  }
  if (descLower.includes('damage') || descLower.includes('broken') || descLower.includes('vandal')) {
    return offenses.find(off => off.code === '290')?.code || '';
  }
  if (descLower.includes('firearm') || descLower.includes('gun') || descLower.includes('weapon')) {
    return offenses.find(off => off.code === '520')?.code || '';
  }
  
  return offenses[0]?.code || '';
}

// NEW: Multi-offense consistency checker
function checkMultiOffenseConsistency(data: any): string[] {
  const warnings: string[] = [];
  const { offenses, victims } = data;
  
  if (!offenses || !victims) return warnings;
  
  // Check if victim types match offense types
  const hasSocietyVictim = victims.some((v: any) => v.type === 'S');
  const hasIndividualVictim = victims.some((v: any) => v.type === 'I' || v.type === 'B');
  
  const hasVictimlessOffense = offenses.some((off: any) => NibrsMapper.isVictimlessOffense(off.code));
  const hasVictimOffense = offenses.some((off: any) => !NibrsMapper.isVictimlessOffense(off.code));
  
  if (hasVictimlessOffense && !hasSocietyVictim) {
    warnings.push("Victimless offenses detected but no Society/Public victim found");
  }
  if (hasVictimOffense && !hasIndividualVictim) {
    warnings.push("Victim-based offenses detected but no individual victims found");
  }
  
  return warnings;
}