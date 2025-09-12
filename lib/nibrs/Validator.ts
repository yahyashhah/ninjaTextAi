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

    // 1. Validate offense codes
    for (const offense of d.offenses) {
      if (!Object.values(NIBRS_OFFENSE_CODES).includes(offense.code)) {
        warnings.push(`Offense code ${offense.code} may not be standard NIBRS`);
      }
    }

    // 2. Validate location code
    if (!Object.values(NIBRS_LOCATION_CODES).includes(d.locationCode)) {
      warnings.push(`Location code ${d.locationCode} may not be standard NIBRS`);
    }

    // 3. Template-based validation with graceful degradation
    // Use the first offense for template validation
    const primaryOffenseCode = d.offenses.length > 0 ? d.offenses[0].code : undefined;
    const template = primaryOffenseCode ? 
      NIBRS_TEMPLATES[primaryOffenseCode] || NIBRS_TEMPLATES.default : 
      NIBRS_TEMPLATES.default;

    // Check if any offense is victimless
    const hasVictimlessOffense = d.offenses.some(offense => 
      NibrsMapper.isVictimlessOffense(offense.code)
    );

    // Victim validation - only if victim data exists and not victimless crime
    if (d.victims && d.victims.length > 0 && !hasVictimlessOffense) {
      template.requiredVictim.forEach((f) => {
        for (const victim of d.victims || []) {
          const key = f as keyof typeof victim;
          if (victim[key] === undefined || victim[key] === null || victim[key] === "") {
            warnings.push(`Victim ${key} is recommended for offense ${primaryOffenseCode}`);
          }
        }
      });
    }

    // Offender validation - only if offender data exists
    if (d.offenders && d.offenders.length > 0) {
      template.requiredOffender.forEach((f) => {
        for (const offender of d.offenders || []) {
          const key = f as keyof typeof offender;
          if (offender[key] === undefined || offender[key] === null || offender[key] === "") {
            warnings.push(`Offender ${key} is recommended for offense ${primaryOffenseCode}`);
          }
        }
      });
    }

    // Property validation
    if (template.requiredProperty && (!d.properties || d.properties.length === 0)) {
      warnings.push(`Property information is recommended for offense ${primaryOffenseCode}`);
    }

    // 4. Data quality checks
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

    if (d.properties) {
      for (const property of d.properties) {
        if (property.value !== undefined && property.value < 0) {
          warnings.push("Property value cannot be negative");
        }
      }
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