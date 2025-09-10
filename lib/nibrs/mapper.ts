import {
  NIBRS_OFFENSE_CODES,
  NIBRS_LOCATION_CODES,
  NIBRS_WEAPON_CODES,
  NIBRS_RELATIONSHIP_CODES,
  NIBRS_PROPERTY_CODES
} from "./codes";

export interface DescriptiveExtract {
  incidentNumber?: string;
  incidentDate?: string;
  incidentTime?: string;
  clearedExceptionally?: "Y" | "N";
  exceptionalClearanceDate?: string;
  offenseDescription?: string;
  offenseAttemptedCompleted?: "A" | "C";
  locationDescription?: string;
  weaponDescription?: string;
  biasMotivation?: string;
  victim?: {
    type?: string;
    age?: number;
    sex?: "M" | "F" | "U";
    race?: string;
    ethnicity?: string;
    injury?: string;
  };
  offender?: {
    age?: number;
    sex?: "M" | "F" | "U";
    race?: string;
    ethnicity?: string;
    relationshipDescription?: string;
  };
  property?: {
    lossDescription?: string;
    propertyDescription?: string;
    value?: number;
  };
  narrative?: string;
}

interface MappingResult {
  code: string;
  confidence: number;
  originalInput?: string;
}

export class NibrsMapper {
  private static readonly DEFAULT_VALUES = {
    INCIDENT_NUMBER_PREFIX: "INC-",
    DEFAULT_VICTIM_TYPE: "I",
    DEFAULT_RACE: "U",
    DEFAULT_SEX: "U",
    DEFAULT_ETHNICITY: "U",
    DEFAULT_OFFENSE_ATTEMPTED: "C",
    DEFAULT_CLEARED: "N"
  };

  private static readonly VICTIMLESS_OFFENSE_CODES = new Set([
    '35A', '35B', '35C', '35D', // Drug offenses
    '90A', '90B', '90C', '90D', '90E', '90F', '90G', // Gambling
    '100', // Pornography
    '520', // Weapon law violations
    '90C', // Drunkenness
    '90D', // Disorderly conduct
  ]);

  private static readonly CLEARED_BY_ARREST_KEYWORDS = [
    'arrested', 'booked', 'taken into custody', 'placed under arrest',
    'custody', 'charged', 'cited'
  ];

  static isVictimlessOffense(offenseCode: string): boolean {
    return this.VICTIMLESS_OFFENSE_CODES.has(offenseCode);
  }

  static wasClearedByArrest(narrative: string): boolean {
    const lowerNarrative = narrative.toLowerCase();
    return this.CLEARED_BY_ARREST_KEYWORDS.some(keyword => 
      lowerNarrative.includes(keyword.toLowerCase())
    );
  }

  private static similarity(a: string, b: string): number {
    if (!a || !b) return 0;
    
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    if (aLower === bLower) return 1.0;
    
    if (aLower.includes(bLower) || bLower.includes(aLower)) {
      return 0.8;
    }
    
    const aWords = new Set(aLower.split(/\s+/));
    const bWords = new Set(bLower.split(/\s+/));
    const intersection = Array.from(aWords).filter(word => bWords.has(word)).length;
    const union = new Set(Array.from(aWords).concat(Array.from(bWords))).size;
    
    if (union > 0) {
      return intersection / union;
    }
    
    return 0;
  }

