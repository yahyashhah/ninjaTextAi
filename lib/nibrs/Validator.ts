import { NibrsExtract, NibrsExtractSchema } from "./schema";

export function validateNibrsPayload(raw: unknown): {
  ok: boolean;
  data?: NibrsExtract;
  errors?: string[];
} {
  const result = NibrsExtractSchema.safeParse(raw);
  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`);
    return { ok: false, errors };
  }
  const d = result.data;

  // Logical checks
  const errs: string[] = [];
  if (d.offenseCode && !/^[0-9A-Z]{3}$/.test(d.offenseCode)) {
    errs.push("offenseCode must be a 3-character NIBRS code (e.g., 13A).");
  }
  if (d.locationCode && !/^[0-9]{2}$/.test(d.locationCode)) {
    errs.push("locationCode should be a known two-digit NIBRS location code.");
  }
  if (errs.length) return { ok: false, errors: errs };

  return { ok: true, data: d };
}