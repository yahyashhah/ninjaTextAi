import type { z } from "zod";
import type { VictimSchema, OffenderSchema } from "./schema";
import { NibrsMapper } from "./mapper";

export const NIBRS_TEMPLATES: Record<string, { 
  requiredVictim: (keyof z.infer<typeof VictimSchema>)[]; 
  requiredOffender: (keyof z.infer<typeof OffenderSchema>)[]; 
  requiredProperty: boolean;
  requiredEvidence: boolean;
  isVictimless: boolean;
}> = {
  // Aggravated Assault
  "13A": {
    requiredVictim: ["type", "sex"],
    requiredOffender: ["sex"],
    requiredProperty: false,
    requiredEvidence: false,
    isVictimless: false
  },
  // Simple Assault
  "13B": {
    requiredVictim: ["type", "sex"],
    requiredOffender: ["sex"],
    requiredProperty: false,
    requiredEvidence: false,
    isVictimless: false
  },
  // Shoplifting
  "23F": {
    requiredVictim: ["type"],
    requiredOffender: [],
    requiredProperty: true,
    requiredEvidence: false,
    isVictimless: false
  },
  // Auto Theft
  "240": {
    requiredVictim: ["type"],
    requiredOffender: [],
    requiredProperty: true,
    requiredEvidence: false,
    isVictimless: false
  },
  // Fraud
  "26A": {
    requiredVictim: ["type"],
    requiredOffender: [],
    requiredProperty: true,
    requiredEvidence: false,
    isVictimless: false
  },
  // Hacking
  "26C": {
    requiredVictim: ["type"],
    requiredOffender: [],
    requiredProperty: true,
    requiredEvidence: false,
    isVictimless: false
  },
  // Burglary
  "220": {
    requiredVictim: ["type"],
    requiredOffender: [],
    requiredProperty: true,
    requiredEvidence: false,
    isVictimless: false
  },
  // Vandalism
  "290": {
    requiredVictim: ["type"],
    requiredOffender: [],
    requiredProperty: true,
    requiredEvidence: false,
    isVictimless: false
  },
  // Drug sale
  "35B": {
    requiredVictim: [],
    requiredOffender: ["sex", "race"],
    requiredProperty: false,
    requiredEvidence: true,
    isVictimless: true
  },
  // Drug possession
  "35A": {
    requiredVictim: [],
    requiredOffender: ["sex", "race"],
    requiredProperty: false,
    requiredEvidence: false,
    isVictimless: true
  },
  // Weapon violation
  "520": {
    requiredVictim: [],
    requiredOffender: ["sex", "age"],
    requiredProperty: false,
    requiredEvidence: true,
    isVictimless: true
  },
  // Public intoxication
  "90C": {
    requiredVictim: [],
    requiredOffender: ["sex", "age"],
    requiredProperty: false,
    requiredEvidence: false,
    isVictimless: true
  },
  "64A": {
    requiredVictim: ["type", "injury"],
    requiredOffender: [],
    requiredProperty: true, // For vehicle damage
    requiredEvidence: false,
    isVictimless: false // This is CRITICAL - traffic collisions are NOT victimless
  },
  // Default template
  "default": {
    requiredVictim: [],
    requiredOffender: [],
    requiredProperty: false,
    requiredEvidence: false,
    isVictimless: false
  }
};

export function validateWithTemplate(nibrs: any): string[] {
  const errors: string[] = [];
  
  // Use the first offense for template validation
  const primaryOffenseCode = nibrs.offenses && nibrs.offenses.length > 0 
    ? nibrs.offenses[0].code 
    : undefined;
  
  const template = primaryOffenseCode ? 
    NIBRS_TEMPLATES[primaryOffenseCode] || NIBRS_TEMPLATES.default : 
    NIBRS_TEMPLATES.default;
  
  // Check if any offense is victimless
  const hasVictimlessOffense = nibrs.offenses && nibrs.offenses.some((offense: any) => 
    NibrsMapper.isVictimlessOffense(offense.code)
  );
  
  if (!hasVictimlessOffense) {
    if (template.requiredVictim.length && nibrs.victims) {
      for (const victim of nibrs.victims) {
        template.requiredVictim.forEach(f => {
          if (victim[f] === undefined || victim[f] === null || victim[f] === "") {
            errors.push(`Victim ${f} is required for offense ${primaryOffenseCode}.`);
          }
        });
      }
    }

    if (template.requiredOffender.length && nibrs.offenders) {
      for (const offender of nibrs.offenders) {
        template.requiredOffender.forEach(f => {
          if (offender[f] === undefined || offender[f] === null || offender[f] === "") {
            errors.push(`Offender ${f} is required for offense ${primaryOffenseCode}.`);
          }
        });
      }
    }
  }

  // Property checks
  if (template.requiredProperty) {
    const hasProperty = nibrs.properties && nibrs.properties.length > 0;
    const hasEvidence = nibrs.evidence;
    
    if (!hasProperty && !hasEvidence) {
      errors.push("Property information is required for this offense.");
    }
  }

  // Evidence checks
  if (template.requiredEvidence && !nibrs.evidence) {
    errors.push("Evidence information is required for this offense.");
  }

  return errors;
}