  static addMissingRequiredFields(mappedData: any, narrative?: string): any {
    const cloned = JSON.parse(JSON.stringify(mappedData));
    
    cloned.incidentNumber = cloned.incidentNumber || 
      `${this.DEFAULT_VALUES.INCIDENT_NUMBER_PREFIX}${Date.now()}`;
    cloned.offenseAttemptedCompleted = cloned.offenseAttemptedCompleted || 
      this.DEFAULT_VALUES.DEFAULT_OFFENSE_ATTEMPTED;
    cloned.clearedExceptionally = cloned.clearedExceptionally || 
      this.DEFAULT_VALUES.DEFAULT_CLEARED;

    // Check if cleared by arrest
    if (narrative && this.wasClearedByArrest(narrative)) {
      cloned.clearedBy = "A";
    }

    if (cloned.victim && !this.isVictimlessOffense(cloned.offenseCode)) {
      cloned.victim.type = cloned.victim.type || this.DEFAULT_VALUES.DEFAULT_VICTIM_TYPE;
      cloned.victim.race = cloned.victim.race || this.DEFAULT_VALUES.DEFAULT_RACE;
      cloned.victim.sex = cloned.victim.sex || this.DEFAULT_VALUES.DEFAULT_SEX;
      cloned.victim.ethnicity = cloned.victim.ethnicity || this.DEFAULT_VALUES.DEFAULT_ETHNICITY;
      
      if (cloned.victim.age !== undefined && cloned.victim.age !== null) {
        cloned.victim.age = Math.max(0, Math.min(130, Number(cloned.victim.age)));
      }
    } else if (this.isVictimlessOffense(cloned.offenseCode)) {
      delete cloned.victim;
    }

    if (cloned.offender) {
      cloned.offender.race = cloned.offender.race || this.DEFAULT_VALUES.DEFAULT_RACE;
      cloned.offender.sex = cloned.offender.sex || this.DEFAULT_VALUES.DEFAULT_SEX;
      cloned.offender.ethnicity = cloned.offender.ethnicity || this.DEFAULT_VALUES.DEFAULT_ETHNICITY;
      
      if (cloned.offender.age !== undefined && cloned.offender.age !== null) {
        cloned.offender.age = Math.max(0, Math.min(130, Number(cloned.offender.age)));
      }
      
      if (!this.isVictimlessOffense(cloned.offenseCode)) {
  cloned.offender.relationshipToVictim = 
    cloned.offender.relationshipToVictim 
      || this.mapRelationship(cloned.offender.relationshipDescription) 
      || "UN";
}
    }

    if (cloned.property) {
      if (cloned.property.value !== undefined && cloned.property.value !== null) {
        cloned.property.value = Math.max(0, Number(cloned.property.value));
      }
      
      if (!cloned.property.lossType && cloned.property.value > 0) {
        cloned.property.lossType = "5";
      }
    }

    return cloned;
  }

  private static findBestMatch(
    input: string | undefined, 
    table: Record<string, string>,
    context?: string
  ): MappingResult {
    if (!input || input.trim() === "") {
      return { code: "", confidence: 0, originalInput: input };
    }

    const inputLower = input.toLowerCase().trim();
    let bestMatch: MappingResult = { code: "", confidence: 0, originalInput: input };

    if (table[inputLower]) {
      return { code: table[inputLower], confidence: 1.0, originalInput: input };
    }

    for (const [key, code] of Object.entries(table)) {
      const keyLower = key.toLowerCase();
      
      if (inputLower === keyLower) {
        return { code, confidence: 1.0, originalInput: input };
      }

      if (inputLower.includes(keyLower) || keyLower.includes(inputLower)) {
        const confidence = 0.8 + (keyLower.length / inputLower.length) * 0.1;
        if (confidence > bestMatch.confidence) {
          bestMatch = { code, confidence, originalInput: input };
        }
        continue;
      }

      const inputWords = inputLower.split(/\s+/);
      const keyWords = keyLower.split(/\s+/);
      
      const matchingWords = inputWords.filter(word => 
        keyWords.some(kw => kw.includes(word) || word.includes(kw))
      ).length;

      if (matchingWords > 0) {
        const confidence = 0.6 + (matchingWords / Math.max(inputWords.length, keyWords.length)) * 0.3;
        if (confidence > bestMatch.confidence) {
          bestMatch = { code, confidence, originalInput: input };
        }
      }
    }

    if (bestMatch.confidence < 0.5) {
      const fallbacks: Record<string, Record<string, string>> = {
        location: {
          "intersection": "13", "road": "13", "street": "13", "highway": "13",
          "home": "01", "house": "01", "residence": "01", "apartment": "01",
          "parking": "18", "lot": "18", "parking lot": "18", "complex": "18",
          "garage": "19", "parking garage": "19",
          "store": "06", "shop": "06", "retail": "06", "target": "06", "market": "06",
          "park": "17", "recreation": "17", "playground": "17",
          "school": "26", "high school": "26", "elementary": "26",
          "bank": "02", "credit union": "02",
          "cafe": "06", "restaurant": "06", "bar": "06"
        },
        offense: {
          "assault": "13A", "attack": "13A", "hit": "13A", "slap": "13B", "punch": "13B",
          "robbery": "120", "armed robbery": "121", "robbery with weapon": "121",
          "theft": "23H", "steal": "23H", "shoplift": "23F", "shoplifting": "23F",
          "burglary": "220", "break in": "220", "breaking entering": "220",
          "auto theft": "240", "car theft": "240", "vehicle theft": "240",
          "vandalism": "290", "graffiti": "290", "damage property": "290",
          "hacking": "26C", "unauthorized access": "26C", "computer intrusion": "26C",
          "fraud": "26A", "credit card": "26A", "identity theft": "26A",
          "drug possession": "35A", "cocaine": "35C", "drug sale": "35B", "drug deal": "35B",
          "weapon": "520", "knife": "520", "weapon violation": "520",
          "intoxication": "90C", "drunk": "90C", "alcohol": "90C",
          "hit run": "240", "hit and run": "240", "auto accident": "240"
        },
        weapon: {
          "gun": "12", "firearm": "12", "pistol": "12",
          "knife": "15", "blade": "15", "pocket knife": "15",
          "fist": "40", "hand": "40", "punch": "40", "slap": "40",
          "foot": "40", "kick": "40"
        }
      };

      const contextFallbacks = fallbacks[context || ""] || {};
      for (const [key, code] of Object.entries(contextFallbacks)) {
        if (inputLower.includes(key)) {
          return { code, confidence: 0.7, originalInput: input };
        }
      }
    }

    if (bestMatch.confidence < 0.4 && Object.keys(table).length > 0) {
      const firstCode = Object.values(table)[0];
      return { code: firstCode, confidence: 0.2, originalInput: input };
    }

    return bestMatch;
  }

