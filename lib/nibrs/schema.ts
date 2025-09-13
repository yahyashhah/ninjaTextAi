import { z } from "zod";

export const VictimSchema = z.object({
  type: z.enum(["I","B","F","G","L","O","P","R","S","U"]).default("I").optional(),
  age: z.number().int().min(0).max(130).optional(),
  sex: z.enum(["M","F","U"]).optional(),
  race: z.enum(["W","B","I","A","P","U"]).optional(),
  ethnicity: z.enum(["H","N","U"]).optional(),
  injury: z.string().optional(),
});

export const OffenderSchema = z.object({
  age: z.number().int().min(0).max(130).optional(),
  sex: z.enum(["M","F","U"]).optional(),
  race: z.enum(["W","B","I","A","P","U"]).optional(),
  ethnicity: z.enum(["H","N","U"]).optional(),
  relationshipToVictim: z.string().optional(),
});

export const PropertySchema = z.object({
  lossType: z.enum(["1","2","3","4","5","6","7","8","9"]).optional(),
  descriptionCode: z.string().optional(),
  value: z.number().int().min(0).optional(),
  description: z.string().optional(),
});

export const OffenseSchema = z.object({
  code: z.string().regex(/^[0-9]{2,3}[A-Z]?$|^[0-9]{2,3}$/).optional(), // allow 2-3 digits optionally ending with letter OR allow numeric codes
  description: z.string().optional(),
  attemptedCompleted: z.enum(["A","C"]).default("C"),
});

export const ArresteeSchema = z.object({
  sequenceNumber: z.number().int().min(1), // Unique ID for each arrestee
  arrestDate: z.string(), // YYYY-MM-DD
  arrestTime: z.string().optional(), // HH:mm
  arrestType: z.enum(["O", "S", "T"]), // On-view, Summoned, Taken into custody
  age: z.number().int().min(0).max(130).optional(),
  sex: z.enum(["M", "F", "U"]).optional(),
  race: z.enum(["W", "B", "I", "A", "P", "U"]).optional(),
  ethnicity: z.enum(["H", "N", "U"]).optional(),
  residentCode: z.enum(["R", "N", "U"]).optional(), // Resident, Non-resident, Unknown
  clearanceCode: z.string().optional(), // How the case was cleared
});

export const NibrsExtractSchema = z.object({
  incidentNumber: z.string().min(1),
  incidentDate: z.string().min(1),
  incidentTime: z.string().optional(),
  clearedExceptionally: z.enum(["Y","N"]).default("N"),
  exceptionalClearanceDate: z.string().optional(),

  // Changed from single values to arrays
  offenses: z.array(OffenseSchema).min(1),
  locationCode: z.string().min(1),
  weaponCodes: z.array(z.string()).optional(),

  biasMotivationCode: z.string().optional(),

  // Multiple victims, offenders, properties
  victims: z.array(VictimSchema).optional(),
  offenders: z.array(OffenderSchema).optional(),
  properties: z.array(PropertySchema).optional(),
  arrestees: z.array(ArresteeSchema).optional(),
  
  clearedBy: z.string().optional(),
  narrative: z.string().min(1),
});

export type NibrsExtract = z.infer<typeof NibrsExtractSchema>;