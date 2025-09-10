import { NibrsExtractSchema } from "./schema";
import { 
  NIBRS_OFFENSE_CODES,
  NIBRS_LOCATION_CODES,
  NIBRS_WEAPON_CODES,
  NIBRS_RELATIONSHIP_CODES,
  NIBRS_PROPERTY_CODES
} from "./codes";
import { NIBRS_TEMPLATES } from "./templates";

export function validateNibrsPayload(raw: unknown): {
  ok: boolean;
  data?: any;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Basic schema validation
    const result = NibrsExtractSchema.safeParse(raw);
    if (!result.success) {
      result.error.issues.forEach(issue => {
        errors.push(`${issue.path.join(".")}: ${issue.message}`);
      });
      return { ok: false, errors, warnings };
    }

    const d = result.data;
    const template = NIBRS_TEMPLATES[d.offenseCode] || NIBRS_TEMPLATES.default;

    // 1. Validate offense code
    if (!Object.values(NIBRS_OFFENSE_CODES).includes(d.offenseCode)) {
      warnings.push(`Offense code ${d.offenseCode} may not be standard NIBRS`);
    }

    // 2. Validate location code
    if (!Object.values(NIBRS_LOCATION_CODES).includes(d.locationCode)) {
      warnings.push(`Location code ${d.locationCode} may not be standard NIBRS`);
    }

    // 3. Template-based validation with graceful degradation
    if (template) {
      // Victim validation - only if victim data exists
      if (d.victim) {
        template.requiredVictim.forEach((f: keyof typeof d.victim) => {
          if (d.victim && (d.victim[f] === undefined || d.victim[f] === null || d.victim[f] === "")) {
            warnings.push(`Victim ${f} is recommended for offense ${d.offenseCode}`);
          }
        });
      }

      // Offender validation - only if offender data exists
      if (d.victim) {
  template.requiredVictim.forEach((f) => {
    const key = f as keyof typeof d.victim; // cast to correct type
    if (d.victim && (d.victim[key] === undefined || d.victim[key] === null || d.victim[key] === "")) {
      warnings.push(`Victim ${key} is recommended for offense ${d.offenseCode}`);
    }
  });
}


      // Property validation
      if (template.requiredProperty && !d.property) {
        warnings.push(`Property information is recommended for offense ${d.offenseCode}`);
      }
    }

    // 4. Data quality checks
    if (d.victim?.age !== undefined && (d.victim.age < 0 || d.victim.age > 130)) {
      warnings.push("Victim age appears to be outside valid range (0-130)");
    }

    if (d.offender?.age !== undefined && (d.offender.age < 0 || d.offender.age > 130)) {
      warnings.push("Offender age appears to be outside valid range (0-130)");
    }

    if (d.property?.value !== undefined && d.property.value < 0) {
      warnings.push("Property value cannot be negative");
    }

    // 5. Temporal validation
    if (d.incidentDate && isNaN(Date.parse(d.incidentDate))) {
      errors.push("Invalid incident date format");
    }

    if (d.exceptionalClearanceDate && isNaN(Date.parse(d.exceptionalClearanceDate))) {
      errors.push("Invalid exceptional clearance date format");
    }

    if (d.clearedExceptionally === "Y" && !d.exceptionalClearanceDate) {
      warnings.push("Exceptional clearance date is recommended when clearedExceptionally is 'Y'");
    }

    if (errors.length > 0) {
      return { ok: false, errors, warnings };
    }

    return { ok: true, data: d, errors: [], warnings };

  } catch (error) {
    console.error("Validation error:", error);
    return { 
      ok: false, 
      errors: ["Internal validation error"], 
      warnings: [] 
    };
  }
}