  static mapOffense(description: string | undefined): MappingResult {
    if (!description) return { code: "", confidence: 0 };
    
    const inputLower = description.toLowerCase();
    
    const priorityRules: Array<[RegExp, string, number]> = [
      [/shoplift|conceal.*merchandise|retail.theft/i, '23F', 0.95],
      [/credit.card|identity.theft|open.*account/i, '26A', 0.95],
      [/drug.*sale|sell.*drug|trafficking|deal.*drug/i, '35B', 0.95],
      [/drug.*cocaine|cocaine.*possession/i, '35C', 0.9],
      [/weapon.*school|knife.*school|weapon.*violation/i, '520', 0.9],
      [/intoxication|drunk|public.drink|alcohol.*public/i, '90C', 0.9],
      [/hit.run|hit.and.run|fled.*scene|leave.*scene/i, '240', 0.9],
      [/hack|unauthorized.access|computer.intrusion/i, '26C', 0.9],
      [/robbery.*knife|robbery.*weapon|armed.robbery/i, '121', 0.9],
      [/vandalism|graffiti|damage.*property|destroy.*property/i, '290', 0.9],
      [/burglary|break.in|breaking.entering/i, '220', 0.9],
      [/auto.theft|car.theft|vehicle.theft/i, '240', 0.9],
      [/robbery.*force|unarmed.robbery/i, '120', 0.8],
      [/drug.*possession|narcotic.*possession/i, '35A', 0.8],
      [/assault.*aggravated|serious.*injury|weapon.*assault/i, '13A', 0.8],
      [/assault.*simple|minor.*injury|slap|punch/i, '13B', 0.8],
    ];
    
    for (const [regex, code, confidence] of priorityRules) {
      if (regex.test(inputLower)) {
        return { code, confidence, originalInput: description };
      }
    }
    
    return this.findBestMatch(description, NIBRS_OFFENSE_CODES, "offense");
  }

  static mapLocation(description: string | undefined, offenseCode?: string): MappingResult {
    const inputLower = (description || '').toLowerCase();
    
    // Cyber crimes → victim's home
    if (offenseCode?.startsWith('26')) {
      return { code: "01", confidence: 0.8, originalInput: description };
    }
    
    // Specific location overrides
    if (/parking.lot|apartment.*lot|complex.*parking/i.test(inputLower)) {
      return { code: "18", confidence: 0.9, originalInput: description };
    }
    if (/parking.garage|garage/i.test(inputLower)) {
      return { code: "19", confidence: 0.9, originalInput: description };
    }
    if (/park|recreation|playground/i.test(inputLower)) {
      return { code: "17", confidence: 0.9, originalInput: description };
    }
    if (/school|high.school|elementary/i.test(inputLower)) {
      return { code: "26", confidence: 0.9, originalInput: description };
    }
    if (/store|shop|retail|market|mall|target|walmart/i.test(inputLower)) {
      return { code: "06", confidence: 0.9, originalInput: description };
    }
    if (/bank|credit.union|financial/i.test(inputLower)) {
      return { code: "02", confidence: 0.9, originalInput: description };
    }
    if (/restaurant|cafe|bar|diner/i.test(inputLower)) {
      return { code: "06", confidence: 0.9, originalInput: description };
    }
    
    return this.findBestMatch(description, NIBRS_LOCATION_CODES, "location");
  }

