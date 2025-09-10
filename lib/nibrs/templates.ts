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
    requiredEvidence: true,
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
  
  const template = NIBRS_TEMPLATES[nibrs.offenseCode] || NIBRS_TEMPLATES.default;
  const isVictimless = template.isVictimless || NibrsMapper.isVictimlessOffense(nibrs.offenseCode);
  
  if (!isVictimless) {
    if (template.requiredVictim.length && nibrs.victim) {
      template.requiredVictim.forEach(f => {
        if (nibrs.victim[f] === undefined || nibrs.victim[f] === null || nibrs.victim[f] === "") {
          errors.push(`Victim ${f} is required for offense ${nibrs.offenseCode}.`);
        }
      });
    }

    if (template.requiredOffender.length && nibrs.offender) {
      template.requiredOffender.forEach(f => {
        if (nibrs.offender[f] === undefined || nibrs.offender[f] === null || nibrs.offender[f] === "") {
          errors.push(`Offender ${f} is required for offense ${nibrs.offenseCode}.`);
        }
      });
    }
  }

  // Property checks
  if (template.requiredProperty) {
    const hasProperty = nibrs.property && 
                       (nibrs.property.value > 0 || nibrs.property.descriptionCode);
    const hasProperties = nibrs.properties && nibrs.properties.length > 0;
    const hasEvidence = nibrs.evidence;
    
    if (!hasProperty && !hasProperties && !hasEvidence) {
      errors.push("Property information is required for this offense.");
    }
  }

  // Evidence checks
  if (template.requiredEvidence && !nibrs.evidence) {
    errors.push("Evidence information is required for this offense.");
  }

  return errors;
}