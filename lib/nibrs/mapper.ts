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
  offenses?: Array<{
    description?: string;
    attemptedCompleted?: "A" | "C";
  }>;
  locationDescription?: string;
  weaponDescriptions?: string[];
  biasMotivation?: string;
  victims?: Array<{
    type?: string;
    age?: number;
    sex?: "M" | "F" | "U";
    race?: string;
    ethnicity?: string;
    injury?: string;
  }>;
  offenders?: Array<{
    age?: number;
    sex?: "M" | "F" | "U";
    race?: string;
    ethnicity?: string;
    relationshipDescription?: string;
  }>;
  properties?: Array<{
    lossDescription?: string;
    propertyDescription?: string;
    value?: number;
  }>;
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
  ]);

  private static readonly CLEARED_BY_ARREST_KEYWORDS = [
    'arrested', 'booked', 'taken into custody', 'placed under arrest',
    'custody', 'charged', 'cited', 'citation', 'apprehended', 'detained',
    'issued summons', 'summoned', 'violation notice', 'notice to appear'
  ];

  private static readonly ARREST_TYPES: Record<string, string> = {
    'on.view': 'O',
    'on view': 'O', 
    'summoned': 'S',
    'cited': 'S',
    'taken into custody': 'T',
    'custody': 'T',
    'arrested': 'T'
  };

  static isVictimlessOffense(offenseCode: string): boolean {
    return this.VICTIMLESS_OFFENSE_CODES.has(offenseCode);
  }

  static wasClearedByArrest(narrative: string): boolean {
    const lowerNarrative = narrative.toLowerCase();
    return this.CLEARED_BY_ARREST_KEYWORDS.some(keyword => 
      lowerNarrative.includes(keyword.toLowerCase())
    );
  }

  // NEW: Create society victim for victimless crimes
  private static createSocietyVictim(): any {
    return {
      type: "S", // Society/Public
      injury: "N", // No injury
      age: undefined,
      sex: "U",
      race: "U", 
      ethnicity: "U"
    };
  }

  // Extract arrestees from narrative
  static extractArrestees(narrative: string, offenders: any[]): any[] {
    const arrestees: any[] = [];
    const narrativeLower = narrative.toLowerCase();
    
    // Check if arrest occurred
    const hasArrest = this.CLEARED_BY_ARREST_KEYWORDS.some(keyword => 
      narrativeLower.includes(keyword)
    );
    
    if (!hasArrest || !offenders || offenders.length === 0) {
      return arrestees;
    }

    // Extract arrest details
    let arrestType = "T"; // Default: Taken into custody
    let arrestDate = new Date().toISOString().split('T')[0]; // Default: today
    
    // Detect arrest type from narrative
    for (const [keyword, code] of Object.entries(this.ARREST_TYPES)) {
      if (narrativeLower.includes(keyword)) {
        arrestType = code;
        break;
      }
    }

    // Create arrestee records for each offender
    offenders.forEach((offender, index) => {
      arrestees.push({
        sequenceNumber: index + 1,
        arrestDate: arrestDate,
        arrestType: arrestType,
        age: offender.age,
        sex: offender.sex,
        race: offender.race || "U",
        ethnicity: offender.ethnicity || "U",
        residentCode: "U", // Default unknown
        clearanceCode: "A" // Arrest clearance
      });
    });

    console.log(`[MAPPER] Extracted ${arrestees.length} arrestees`);
    return arrestees;
  }

  static extractMultipleProperties(narrative: string): Array<{description: string, value?: number}> {
    const properties: Array<{description: string, value?: number}> = [];
    const narrativeLower = narrative.toLowerCase();
    
    console.log(`[MAPPER] Extracting properties from narrative`);
    
    // Enhanced pattern matching for multiple items
    const patterns = [
      /(\d+)?\s*(\w+(?:\s+\w+)*)\s*(?:valued at|worth|value|valued|of|)\s*\$?(\d+(?:,\d+)?)/gi,
      /\$(\d+(?:,\d+)?)\s*(?:worth of|value of|)\s*(\w+(?:\s+\w+)*)/gi,
      /(\w+(?:\s+\w+)*)\s*\(\$(\d+(?:,\d+)?)\)/gi,
      /(?:stolen|took|missing|damaged):?\s*([^.,;]+)(?:\.|,|;|$)/gi,
      /(?:,|\band\b)\s*(\w+(?:\s+\w+)*)(?=\s*(?:,|\.|$|\band\b))/gi
    ];
    
    const foundItems = new Set<string>();
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(narrativeLower)) !== null) {
        let description: string | undefined;
        let value: number | undefined;
        
        if (match[3] !== undefined) {
          description = match[2]?.trim();
          value = match[3] ? parseInt(match[3].replace(/[^\d]/g, '')) : undefined;
        } else if (match[1] !== undefined && match[2] !== undefined) {
          value = parseInt(match[1].replace(/[^\d]/g, ''));
          description = match[2]?.trim();
        } else if (match[1] !== undefined && match[2] !== undefined) {
          description = match[1]?.trim();
          value = parseInt(match[2].replace(/[^\d]/g, ''));
        } else if (match[1] !== undefined) {
          description = match[1]?.trim();
        }
        
        if (description && !foundItems.has(description.toLowerCase())) {
          description = description.replace(/^\s*(?:a|an|the|some)\s+/i, '')
                                   .replace(/\s+$/, '')
                                   .replace(/^[\d\s]*/, '');
          
          if (description.length > 2) {
            properties.push({ description, value });
            foundItems.add(description.toLowerCase());
            console.log(`[MAPPER] Extracted property: "${description}" = ${value ? '$' + value : 'no value'}`);
          }
        }
      }
    }
    
    return properties;
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
    cloned.clearedExceptionally = cloned.clearedExceptionally || 
      this.DEFAULT_VALUES.DEFAULT_CLEARED;

    // Check if cleared by arrest
    if (narrative && this.wasClearedByArrest(narrative)) {
      cloned.clearedBy = "A";
      
      if (cloned.arrestees && cloned.arrestees.length > 0) {
        cloned.arrestees.forEach((arrestee: any) => {
          if (!arrestee.clearanceCode) {
            arrestee.clearanceCode = "A";
          }
        });
      }
    }

    // Handle multiple offenses
    if (cloned.offenses && Array.isArray(cloned.offenses)) {
      cloned.offenses = cloned.offenses.map((offense: any) => ({
        ...offense,
        attemptedCompleted: offense.attemptedCompleted || this.DEFAULT_VALUES.DEFAULT_OFFENSE_ATTEMPTED
      }));
    }

    // Handle multiple victims
    if (cloned.victims && Array.isArray(cloned.victims)) {
      cloned.victims = cloned.victims.map((victim: any) => ({
        ...victim,
        type: victim.type || this.DEFAULT_VALUES.DEFAULT_VICTIM_TYPE,
        race: victim.race || this.DEFAULT_VALUES.DEFAULT_RACE,
        sex: victim.sex || this.DEFAULT_VALUES.DEFAULT_SEX,
        ethnicity: victim.ethnicity || this.DEFAULT_VALUES.DEFAULT_ETHNICITY,
        age: victim.age !== undefined && victim.age !== null 
          ? Math.max(0, Math.min(130, Number(victim.age))) 
          : undefined
      }));
    }

    // Handle multiple offenders
    if (cloned.offenders && Array.isArray(cloned.offenders)) {
      cloned.offenders = cloned.offenders.map((offender: any) => ({
        ...offender,
        race: offender.race || this.DEFAULT_VALUES.DEFAULT_RACE,
        sex: offender.sex || this.DEFAULT_VALUES.DEFAULT_SEX,
        ethnicity: offender.ethnicity || this.DEFAULT_VALUES.DEFAULT_ETHNICITY,
        age: offender.age !== undefined && offender.age !== null 
          ? Math.max(0, Math.min(130, Number(offender.age))) 
          : undefined
      }));
    }

    // Handle multiple properties
    if (cloned.properties && Array.isArray(cloned.properties)) {
      cloned.properties = cloned.properties.map((property: any) => ({
        ...property,
        value: property.value !== undefined && property.value !== null 
          ? Math.max(0, Number(property.value)) 
          : undefined
      }));
    }

    // Handle arrestees
    if (cloned.arrestees && Array.isArray(cloned.arrestees)) {
      cloned.arrestees = cloned.arrestees.map((arrestee: any) => ({
        ...arrestee,
        residentCode: arrestee.residentCode || "U",
        clearanceCode: arrestee.clearanceCode || "A"
      }));
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
          "burglary": "220", "break in": "220", "breaking entering": "220", "forced entry": "220",
          "auto theft": "240", "car theft": "240", "vehicle theft": "240",
          "vandalism": "290", "graffiti": "290", "damage property": "290",
          "hacking": "26C", "unauthorized access": "26C", "computer intrusion": "26C",
          "fraud": "26A", "credit card": "26A", "identity theft": "26A",
          "drug possession": "35A", "cocaine": "35A", "drug sale": "35B", "drug deal": "35B",
          "weapon": "520", "knife": "520", "weapon violation": "520",
          "intoxication": "90C", "drunk": "90C", "alcohol": "90C",
          "hit run": "240", "hit and run": "240", "auto accident": "240"
        },
        weapon: {
          "gun": "11", "firearm": "11", "pistol": "11",
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
    if (!description) return { code: "", confidence: 0, originalInput: description };
    
    const inputLower = description.toLowerCase().trim();
    console.log(`[MAPPER] Mapping offense: "${description}" -> "${inputLower}"`);
    
    // 1. Exact match first
    if (NIBRS_OFFENSE_CODES[inputLower]) {
      console.log(`[MAPPER] Exact match found: ${NIBRS_OFFENSE_CODES[inputLower]}`);
      return { 
        code: NIBRS_OFFENSE_CODES[inputLower], 
        confidence: 1.0, 
        originalInput: description 
      };
    }
    
    // 2. Priority rules for common patterns - FIXED DRUG MAPPING
    const priorityRules: Array<[RegExp, string, number]> = [
      [/possession.*controlled.substance|possess.*cocaine|drug.*possess/i, '35A', 0.95],
      [/shoplift|conceal.*merchandise|retail.theft/i, '23F', 0.95],
      [/credit.card|identity.theft|open.*account/i, '26A', 0.95],
      [/drug.*sale|sell.*drug|trafficking|deal.*drug/i, '35B', 0.95],
      [/burglary|break.in|breaking.entering|forced.entry/i, '220', 0.95],
      [/robbery.*knife|robbery.*weapon|armed.robbery/i, '121', 0.9],
      [/vandalism|graffiti|damage.*property|destroy.*property/i, '290', 0.9],
      [/auto.theft|car.theft|vehicle.theft/i, '240', 0.9],
      [/hack|unauthorized.access|computer.intrusion/i, '26C', 0.9],
      [/assault.*aggravated|serious.*injury|weapon.*assault/i, '13A', 0.8],
      [/assault.*simple|minor.*injury|slap|punch/i, '13B', 0.8],
      [/theft|steal|stolen|taken/i, '23H', 0.7],
      [/fraud|scam|deception/i, '26A', 0.7],
      [/weapon|firearm|gun|knife/i, '520', 0.7],
      [/intoxication|drunk|public.drink|alcohol/i, '90C', 0.7],
    ];
    
    for (const [regex, code, confidence] of priorityRules) {
      if (regex.test(inputLower)) {
        console.log(`[MAPPER] Priority rule matched: ${regex} -> ${code}`);
        return { code, confidence, originalInput: description };
      }
    }
    
    // 3. Best match fallback
    const bestMatch = this.findBestMatch(description, NIBRS_OFFENSE_CODES, "offense");
    console.log(`[MAPPER] Best match result: ${bestMatch.code} (confidence: ${bestMatch.confidence})`);
    
    // 4. Final fallback if still no match
    if (!bestMatch.code || bestMatch.confidence < 0.3) {
      console.log(`[MAPPER] Using fallback offense code: 13A`);
      return { code: "13A", confidence: 0.2, originalInput: description };
    }
    
    return bestMatch;
  }

  static mapLocation(description: string | undefined, offenseCode?: string): MappingResult {
    const inputLower = (description || '').toLowerCase();
    console.log(`[MAPPER] Mapping location: "${description}"`);
    
    // Specific location overrides - FIXED STREET DETECTION
    if (/main.street|5th.avenue|highway|road|street|avenue|roadway/i.test(inputLower)) {
      return { code: "13", confidence: 0.95, originalInput: description };
    }
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
    if (/apartment|condo|residence|home|house/i.test(inputLower)) {
      return { code: "20", confidence: 0.9, originalInput: description };
    }
    
    const result = this.findBestMatch(description, NIBRS_LOCATION_CODES, "location");
    console.log(`[MAPPER] Location mapping result: ${result.code} (confidence: ${result.confidence})`);
    return result;
  }

  static mapWeapon(description: string | undefined): MappingResult {
    if (!description) return { code: "", confidence: 0, originalInput: description };
    
    console.log(`[MAPPER] Mapping weapon: "${description}"`);
    
    // Specific weapon detection
    const inputLower = description.toLowerCase();
    if (/fist|punch|slap|hand|hit|strike/i.test(inputLower)) {
      return { code: "40", confidence: 0.9, originalInput: description };
    }
    if (/foot|kick|leg/i.test(inputLower)) {
      return { code: "40", confidence: 0.9, originalInput: description };
    }
    
        const result = this.findBestMatch(description, NIBRS_WEAPON_CODES, "weapon");
    console.log(`[MAPPER] Weapon mapping result: ${result.code} (confidence: ${result.confidence})`);
    return result;
  }

  static mapRelationship(description?: string, narrative?: string | undefined): string {
    if (!description) return "UN"; // Default unknown
    const desc = description.toLowerCase().trim();

    console.log(`[MAPPER] Mapping relationship: "${description}"`);

    // Direct match first
    if (NIBRS_RELATIONSHIP_CODES[desc]) {
      console.log(`[MAPPER] Relationship exact match: ${NIBRS_RELATIONSHIP_CODES[desc]}`);
      return NIBRS_RELATIONSHIP_CODES[desc];
    }

    // Partial matching fallback
    for (const [key, code] of Object.entries(NIBRS_RELATIONSHIP_CODES)) {
      if (desc.includes(key)) {
        console.log(`[MAPPER] Relationship partial match: ${key} -> ${code}`);
        return code;
      }
    }

    // Check narrative for relationship clues if description is vague
    if (narrative && (desc === "unknown" || desc === "stranger" || desc === "")) {
      const narrativeLower = narrative.toLowerCase();
      if (narrativeLower.includes("known") || narrativeLower.includes("acquaintance")) {
        console.log(`[MAPPER] Relationship inferred from narrative: AQ`);
        return "AQ";
      }
      if (narrativeLower.includes("family") || narrativeLower.includes("relative")) {
        console.log(`[MAPPER] Relationship inferred from narrative: OF`);
        return "OF";
      }
    }

    console.log(`[MAPPER] Relationship default: UN`);
    return "UN"; // Default if nothing matches
  }

  static mapLossType(description: string | undefined): string {
    if (!description) return "7"; // Default to seized
    
    const lossMapping: Record<string, string> = {
      "stolen": "1", "steal": "1", "theft": "1", "taken": "1", "missing": "1",
      "embezzled": "2", "embezzle": "2",
      "counterfeit": "3", "fake": "3",
      "destroyed": "4", "destroy": "4", "demolished": "4", "shattered": "4", 
      "damaged": "4", "damage": "4", "broken": "4", "crashed": "4", "vandalized": "4",
      "recovered": "6", "recover": "6", "found": "6", "returned": "6",
      "seized": "7", "seize": "7", "confiscated": "7", "evidence": "7", "secured": "7",
      "ransomed": "8", "ransom": "8",
      "extorted": "9", "extortion": "9"
    };

    const inputLower = description.toLowerCase();
    for (const [key, code] of Object.entries(lossMapping)) {
      if (inputLower.includes(key)) {
        return code;
      }
    }
    
    return "7"; // Default to seized
  }

  static mapProperty(description: string | undefined): MappingResult {
    if (!description) return { code: "", confidence: 0, originalInput: description };
    
    const inputLower = description.toLowerCase();
    
    // Enhanced property detection - FIXED DRUG PROPERTY MAPPING
    if (/cocaine|drug|narcotic|controlled.substance|powdery.substance|baggie|rolling.paper/i.test(inputLower)) {
      return { code: "23", confidence: 0.95, originalInput: description };
    }
    if (/vehicle|car|auto|truck|honda|ford|chevrolet|toyota/i.test(inputLower)) {
      return { code: "08", confidence: 0.95, originalInput: description };
    }
    if (/money|cash|currency|dollar|fund/i.test(inputLower)) {
      return { code: "01", confidence: 0.95, originalInput: description };
    }
    if (/electronic|computer|laptop|tablet|macbook|ipad/i.test(inputLower)) {
      return { code: "14", confidence: 0.95, originalInput: description };
    }
    if (/phone|iphone|smartphone|cellular/i.test(inputLower)) {
      return { code: "32", confidence: 0.95, originalInput: description };
    }
    if (/jewelry|ring|necklace|watch|gold|silver|rolex/i.test(inputLower)) {
      return { code: "02", confidence: 0.95, originalInput: description };
    }
    if (/firearm|gun|pistol|rifle|shotgun/i.test(inputLower)) {
      return { code: "11", confidence: 0.95, originalInput: description };
    }
    if (/camera|security.camera|surveillance/i.test(inputLower)) {
      return { code: "14", confidence: 0.9, originalInput: description };
    }
    if (/door|window|frame|structure|building/i.test(inputLower)) {
      return { code: "34", confidence: 0.8, originalInput: description };
    }
    
    const result = this.findBestMatch(description, NIBRS_PROPERTY_CODES, "property");
    return result;
  }

  static mapDescriptiveToNibrs(extract: DescriptiveExtract): any {
    try {
      console.log("[MAPPER] Starting mapDescriptiveToNibrs with extract:", JSON.stringify(extract, null, 2));

      // Map multiple offenses
      const offenses = (extract.offenses || []).map(offense => {
        console.log(`[MAPPER] Mapping offense: ${offense.description}`);
        const mappedOffense = this.mapOffense(offense.description);
        
        return {
          code: mappedOffense.code || "13A",
          description: offense.description,
          attemptedCompleted: offense.attemptedCompleted || "C",
          mappingConfidence: mappedOffense.confidence
        };
      });

      // Ensure we have at least one offense
      if (offenses.length === 0) {
        console.log("[MAPPER] No offenses found, adding default");
        offenses.push({
          code: "13A",
          description: "Default offense",
          attemptedCompleted: "C",
          mappingConfidence: 0.1
        });
      }

      console.log("[MAPPER] Mapped offenses:", offenses);

      // Use the first offense for location mapping
      const primaryOffenseCode = offenses[0].code;
      const location = this.mapLocation(extract.locationDescription, primaryOffenseCode);
      
      const mapped: any = {
        incidentNumber: extract.incidentNumber,
        incidentDate: extract.incidentDate,
        incidentTime: extract.incidentTime,
        clearedExceptionally: extract.clearedExceptionally,
        exceptionalClearanceDate: extract.exceptionalClearanceDate,
        offenses: offenses,
        locationCode: location.code,
        narrative: extract.narrative || "",
        mappingConfidence: {
          offenses: offenses.map(o => o.mappingConfidence),
          location: location.confidence,
          originalInputs: {
            offenses: offenses.map(o => o.description),
            location: location.originalInput
          }
        }
      };

      console.log("[MAPPER] Base mapped structure:", JSON.stringify(mapped, null, 2));

      // Check if any offense is victimless
      const hasVictimlessOffense = offenses.some(offense => 
        this.isVictimlessOffense(offense.code)
      );

      // Check if this is a pure traffic incident
      const isPureTraffic = offenses.length === 1 && offenses[0].code === '64A';

      console.log("[MAPPER] Has victimless offense:", hasVictimlessOffense);
      console.log("[MAPPER] Is pure traffic incident:", isPureTraffic);

      // SIMPLIFIED VICTIM MAPPING - FIXED MULTI-OFFENSE HANDLING
      let mappedVictims: any[] = [];

      // Add Society/Public victim for victimless crimes if needed
      if (hasVictimlessOffense) {
        mappedVictims.push(this.createSocietyVictim());
        console.log("[MAPPER] Added Society/Public victim for victimless offenses");
      }

      // Map individual victims from extract
      if (extract.victims && Array.isArray(extract.victims)) {
        const individualVictims = extract.victims.map(victim => ({
          ...victim,
          sex: victim.sex && ["M", "F", "U"].includes(victim.sex) ? victim.sex : "U"
        }));
        mappedVictims = [...mappedVictims, ...individualVictims];
      }

      // Ensure traffic collisions have at least one victim
      const hasTrafficCollision = offenses.some(off => off.code === '64A');
      const hasIndividualVictim = mappedVictims.some(v => v.type === 'I' || v.type === 'B');

      if (hasTrafficCollision && !hasIndividualVictim) {
        console.log("[MAPPER] Adding default victim for traffic collision");
        mappedVictims.push({ 
          type: "I", 
          injury: "N",
          age: undefined,
          sex: "U",
          race: "U",
          ethnicity: "U"
        });
      }

      console.log("[MAPPER] Final victim mapping:", mappedVictims);
      mapped.victims = mappedVictims;

      // Map offender data with validation
      if (extract.offenders && Array.isArray(extract.offenders)) {
        mapped.offenders = extract.offenders.map(offender => {
          const result: any = { ...offender };
          
          // Map relationship
          if (offender.relationshipDescription) {
            const relationship = this.mapRelationship(offender.relationshipDescription, extract.narrative);
            if (relationship) {
              result.relationshipToVictim = relationship;
            }
          }
          
          if (result.sex && !["M", "F", "U"].includes(result.sex)) {
            result.sex = "U";
          }
          
          return result;
        });
        console.log("[MAPPER] Mapped offenders:", mapped.offenders);
      }

      // Extract arrestees if arrest occurred
      if (extract.narrative && mapped.offenders) {
        mapped.arrestees = this.extractArrestees(extract.narrative, mapped.offenders);
        
        // If arrestees exist, mark as cleared by arrest
        if (mapped.arrestees.length > 0) {
          mapped.clearedBy = "A";
          mapped.clearedExceptionally = "N";
          console.log("[MAPPER] Mapped arrestees:", mapped.arrestees);
        }
      }

      // Enhanced clearance detection for citations
      if (!mapped.clearedBy && extract.narrative) {
        const narrativeLower = extract.narrative.toLowerCase();
        if (narrativeLower.includes('citation') || narrativeLower.includes('cited') || 
            narrativeLower.includes('violation') || narrativeLower.includes('summons')) {
          mapped.clearedBy = "A";
          console.log("[MAPPER] Detected clearance by citation/summons");
        }
      }

      // Map multiple properties from extract
      if (extract.properties && Array.isArray(extract.properties)) {
        mapped.properties = extract.properties.map(prop => {
          const property = this.mapProperty(prop.propertyDescription);
          const lossType = this.mapLossType(prop.lossDescription);
          
          return {
            descriptionCode: property.code,
            description: prop.propertyDescription,
            lossType: lossType,
            value: prop.value ? Math.max(0, Number(prop.value)) : undefined,
            mappingConfidence: property.confidence
          };
        });
        console.log("[MAPPER] Mapped properties from extract:", mapped.properties);
      } else {
        // Handle multiple properties from narrative as fallback
        const multipleProperties = this.extractMultipleProperties(extract.narrative || '');
        
        if (multipleProperties.length > 0) {
          mapped.properties = multipleProperties.map(prop => {
            const property = this.mapProperty(prop.description);
            const lossType = prop.description?.toLowerCase().includes('damage') ? '4' : '1';
            
            return {
              descriptionCode: property.code,
              description: prop.description,
              lossType: lossType,
              value: prop.value,
              mappingConfidence: property.confidence
            };
          });
          console.log("[MAPPER] Mapped properties from narrative:", mapped.properties);
        }
      }

      // Add missing required fields with defaults and validate
      const result = this.addMissingRequiredFields(mapped, extract.narrative);
      console.log("[MAPPER] Final mapped result:", JSON.stringify(result, null, 2));
      
      return result;

    } catch (error) {
      console.error("[MAPPER] Error in mapDescriptiveToNibrs:", error);
      return {
        incidentNumber: `INC-${Date.now()}`,
        incidentDate: new Date().toISOString().split('T')[0],
        offenses: [{ code: "13A", description: "Error fallback offense", attemptedCompleted: "C", mappingConfidence: 0.1 }],
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
    
    console.log("[MAPPER] Starting validateAndMapExtract");
    
    const mapped = this.mapDescriptiveToNibrs(extract);
    
    if (!mapped.incidentDate || isNaN(Date.parse(mapped.incidentDate))) {
      errors.push("Invalid incident date");
    }
    
    if (!mapped.offenses || mapped.offenses.length === 0) {
      errors.push("No valid offenses found");
    } else {
      for (const offense of mapped.offenses) {
        if (!offense.code || !Object.values(NIBRS_OFFENSE_CODES).includes(offense.code)) {
          errors.push(`Invalid offense code: ${offense.code}`);
        }
      }
    }
    
    if (!mapped.locationCode || !Object.values(NIBRS_LOCATION_CODES).includes(mapped.locationCode)) {
      errors.push("Invalid location code");
    }
    
    // Validate arrestees if present
    if (mapped.arrestees && mapped.arrestees.length > 0) {
      // Group A offenses must have arrestee segments if cleared by arrest
      const isGroupA = mapped.offenses.some((offense: any) => 
        ['09A', '11A', '120', '121', '13A', '13B', '220', '240', '200'].includes(offense.code)
      );
      
      if (isGroupA && mapped.clearedBy === "A" && mapped.arrestees.length === 0) {
        warnings.push("Group A offense cleared by arrest should include arrestee segments");
      }
      
      // Validate each arrestee
      mapped.arrestees.forEach((arrestee: any) => {
        if (!arrestee.arrestDate) {
          errors.push("Arrestee missing arrest date");
        }
        if (!['O', 'S', 'T'].includes(arrestee.arrestType)) {
          errors.push("Invalid arrest type");
        }
      });
    }

    if (mapped.mappingConfidence.offenses) {
      mapped.mappingConfidence.offenses.forEach((confidence: number, index: number) => {
        if (confidence < 0.5) {
          warnings.push(`Low confidence in offense mapping: ${mapped.offenses[index].code} (confidence: ${confidence})`);
        }
      });
    }
    
    if (mapped.mappingConfidence.location < 0.5) {
      warnings.push(`Low confidence in location mapping: ${mapped.locationCode} (confidence: ${mapped.mappingConfidence.location})`);
    }
    
    console.log("[MAPPER] Validation results:", { errors, warnings });
    
    return { data: mapped, errors, warnings };
  }
}