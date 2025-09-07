import { z } from "zod";

export const VictimSchema = z.object({
  type: z.enum(["I","B","F","G","L","O","P","R","S","U"]).default("I").optional(), // I=Individual etc.
  age: z.number().int().min(0).max(130).optional(),
  sex: z.enum(["M","F","U"]).optional(),
  race: z.enum(["W","B","I","A","P","U"]).optional(),
  ethnicity: z.enum(["H","N","U"]).optional(), // Hispanic, Non-Hispanic, Unknown
  injury: z.string().optional(), // NIBRS injury code if known
});

export const OffenderSchema = z.object({
  age: z.number().int().min(0).max(130).optional(),
  sex: z.enum(["M","F","U"]).optional(),
  race: z.enum(["W","B","I","A","P","U"]).optional(),
  ethnicity: z.enum(["H","N","U"]).optional(),
  relationshipToVictim: z.string().optional(), // will hold NIBRS relationship code
});

export const PropertySchema = z.object({
  lossType: z.enum(["1","2","3","4","5","6","7","8","9"]).optional(), // NIBRS loss type codes
  descriptionCode: z.string().optional(),
  value: z.number().int().min(0).optional(),
});

export const NibrsExtractSchema = z.object({
  incidentNumber: z.string().min(1),
  incidentDate: z.string().min(1), // YYYY-MM-DD
  incidentTime: z.string().optional(), // HH:mm or HH:mm:ss
  clearedExceptionally: z.enum(["Y","N"]).default("N"),
  exceptionalClearanceDate: z.string().optional(),

  offenseCode: z.string().min(3),            // e.g. 13A
  offenseAttemptedCompleted: z.enum(["A","C"]).default("C"),
  locationCode: z.string().min(1),
  weaponCode: z.string().optional(),

  biasMotivationCode: z.string().optional(),

  victim: VictimSchema.optional(),
  offender: OffenderSchema.optional(),
  property: PropertySchema.optional(),

  narrative: z.string().min(1),
});

export type NibrsExtract = z.infer<typeof NibrsExtractSchema>;