  static mapWeapon(description: string | undefined): MappingResult {
    if (!description) return { code: "", confidence: 0 };
    
    // Specific weapon detection
    const inputLower = description.toLowerCase();
    if (/fist|punch|slap|hand|hit|strike/i.test(inputLower)) {
      return { code: "40", confidence: 0.9, originalInput: description };
    }
    if (/foot|kick|leg/i.test(inputLower)) {
      return { code: "40", confidence: 0.9, originalInput: description };
    }
    
    return this.findBestMatch(description, NIBRS_WEAPON_CODES, "weapon");
  }

  static mapRelationship(description?: string, narrative?: string | undefined): string {
  if (!description) return "UN"; // Default unknown
  const desc = description.toLowerCase().trim();

  // Direct match first
  if (NIBRS_RELATIONSHIP_CODES[desc]) return NIBRS_RELATIONSHIP_CODES[desc];

  // Partial matching fallback
  for (const [key, code] of Object.entries(NIBRS_RELATIONSHIP_CODES)) {
    if (desc.includes(key)) return code;
  }

  return "UN"; // Default if nothing matches
}

  static mapProperty(description: string | undefined): MappingResult {
    if (!description) return { code: "", confidence: 0 };
    
    const inputLower = description.toLowerCase();
    
    // Specific property detection
    if (/vehicle|car|auto|truck|honda|ford|chevrolet/i.test(inputLower)) {
      return { code: "24", confidence: 0.95, originalInput: description };
    }
    if (/money|cash|currency|dollar|fund/i.test(inputLower)) {
      return { code: "07", confidence: 0.95, originalInput: description };
    }
    if (/electronic|computer|laptop|tablet|phone|television/i.test(inputLower)) {
      return { code: "20", confidence: 0.9, originalInput: description };
    }
    if (/jewelry|ring|necklace|watch|gold|silver/i.test(inputLower)) {
      return { code: "37", confidence: 0.9, originalInput: description };
    }
    
    return this.findBestMatch(description, NIBRS_PROPERTY_CODES, "property");
  }

  static mapLossType(description: string | undefined): string {
    if (!description) return "";
    
    const lossMapping: Record<string, string> = {
      "stolen": "1", "steal": "1", "theft": "1", "taken": "1",
      "embezzled": "2", "embezzle": "2",
      "counterfeit": "3", "fake": "3",
      "destroyed": "4", "destroy": "4", "demolished": "4", "shattered": "4",
      "damaged": "5", "damage": "5", "broken": "5", "crashed": "5", "vandalized": "5",
      "recovered": "6", "recover": "6", "found": "6",
      "seized": "7", "seize": "7", "confiscated": "7", "evidence": "7",
      "ransomed": "8", "ransom": "8",
      "extorted": "9", "extortion": "9"
    };

    const result = this.findBestMatch(description, lossMapping, "loss");
    return result.code || "";
  }

  // Extract multiple properties from narrative
  static extractMultipleProperties(narrative: string): Array<{description: string, value?: number}> {
    const properties: Array<{description: string, value?: number}> = [];
    const narrativeLower = narrative.toLowerCase();
    
    // Pattern matching for multiple items
    const itemPatterns = [
      /(\w+)\s*\(\$([\d,]+)\)/g,
      /(\$[\d,]+)\s*(?:worth of|value)\s*(\w+)/g,
      /(\w+)\s*(?:valued at|worth)\s*(\$[\d,]+)/g
    ];
    
    for (const pattern of itemPatterns) {
      let match;
      while ((match = pattern.exec(narrativeLower)) !== null) {
        const value = parseInt(match[2]?.replace(/[^\d]/g, '') || match[1]?.replace(/[^\d]/g, ''));
        const description = match[1] || match[2];
        if (description && !isNaN(value)) {
          properties.push({ description, value });
        }
      }
    }
    
    return properties;
  }

