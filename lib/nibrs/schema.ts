import { z } from "zod";

// Enhanced with all required NIBRS fields
export const VictimSchema = z.object({
  type: z.enum(["I","B","F","G","L","O","P","R","S","U"]).default("I"),
  age: z.number().int().min(0).max(130).optional(),
  sex: z.enum(["M","F","U"]).default("U"),
  race: z.enum(["W","B","I","A","P","U"]).default("U"),
  ethnicity: z.enum(["H","N","U"]).default("U"),
  injury: z.string().optional(),
  // NIBRS REQUIRED: Victim sequence number for multiple victims
  sequenceNumber: z.number().int().min(1).default(1)
});

export const OffenderSchema = z.object({
  age: z.number().int().min(0).max(130).optional(),
  sex: z.enum(["M","F","U"]).default("U"),
  race: z.enum(["W","B","I","A","P","U"]).default("U"),
  ethnicity: z.enum(["H","N","U"]).default("U"),
  relationshipToVictim: z.string().optional(),
  // NIBRS REQUIRED: Offender sequence number
  sequenceNumber: z.number().int().min(1).default(1)
});

export const PropertySchema = z.object({
  lossType: z.enum(["1","2","3","4","5","6","7","8","9"]).default("7"),
  descriptionCode: z.string(),
  value: z.number().int().min(0).optional(),
  description: z.string(),
  // NIBRS REQUIRED: Property sequence number and drug-specific fields
  sequenceNumber: z.number().int().min(1).default(1),
  drugMeasurement: z.string().optional(),
  drugQuantity: z.number().optional(),
  seized: z.boolean().default(false)
});

export const OffenseSchema = z.object({
  code: z.string().regex(/^[0-9]{2,3}[A-Z]?$/),
  description: z.string().optional(),
  attemptedCompleted: z.enum(["A","C"]).default("C"),
  // NIBRS REQUIRED: Offense sequence number
  sequenceNumber: z.number().int().min(1).default(1)
});

export const ArresteeSchema = z.object({
  sequenceNumber: z.number().int().min(1),
  arrestDate: z.string(),
  arrestTime: z.string().optional(),
  arrestType: z.enum(["O", "S", "T"]),
  age: z.number().int().min(0).max(130).optional(),
  sex: z.enum(["M", "F", "U"]).default("U"),
  race: z.enum(["W", "B", "I", "A", "P", "U"]).default("U"),
  ethnicity: z.enum(["H", "N", "U"]).default("U"),
  residentCode: z.enum(["R", "N", "U"]).default("U"),
  clearanceCode: z.string().optional(),
  // NIBRS REQUIRED: Multiple offense codes per arrestee
  offenseCodes: z.array(z.string()).min(1)
});

// NEW: Proper NIBRS segment structure
export const NibrsSegmentsSchema = z.object({
  administrative: z.object({
    incidentNumber: z.string().min(1),
    incidentDate: z.string().min(1),
    incidentTime: z.string().optional(),
    clearedExceptionally: z.enum(["Y","N"]).default("N"),
    exceptionalClearanceDate: z.string().optional(),
    reportingAgency: z.string().optional(),
    clearedBy: z.string().optional()
  }),
  
  // ADDED: Location code at the segment level
  locationCode: z.string().min(1),
  
  offenses: z.array(OffenseSchema).min(1),
  
  properties: z.array(PropertySchema).optional(),
  
  victims: z.array(VictimSchema).optional(),
  
  offenders: z.array(OffenderSchema).optional(),
  
  arrestees: z.array(ArresteeSchema).optional(),
  
  narrative: z.string().min(1)
});

export type NibrsSegments = z.infer<typeof NibrsSegmentsSchema>;
export type NibrsExtract = z.infer<typeof NibrsSegmentsSchema>;