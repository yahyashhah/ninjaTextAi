// validator.ts - COMPLETELY REVISED
import { NibrsExtractSchema } from "./schema";
import { 
  NIBRS_OFFENSE_CODES,
  NIBRS_LOCATION_CODES,
  NIBRS_WEAPON_CODES,
  NIBRS_RELATIONSHIP_CODES,
  NIBRS_PROPERTY_CODES
} from "./codes";
import { NIBRS_TEMPLATES } from "./templates";
import { NibrsMapper } from "./mapper";

export function validateNibrsPayload(raw: unknown): {
  ok: boolean;
  data?: any;
  errors: string[];
  warnings: string[];
  correctionContext?: any;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const correctionContext: any = {
    missingVictims: [],
    ambiguousProperties: [],
    requiredFields: [],
    multiOffenseIssues: []
  };

  try {
    // Basic schema validation
    const result = NibrsExtractSchema.safeParse(raw);
    if (!result.success) {
      result.error.issues.forEach(issue => {
        errors.push(`${issue.path.join(".")}: ${issue.message}`);
      });
      return { ok: false, errors, warnings, correctionContext };
    }

    const d = result.data;

    // 1. Validate offense codes
    for (const offense of d.offenses) {
      if (offense.code && !Object.values(NIBRS_OFFENSE_CODES).includes(offense.code)) {
        warnings.push(`Offense code ${offense.code} may not be standard NIBRS`);
      }
    }

    // 2. Validate location code
    if (!Object.values(NIBRS_LOCATION_CODES).includes(d.locationCode)) {
      warnings.push(`Location code ${d.locationCode} may not be standard NIBRS`);
    }

    // 3. MULTI-OFFENSE VICTIM ANALYSIS (CRITICAL FIX)
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

    // 4. Property validation with enhanced context
    if (d.properties && Array.isArray(d.properties)) {
      d.properties.forEach((prop: any, index: number) => {
        if (!prop.descriptionCode || prop.descriptionCode === '34') {
          warnings.push(`Property "${prop.description}" needs better classification`);
          correctionContext.ambiguousProperties.push({
            description: prop.description,
            suggestedCodes: getPropertySuggestions(prop.description),
            relatedOffense: determineRelatedOffense(prop.description, d.offenses)
          });
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
    if (d.incidentDate && isNaN(Date.parse(d.incidentDate))) {
      errors.push("Invalid incident date format");
    }

    if (d.exceptionalClearanceDate && isNaN(Date.parse(d.exceptionalClearanceDate))) {
      errors.push("Invalid exceptional clearance date format");
    }

    if (d.clearedExceptionally === "Y" && !d.exceptionalClearanceDate) {
      warnings.push("Exceptional clearance date is recommended when clearedExceptionally is 'Y'");
    }

    // 7. Multi-offense consistency checks
    if (d.offenses.length > 1) {
      const multiOffenseWarnings = checkMultiOffenseConsistency(d);
      warnings.push(...multiOffenseWarnings);
      correctionContext.multiOffenseIssues = multiOffenseWarnings;
    }

    if (errors.length > 0) {
      return { ok: false, errors, warnings, correctionContext };
    }

    return { ok: true, data: d, errors: [], warnings, correctionContext };

  } catch (error) {
    console.error("Validation error:", error);
    return { 
      ok: false, 
      errors: ["Internal validation error"], 
      warnings: [],
      correctionContext 
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
  
  if (descLower.includes('cocaine') || descLower.includes('drug') || descLower.includes('narcotic')) {
    suggestions.push({code: '23', description: 'Drugs/Narcotics'});
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
  
  return suggestions.length > 0 ? suggestions : [{code: '34', description: 'Other Property'}];
}

// NEW: Determine which offense a property relates to
function determineRelatedOffense(propertyDesc: string, offenses: any[]): string {
  const descLower = propertyDesc.toLowerCase();
  
  if (descLower.includes('drug') || descLower.includes('cocaine') || descLower.includes('narcotic')) {
    return offenses.find(off => off.code === '35A' || off.code === '35B')?.code || '';
  }
  if (descLower.includes('vehicle') || descLower.includes('car') || descLower.includes('auto')) {
    return offenses.find(off => off.code === '64A' || off.code === '240')?.code || '';
  }
  if (descLower.includes('damage') || descLower.includes('broken') || descLower.includes('vandal')) {
    return offenses.find(off => off.code === '290')?.code || '';
  }
  
  return offenses[0]?.code || '';
}

// NEW: Multi-offense consistency checker
function checkMultiOffenseConsistency(data: any): string[] {
  const warnings: string[] = [];
  const { offenses, victims, properties } = data;
  
  // Check if victim types match offense types
  if (victims && victims.length > 0) {
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
  }
  
  return warnings;
}