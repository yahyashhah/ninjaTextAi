import {
  NIBRS_OFFENSE_CODES,
  NIBRS_LOCATION_CODES,
  NIBRS_WEAPON_CODES,
  NIBRS_RELATIONSHIP_CODES,
  NIBRS_PROPERTY_CODES,
  NIBRS_GROUP_A_OFFENSE_CODES,
  NIBRS_GROUP_B_OFFENSE_CODES,
  NIBRS_DRUG_PROPERTY_CODES,
  TRAFFIC_OFFENSE_EXCLUSIONS
} from "./codes";
import { NibrsSegments } from "./schema";

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
    name?: string;
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
    '520', // Weapon violations
    '720'  // Prostitution
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

  private static readonly PAST_INCIDENT_INDICATORS = [
    'prior', 'previous', 'investigation revealed', 'was responsible', 
    'involved in', 'had been', 'previously', 'history of', 'convictions for',
    'known to', 'according to records'
  ];

  private static readonly NON_OFFENSE_PHRASES = [
    'sustained.*damage', 'minor.*damage', 'bumper.*damage', 'vehicle.*damage',
    'records check', 'prior convictions', 'prohibited from', 'indicated.*prior',
    'field testing', 'subsequent.*inventory', 'search incident', 'exhibited signs'
  ];

  static isVictimlessOffense(offenseCode: string): boolean {
    return this.VICTIMLESS_OFFENSE_CODES.has(offenseCode);
  }

  static isTrafficOffense(description: string): boolean {
  if (!description) return false;
  const descLower = description.toLowerCase();
  
  // EXCLUDE simple traffic offenses but ALLOW DUI
  const excludePatterns = [
    'traffic collision', 'vehicle accident', 'car crash', 'rear.end',
    'failure to stop', 'traffic violation', 'speeding', 'reckless driving',
    'at fault', 'liable', 'collision', 'accident', 'crash'
  ];
  
  // BUT don't exclude if it involves DUI/alcohol
  const hasDUI = /dui|dwi|alcohol|intoxicated|bac|impaired/.test(descLower);
  
  return excludePatterns.some(pattern => descLower.includes(pattern)) && !hasDUI;
}

  static wasClearedByArrest(narrative: string): boolean {
    const lowerNarrative = narrative.toLowerCase();
    return this.CLEARED_BY_ARREST_KEYWORDS.some(keyword => 
      lowerNarrative.includes(keyword.toLowerCase())
    );
  }

  static isWithinCurrentIncident(text: string, narrative: string): boolean {
    const textLower = text.toLowerCase();
    const narrativeLower = narrative.toLowerCase();
    
    if (this.PAST_INCIDENT_INDICATORS.some(keyword => textLower.includes(keyword))) {
      return false;
    }
    
    const currentActionKeywords = ['observed', 'initiated', 'pursuit', 'arrest', 
                                 'discovered', 'search', 'detained', 'responded'];
    if (currentActionKeywords.some(keyword => narrativeLower.includes(keyword))) {
      return true;
    }
    
    return true;
  }

  static extractDrugDetails(description: string): { measurement?: string; quantity?: number } {
    const descLower = description.toLowerCase();
    const result: { measurement?: string; quantity?: number } = {};
    
    const quantityMatch = descLower.match(/(\d+)\s*(gram|g|ounce|oz|pound|lb|kilo|kg|bag|tablet|pill)/i);
    if (quantityMatch) {
      result.quantity = parseInt(quantityMatch[1]);
      result.measurement = quantityMatch[2];
    }
    
    return result;
  }

  static extractArrestees(narrative: string, offenders: any[]): any[] {
    const arrestees: any[] = [];
    const narrativeLower = narrative.toLowerCase();
    
    const hasArrest = this.CLEARED_BY_ARREST_KEYWORDS.some(keyword => 
      narrativeLower.includes(keyword)
    );
    
    if (!hasArrest || !offenders || offenders.length === 0) {
      return arrestees;
    }

    const arrestedNames: string[] = [];
    const arrestPatterns = [
      /(?:arrested|taken into custody|detained) (\w+ \w+)/gi,
      /(\w+ \w+) (?:was|were) (?:arrested|taken into custody)/gi,
      /(?:cited|charged) (\w+ \w+)/gi
    ];
    
    arrestPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(narrativeLower)) !== null) {
        arrestedNames.push(match[1].toLowerCase());
      }
    });

    let arrestType = "T";
    for (const [keyword, code] of Object.entries(this.ARREST_TYPES)) {
      if (narrativeLower.includes(keyword)) {
        arrestType = code;
        break;
      }
    }

    offenders.forEach((offender, index) => {
      const shouldInclude = !offender.name || arrestedNames.includes(offender.name.toLowerCase());
      
      if (shouldInclude) {
        arrestees.push({
          sequenceNumber: index + 1,
          arrestDate: new Date().toISOString().split('T')[0],
          arrestType: arrestType,
          age: offender.age,
          sex: offender.sex,
          race: offender.race || "U",
          ethnicity: offender.ethnicity || "U",
          residentCode: "U",
          clearanceCode: "A",
          offenseCodes: [] // Will be populated later
        });
      }
    });

    return arrestees;
  }

  static extractMultipleProperties(narrative: string): Array<{description: string, value?: number}> {
    const properties: Array<{description: string, value?: number}> = [];
    const narrativeLower = narrative.toLowerCase();
    
    const patterns = [
      /(\d+)?\s*(\w+(?:\s+\w+)*)\s*(?:valued at|worth|value|valued|of|)\s*\$?(\d+(?:,\d+)?)/gi,
      /\$(\d+(?:,\d+)?)\s*(?:worth of|value of|)\s*(\w+(?:\s+\w+)*)/gi,
      /(\w+(?:\s+\w+)*)\s*\(\$(\d+(?:,\d+)?)\)/gi,
      /(?:stolen|took|missing|damaged|seized|found|confiscated):?\s*([^.,;]+)(?:\.|,|;|$)/gi,
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

  static addMissingRequiredFields(mappedData: NibrsSegments, narrative?: string): NibrsSegments {
    const cloned = JSON.parse(JSON.stringify(mappedData));
    
    cloned.administrative.incidentNumber = cloned.administrative.incidentNumber || 
      `${this.DEFAULT_VALUES.INCIDENT_NUMBER_PREFIX}${Date.now()}`;
    cloned.administrative.clearedExceptionally = cloned.administrative.clearedExceptionally || 
      this.DEFAULT_VALUES.DEFAULT_CLEARED;

    if (narrative && this.wasClearedByArrest(narrative)) {
      cloned.administrative.clearedBy = "A";
      
      if (cloned.arrestees && cloned.arrestees.length > 0) {
        cloned.arrestees.forEach((arrestee: any) => {
          if (!arrestee.clearanceCode) {
            arrestee.clearanceCode = "A";
          }
          // Add offense codes to arrestees
          if (cloned.offenses && cloned.offenses.length > 0 && arrestee.offenseCodes.length === 0) {
            arrestee.offenseCodes = cloned.offenses.map((offense: any) => offense.code);
          }
        });
      }
    }

    if (cloned.offenses && Array.isArray(cloned.offenses)) {
      cloned.offenses = cloned.offenses
        .filter((offense: any) => 
          !offense.description || this.isWithinCurrentIncident(offense.description, narrative || "")
        )
        .map((offense: any, index: number) => ({
          ...offense,
          attemptedCompleted: offense.attemptedCompleted || this.DEFAULT_VALUES.DEFAULT_OFFENSE_ATTEMPTED,
          sequenceNumber: index + 1
        }));
    }

    if (cloned.victims && Array.isArray(cloned.victims)) {
      cloned.victims = cloned.victims
        .filter((victim: any) => 
          !victim.description || this.isWithinCurrentIncident(victim.description, narrative || "")
        )
        .map((victim: any, index: number) => ({
          ...victim,
          type: victim.type || this.DEFAULT_VALUES.DEFAULT_VICTIM_TYPE,
          race: victim.race || this.DEFAULT_VALUES.DEFAULT_RACE,
          sex: victim.sex || this.DEFAULT_VALUES.DEFAULT_SEX,
          ethnicity: victim.ethnicity || this.DEFAULT_VALUES.DEFAULT_ETHNICITY,
          age: victim.age !== undefined && victim.age !== null 
            ? Math.max(0, Math.min(130, Number(victim.age))) 
            : undefined,
          sequenceNumber: index + 1
        }));
    }

    if (cloned.offenders && Array.isArray(cloned.offenders)) {
      cloned.offenders = cloned.offenders
        .filter((offender: any) => 
          !offender.description || this.isWithinCurrentIncident(offender.description, narrative || "")
        )
        .map((offender: any, index: number) => ({
          ...offender,
          race: offender.race || this.DEFAULT_VALUES.DEFAULT_RACE,
          sex: offender.sex || this.DEFAULT_VALUES.DEFAULT_SEX,
          ethnicity: offender.ethnicity || this.DEFAULT_VALUES.DEFAULT_ETHNICITY,
          age: offender.age !== undefined && offender.age !== null 
            ? Math.max(0, Math.min(130, Number(offender.age))) 
            : undefined,
          sequenceNumber: index + 1
        }));
    }

    if (cloned.properties && Array.isArray(cloned.properties)) {
      cloned.properties = cloned.properties
        .filter((property: any) => 
          !property.description || this.isWithinCurrentIncident(property.description, narrative || "")
        )
        .map((property: any, index: number) => ({
          ...property,
          value: property.value !== undefined && property.value !== null 
            ? Math.max(0, Number(property.value)) 
            : undefined,
          sequenceNumber: index + 1,
          seized: property.seized !== undefined ? property.seized : property.descriptionCode === "10"
        }));
    }

    if (cloned.arrestees && Array.isArray(cloned.arrestees)) {
      cloned.arrestees = cloned.arrestees
        .filter((arrestee: any) => 
          this.isWithinCurrentIncident(`arrest ${arrestee.name || ''}`, narrative || "")
        )
        .map((arrestee: any, index: number) => ({
          ...arrestee,
          residentCode: arrestee.residentCode || "U",
          clearanceCode: arrestee.clearanceCode || "A",
          sequenceNumber: index + 1
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

  // Enhanced offense detection for ALL crime types
static mapOffense(description: string | undefined): MappingResult {
  if (!description) return { code: "", confidence: 0, originalInput: description };
  
  const inputLower = description.toLowerCase().trim();
  
  // EXCLUSION: Skip non-offense phrases
  if (this.NON_OFFENSE_PHRASES.some(phrase => new RegExp(phrase, 'i').test(inputLower))) {
    return { code: "", confidence: 0, originalInput: description };
  }
  
  // EXCLUSION: Skip traffic offenses unless DUI
  if (this.isTrafficOffense(description) && !inputLower.includes('dui') && !inputLower.includes('dwi')) {
    return { code: "", confidence: 0, originalInput: description };
  }
  
  // UNIVERSAL OFFENSE DETECTION - ENHANCED FOR ALL CRIME TYPES
  const offensePatterns = [
    // Violent Crimes
    { pattern: /murder|homicide|kill|slay/i, code: "09A" },
    { pattern: /rape|sexual assault|molest/i, code: "11A" },
    { pattern: /robbery|armed robbery|stickup|holdup/i, code: "120" },
    { pattern: /assault|attack|battery|fight|hit|punch/i, code: "13A" },
    { pattern: /threaten|intimidate|menace/i, code: "13C" },
    
    // Property Crimes
    { pattern: /burglary|break in|breaking entering|forced entry/i, code: "220" },
    { pattern: /theft|steal|shoplift|stolen|purse snatch/i, code: "23H" },
    { pattern: /auto theft|car theft|vehicle theft/i, code: "240" },
    { pattern: /arson|set fire|firebomb/i, code: "200" },
    { pattern: /vandalism|graffiti|property damage|destroy property/i, code: "290" },
    
    // Drug/Weapon Crimes
    { pattern: /cocaine|heroin|meth|drug|narcotic|controlled substance/i, code: "35A" },
    { pattern: /sell drug|drug deal|distribute|trafficking/i, code: "35B" },
    { pattern: /weapon|firearm|gun|pistol|rifle|illegal weapon/i, code: "520" },
    
    // White-Collar Crimes
    { pattern: /fraud|scam|defraud|false pretense/i, code: "26A" },
    { pattern: /identity theft|credit card fraud/i, code: "26F" },
    { pattern: /hack|computer crime|unauthorized access/i, code: "26G" },
    
    // Other Crimes
    { pattern: /dui|dwi|driving under influence|driving while intoxicated/i, code: "90D" },
    { pattern: /impaired driving|bac|blood alcohol|breath test|field sobriety/i, code: "90D" },
    { pattern: /intoxicated driving|alcohol level|\.\d+%|point \d+ /i, code: "90D" },
    { pattern: /public intox|drunk in public|disorderly conduct/i, code: "90C" }
  ];

  for (const { pattern, code } of offensePatterns) {
    if (pattern.test(inputLower)) {
      return { code, confidence: 0.9, originalInput: description };
    }
  }
  
  // Fallback to original mapping
  for (const [key, code] of Object.entries(NIBRS_GROUP_A_OFFENSE_CODES)) {
    if (inputLower.includes(key)) {
      return { code, confidence: 0.85, originalInput: description };
    }
  }
  
  for (const [key, code] of Object.entries(NIBRS_GROUP_B_OFFENSE_CODES)) {
    if (inputLower.includes(key)) {
      return { code, confidence: 0.8, originalInput: description };
    }
  }
  
  return { code: "", confidence: 0, originalInput: description };
}

  // In your mapper.ts - Add these methods to the NibrsMapper class

static extractEvidenceDetails(narrative: string): Array<{
  description: string;
  type?: string;
  quantity?: number;
  status?: string;
}> {
  const evidence: Array<{description: string; type?: string; quantity?: number; status?: string}> = [];
  const narrativeLower = narrative.toLowerCase();
  
  // Patterns for evidence detection
  const evidencePatterns = [
    /(firearm|gun|weapon|handgun|pistol|rifle|shotgun)/gi,
    /(drug|narcotic|cocaine|heroin|meth|marijuana|weed)/gi,
    /(knife|blade|weapon)/gi,
    /(bullet|cartridge|ammo|ammunition)/gi,
    /(evidence|logged as evidence|secured|confiscated|seized)/gi
  ];
  
  // Look for evidence mentions
  evidencePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(narrativeLower)) !== null) {
      const evidenceText = match[0];
      
      // Check if this evidence is already captured
      if (!evidence.some(item => item.description.toLowerCase().includes(evidenceText))) {
        evidence.push({
          description: evidenceText.charAt(0).toUpperCase() + evidenceText.slice(1),
          status: "Seized"
        });
      }
    }
  });
  
  // Specific firearm evidence extraction
  if (narrativeLower.includes("firearm") || narrativeLower.includes("gun") || narrativeLower.includes("weapon")) {
    const firearmMatch = narrative.match(/(Smith & Wesson|Glock|Sig Sauer|Colt|Beretta|Ruger|9mm|\.45|\.38|handgun|pistol|rifle|shotgun)/i);
    if (firearmMatch) {
      evidence.push({
        description: `Firearm: ${firearmMatch[0]}`,
        type: "Firearm",
        status: "Seized"
      });
    }
  }
  
  return evidence;
}

static mapEvidenceToProperties(evidence: Array<{description: string; type?: string; quantity?: number; status?: string}>, properties: any[]): any[] {
  const updatedProperties = [...properties];
  
  evidence.forEach(evidenceItem => {
    // Check if this evidence is already in properties
    const existingIndex = updatedProperties.findIndex(prop => 
      prop.description && prop.description.toLowerCase().includes(evidenceItem.description.toLowerCase())
    );
    
    if (existingIndex === -1) {
      // Add evidence as property
      updatedProperties.push({
        description: evidenceItem.description,
        descriptionCode: evidenceItem.type === "Firearm" ? "11" : "34", // Firearm or Other
        lossType: "7", // Seized
        seized: true,
        value: evidenceItem.type === "Firearm" ? 500 : undefined // Default value for firearms
      });
    } else {
      // Update existing property to mark as seized
      updatedProperties[existingIndex] = {
        ...updatedProperties[existingIndex],
        lossType: "7", // Seized
        seized: true
      };
    }
  });
  
  return updatedProperties;
}

  static mapDrugProperty(description: string | undefined): MappingResult {
    if (!description) return { code: "", confidence: 0, originalInput: description };
    
    const inputLower = description.toLowerCase();
    
    // Check for specific drug types first
    for (const [key, code] of Object.entries(NIBRS_DRUG_PROPERTY_CODES)) {
      if (inputLower.includes(key)) {
        return { code, confidence: 0.98, originalInput: description };
      }
    }
    
    // Fall back to general drug code
    if (/drug|narcotic|controlled.substance|white.powder|baggie|rolling.paper/i.test(inputLower)) {
      return { code: "10", confidence: 0.9, originalInput: description };
    }
    
    return { code: "", confidence: 0, originalInput: description };
  }

  static mapProperty(description: string | undefined): MappingResult {
  if (!description) return { code: "", confidence: 0, originalInput: description };
  
  const inputLower = description.toLowerCase();
  
  // UNIVERSAL PROPERTY DETECTION
  const propertyPatterns = [
    { pattern: /cocaine|heroin|meth|drug|narcotic|controlled substance/i, code: "10" },
    { pattern: /firearm|gun|pistol|rifle|handgun|weapon/i, code: "11" },
    { pattern: /vehicle|car|auto|truck|motorcycle/i, code: "08" },
    { pattern: /money|cash|currency|dollar|euro|yen/i, code: "01" },
    { pattern: /jewelry|ring|necklace|watch|diamond|gold/i, code: "02" },
    { pattern: /electronic|computer|laptop|tablet|phone|iphone/i, code: "14" },
    { pattern: /television|tv|stereo|radio|speaker/i, code: "12" },
    { pattern: /tool|equipment|machinery|industrial/i, code: "18" },
    { pattern: /clothing|apparel|shoes|accessory/i, code: "03" },
    { pattern: /document|paper|record|file|certificate/i, code: "26" }
  ];
  
  for (const { pattern, code } of propertyPatterns) {
    if (pattern.test(inputLower)) {
      return { code, confidence: 0.9, originalInput: description };
    }
  }
  
  // Fallback to original mapping
  const result = this.findBestMatch(description, NIBRS_PROPERTY_CODES, "property");
  return result;
}

  static mapLocation(description: string | undefined, offenseCode?: string): MappingResult {
    const inputLower = (description || '').toLowerCase();
    
    // Enhanced location detection
    if (/interstate|highway|freeway|road|street|avenue|route|mile.marker/i.test(inputLower)) {
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
    return result;
  }

  static mapWeapon(description: string | undefined): MappingResult {
    if (!description) return { code: "", confidence: 0, originalInput: description };
    
    const inputLower = description.toLowerCase();
    if (/fist|punch|slap|hand|hit|strike/i.test(inputLower)) {
      return { code: "40", confidence: 0.9, originalInput: description };
    }
    if (/foot|kick|leg/i.test(inputLower)) {
      return { code: "40", confidence: 0.9, originalInput: description };
    }
    
    const result = this.findBestMatch(description, NIBRS_WEAPON_CODES, "weapon");
    return result;
  }

  static mapRelationship(description?: string, narrative?: string | undefined): string {
    if (!description) return "UN";
    const desc = description.toLowerCase().trim();

    if (NIBRS_RELATIONSHIP_CODES[desc]) {
      return NIBRS_RELATIONSHIP_CODES[desc];
    }

    for (const [key, code] of Object.entries(NIBRS_RELATIONSHIP_CODES)) {
      if (desc.includes(key)) {
        return code;
      }
    }

    if (narrative && (desc === "unknown" || desc === "stranger" || desc === "")) {
      const narrativeLower = narrative.toLowerCase();
      if (narrativeLower.includes("known") || narrativeLower.includes("acquaintance")) {
        return "AQ";
      }
      if (narrativeLower.includes("family") || narrativeLower.includes("relative")) {
        return "OF";
      }
    }

    return "UN";
  }

  static mapLossType(description: string | undefined): string {
    if (!description) return "7";
    
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
    
    return "7";
  }

  static assignProfessionalVictims(offenses: any[], extract: DescriptiveExtract): any[] {
  const victims: any[] = [];
  
  // Check for victimless offenses
  const hasVictimless = offenses.some(offense => this.isVictimlessOffense(offense.code));
  const hasVictimBased = offenses.some(offense => !this.isVictimlessOffense(offense.code));
  
  // UNIVERSAL VICTIM ASSIGNMENT LOGIC
  if (hasVictimless) {
    // Add society victim for victimless crimes (drugs, weapons, etc.)
    victims.push({
      type: "S",
      injury: "N",
      sex: "U",
      race: "U",
      ethnicity: "U"
    });
  }
  
  if (hasVictimBased) {
    // Add individual victims for person crimes
    if (extract.victims && extract.victims.length > 0) {
      extract.victims.forEach(v => {
        victims.push({
          type: v.type || "I",
          age: v.age,
          sex: v.sex || "U",
          race: v.race || "U",
          ethnicity: v.ethnicity || "U",
          injury: v.injury || "N"
        });
      });
    } else {
      // Auto-create victims for serious crimes if missing
      const violentOffenses = offenses.filter(offense => 
        ['09A', '11A', '11B', '11C', '11D', '120', '121', '13A'].includes(offense.code)
      );
      
      if (violentOffenses.length > 0) {
        victims.push({
          type: "I",
          injury: "I", // Assume injury for violent crimes
          sex: "U",
          race: "U", 
          ethnicity: "U"
        });
      }
    }
  }
  
  return victims;
}

  static parseIncidentDate(dateString: string | undefined, narrative: string): string {
  if (!dateString) {
    // Try to extract date from narrative as fallback
    const dateMatch = narrative.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/i);
    if (dateMatch) {
      const months: Record<string, string> = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
      };
      
      const month = months[dateMatch[1].toLowerCase()];
      const day = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3];
      
      return `${year}-${month}-${day}`;
    }
    
    // If no date found, use current date as fallback
    return new Date().toISOString().split('T')[0];
  }
  
  return dateString;
}

  static mapDescriptiveToNibrs(extract: DescriptiveExtract): NibrsSegments {
    try {
      // FILTER OUT TRAFFIC OFFENSES first
      const filteredOffenses = (extract.offenses || [])
        .filter(offense => 
          offense.description && 
          !this.isTrafficOffense(offense.description) &&
          this.isWithinCurrentIncident(offense.description, extract.narrative || "")
        )
        .map((offense, index) => {
          const mappedOffense = this.mapOffense(offense.description);
          return {
            code: mappedOffense.code,
            description: offense.description,
            attemptedCompleted: offense.attemptedCompleted || "C",
            sequenceNumber: index + 1,
            mappingConfidence: mappedOffense.confidence
          };
        })
        .filter(offense => offense.code !== "");

      // Filter out Group B offenses unless arrest is mentioned
      const hasArrest = extract.narrative && this.wasClearedByArrest(extract.narrative);
      const finalOffenses = filteredOffenses.filter(offense => {
        const isGroupB = Object.values(NIBRS_GROUP_B_OFFENSE_CODES).includes(offense.code);
        return !isGroupB || hasArrest;
      });

      if (finalOffenses.length === 0) {
        throw new Error("No valid NIBRS offenses identified. Include serious criminal offenses.");
      }

      // Use the first offense for location mapping
      const location = this.mapLocation(extract.locationDescription, finalOffenses[0].code);
      
      const mapped: NibrsSegments = {
  administrative: {
    incidentNumber: extract.incidentNumber || `INC-${Date.now()}`,
    incidentDate: this.parseIncidentDate(extract.incidentDate, extract.narrative || ""),
    incidentTime: extract.incidentTime,
    clearedExceptionally: extract.clearedExceptionally || "N",
    exceptionalClearanceDate: extract.exceptionalClearanceDate
  },
  locationCode: location.code || "13",
  offenses: finalOffenses,
  properties: [],
  victims: [],
  offenders: [],
  arrestees: [],
  narrative: extract.narrative || ""
};

      // PROFESSIONAL VICTIM ASSIGNMENT
      mapped.victims = this.assignProfessionalVictims(finalOffenses, extract);

      // ENHANCED PROPERTY MAPPING WITH DRUG DETAILS
      if (extract.properties && Array.isArray(extract.properties)) {
        mapped.properties = extract.properties
          .filter(prop => 
            prop.propertyDescription &&
            this.isWithinCurrentIncident(prop.propertyDescription, extract.narrative || "")
          )
          .map((prop, index) => {
            const property = this.mapProperty(prop.propertyDescription);
            const lossType = this.mapLossType(prop.lossDescription);
            const isDrug = property.code === "10";
            const drugDetails = isDrug && prop.propertyDescription ? this.extractDrugDetails(prop.propertyDescription) : {};
            
            return {
              descriptionCode: property.code,
              description: prop.propertyDescription || "Unknown", // Ensure description is always a string
              lossType: lossType as "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9", // Narrow type
              value: prop.value ? Math.max(0, Number(prop.value)) : undefined,
              sequenceNumber: index + 1,
              seized: isDrug, // Drugs are always seized
              drugMeasurement: drugDetails.measurement, // Map drug details explicitly
              drugQuantity: drugDetails.quantity
            };
          });
      }

      // Map offender data with context checking
      if (extract.offenders && Array.isArray(extract.offenders)) {
        mapped.offenders = extract.offenders
          .filter(offender => 
            this.isWithinCurrentIncident(offender.relationshipDescription || '', extract.narrative || "")
          )
          .map((offender, index) => {
            const result: any = { ...offender };
            
            if (offender.relationshipDescription) {
              const relationship = this.mapRelationship(offender.relationshipDescription, extract.narrative);
              if (relationship) {
                result.relationshipToVictim = relationship;
              }
            }
            
            if (result.sex && !["M", "F", "U"].includes(result.sex)) {
              result.sex = "U";
            }
            
            return {
              ...result,
              sequenceNumber: index + 1
            };
          });
      }

      // Extract arrestees if arrest occurred
      if (extract.narrative && mapped.offenders) {
        mapped.arrestees = this.extractArrestees(extract.narrative, mapped.offenders);
        
        if (mapped.arrestees.length > 0) {
          mapped.administrative.clearedBy = "A";
          mapped.administrative.clearedExceptionally = "N";
          
          // Add offense codes to arrestees
          mapped.arrestees.forEach(arrestee => {
            arrestee.offenseCodes = finalOffenses.map(offense => offense.code);
          });
        }
      }

      // Enhanced clearance detection
      if (!mapped.administrative.clearedBy && extract.narrative) {
        const narrativeLower = extract.narrative.toLowerCase();
        if (narrativeLower.includes('citation') || narrativeLower.includes('cited') || 
            narrativeLower.includes('violation') || narrativeLower.includes('summons')) {
          mapped.administrative.clearedBy = "A";
        }
      }

      // Add missing required fields with defaults
      return this.addMissingRequiredFields(mapped, extract.narrative);

    } catch (error) {
      console.error("[MAPPER] Professional mapping error:", error);
      if (error instanceof Error) {
        throw new Error(`NIBRS Mapping Failed: ${error.message}`);
      } else {
        throw new Error("NIBRS Mapping Failed: Unknown error");
      }
    }
  }

  static validateAndMapExtract(extract: DescriptiveExtract): {
    data: any;
    errors: string[];
    warnings: string[];
    missingFields: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];
    
    console.log("[MAPPER] Starting validateAndMapExtract");
    
    try {
      const mapped = this.mapDescriptiveToNibrs(extract);
      
      if (!mapped.administrative.incidentDate || isNaN(Date.parse(mapped.administrative.incidentDate))) {
        errors.push("Invalid incident date");
        missingFields.push("Incident Date");
      }
      
      if (!mapped.offenses || mapped.offenses.length === 0) {
        errors.push("No valid offenses found");
        missingFields.push("Offense Description");
      } else {
        for (const offense of mapped.offenses) {
          if (!offense.code || !Object.values(NIBRS_OFFENSE_CODES).includes(offense.code)) {
            errors.push(`Invalid offense code: ${offense.code}`);
            warnings.push(`Offense code ${offense.code} may not be standard NIBRS`);
          }
        }
      }
      
      if (!mapped.locationCode || !Object.values(NIBRS_LOCATION_CODES).includes(mapped.locationCode)) {
        warnings.push(`Location code ${mapped.locationCode} may not be standard NIBRS`);
      }
      
      // Validate arrestees if present
      if (mapped.arrestees && mapped.arrestees.length > 0) {
        // Group A offenses must have arrestee segments if cleared by arrest
        const isGroupA = mapped.offenses.some((offense: any) => 
          ['09A', '11A', '120', '121', '13A', '13B', '220', '240', '200'].includes(offense.code)
        );
        
        if (isGroupA && mapped.administrative.clearedBy === "A" && mapped.arrestees.length === 0) {
          warnings.push("Group A offense cleared by arrest should include arrestee segments");
        }
        
        // Validate each arrestee
        mapped.arrestees.forEach((arrestee: any) => {
          if (!arrestee.arrestDate) {
            errors.push("Arrestee missing arrest date");
            missingFields.push("Arrest Date");
          }
          if (!['O', 'S', 'T'].includes(arrestee.arrestType)) {
            errors.push("Invalid arrest type");
          }
        });
      }

      if (mapped.offenses) {
        mapped.offenses.forEach((offense: any, index: number) => {
          if (offense.mappingConfidence < 0.5) {
            warnings.push(`Low confidence in offense mapping: ${offense.code} (confidence: ${offense.mappingConfidence})`);
          }
        });
      }
      
      console.log("[MAPPER] Validation results:", { errors, warnings });
      
      return { data: mapped, errors, warnings, missingFields };

    } catch (error: any) {
      console.error("[MAPPER] Error during validation:", error);
      return {
        data: {},
        errors: [error.message || "Mapping validation failed"],
        warnings: ["Please check your input and try again"],
        missingFields: []
      };
    }
  }
}