  // Main mapping function with comprehensive error handling
  static mapDescriptiveToNibrs(extract: DescriptiveExtract): any {
    try {
      const offense = this.mapOffense(extract.offenseDescription);
      const location = this.mapLocation(extract.locationDescription, offense.code);
      
      const mapped: any = {
        incidentNumber: extract.incidentNumber,
        incidentDate: extract.incidentDate,
        incidentTime: extract.incidentTime,
        clearedExceptionally: extract.clearedExceptionally,
        exceptionalClearanceDate: extract.exceptionalClearanceDate,
        offenseCode: offense.code,
        offenseAttemptedCompleted: extract.offenseAttemptedCompleted,
        locationCode: location.code,
        narrative: extract.narrative || "",
        mappingConfidence: {
          offense: offense.confidence,
          location: location.confidence,
          originalInputs: {
            offense: offense.originalInput,
            location: location.originalInput
          }
        }
      };

      // Remove victim data for victimless crimes
      if (this.isVictimlessOffense(offense.code)) {
        delete extract.victim;
        if (extract.offender) {
          delete extract.offender.relationshipDescription;
        }
      }

      // Map weapon if provided
      if (extract.weaponDescription) {
        const weapon = this.mapWeapon(extract.weaponDescription);
        if (weapon.code) {
          mapped.weaponCode = weapon.code;
          mapped.mappingConfidence.weapon = weapon.confidence;
          mapped.mappingConfidence.originalInputs.weapon = weapon.originalInput;
        }
      }

      // Map bias motivation if provided
      if (extract.biasMotivation) {
        mapped.biasMotivationCode = extract.biasMotivation;
      }

      // Map victim data with validation
      if (extract.victim && !this.isVictimlessOffense(offense.code)) {
        mapped.victim = { ...extract.victim };
        if (mapped.victim.sex && !["M", "F", "U"].includes(mapped.victim.sex)) {
          mapped.victim.sex = "U";
        }
      }

      // Map offender data with validation
      if (extract.offender) {
        mapped.offender = { ...extract.offender };
        
        // Map relationship (skip for victimless crimes)
        if (extract.offender.relationshipDescription && !this.isVictimlessOffense(offense.code)) {
          const relationship = this.mapRelationship(extract.offender.relationshipDescription, extract.narrative);
          if (relationship) {
            mapped.offender.relationshipToVictim = relationship;
          }
        }
        
        if (mapped.offender.sex && !["M", "F", "U"].includes(mapped.offender.sex)) {
          mapped.offender.sex = "U";
        }
      }

      // Handle multiple properties from narrative
      const multipleProperties = this.extractMultipleProperties(extract.narrative || '');
      
      if (multipleProperties.length > 0) {
        mapped.properties = multipleProperties.map(prop => {
          const property = this.mapProperty(prop.description);
          return {
            descriptionCode: property.code,
            value: prop.value,
            mappingConfidence: property.confidence
          };
        });
      }
      // Map single property data with validation
      else if (extract.property) {
        const isEvidence = /seized|confiscated|evidence/i.test(extract.property.lossDescription || '');
        
        if (isEvidence) {
          mapped.evidence = {
            description: extract.property.propertyDescription,
            value: extract.property.value ? Math.max(0, Number(extract.property.value)) : undefined
          };
        } else {
          mapped.property = {
            value: extract.property.value ? Math.max(0, Number(extract.property.value)) : undefined
          };

          if (extract.property.lossDescription) {
            const lossType = this.mapLossType(extract.property.lossDescription);
            if (lossType) {
              mapped.property.lossType = lossType;
            }
          }

          if (extract.property.propertyDescription) {
            const property = this.mapProperty(extract.property.propertyDescription);
            if (property.code) {
              mapped.property.descriptionCode = property.code;
              mapped.mappingConfidence.property = property.confidence;
              mapped.mappingConfidence.originalInputs.property = property.originalInput;
            }
          }
        }
      }

      // Add missing required fields with defaults and validate
      return this.addMissingRequiredFields(mapped, extract.narrative);

    } catch (error) {
      console.error("Error in mapDescriptiveToNibrs:", error);
      return {
        incidentNumber: `INC-${Date.now()}`,
        incidentDate: new Date().toISOString().split('T')[0],
        offenseCode: "13A",
        offenseAttemptedCompleted: "C",
        locationCode: "13",
        clearedExceptionally: "N",
        narrative: extract.narrative || "Error processing report",
        mappingConfidence: { error: "Mapping failed", confidence: 0 }
      };
    }
  }

  static validateAndMapExtract(extract: DescriptiveExtract): {
    data: any;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const mapped = this.mapDescriptiveToNibrs(extract);
    
    if (!mapped.incidentDate || isNaN(Date.parse(mapped.incidentDate))) {
      errors.push("Invalid incident date");
    }
    
    if (!mapped.offenseCode || !Object.values(NIBRS_OFFENSE_CODES).includes(mapped.offenseCode)) {
      errors.push("Invalid offense code");
    }
    
    if (!mapped.locationCode || !Object.values(NIBRS_LOCATION_CODES).includes(mapped.locationCode)) {
      errors.push("Invalid location code");
    }
    
    if (mapped.mappingConfidence.offense < 0.5) {
      warnings.push(`Low confidence in offense mapping: ${mapped.offenseCode}`);
    }
    
    if (mapped.mappingConfidence.location < 0.5) {
      warnings.push(`Low confidence in location mapping: ${mapped.locationCode}`);
    }
    
    return { data: mapped, errors, warnings };
  }
}