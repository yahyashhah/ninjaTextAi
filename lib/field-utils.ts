// lib/field-utils.ts - ENHANCED VERSION

// Define types for our field examples
type FieldCategory = 'victim' | 'location' | 'offender' | 'weapon' | 'property' | 'injuries' | 'evidence' | 'substance' | 'circumstances' | 'time' | 'arrest';

type OffenseCategory = 
  | 'Homicide' 
  | 'Sex Offenses' 
  | 'Theft' 
  | 'Assault' 
  | 'Robbery' 
  | 'Burglary' 
  | 'Arson' 
  | 'Fraud' 
  | 'Drugs' 
  | 'Weapons'
  | 'Motor Vehicle Theft';

interface FieldExamples {
  victim: Record<OffenseCategory, string>;
  location: Record<OffenseCategory, string>;
  offender: Record<OffenseCategory, string>;
  weapon: Record<OffenseCategory, string>;
  property: Record<OffenseCategory, string>;
  injuries: Record<OffenseCategory, string>;
  evidence: Record<OffenseCategory, string>;
  substance: Record<OffenseCategory, string>;
  circumstances: Record<OffenseCategory, string>;
  time: Record<OffenseCategory, string>;
  arrest: Record<OffenseCategory, string>;
}

// COMPREHENSIVE FIELD EXAMPLES
export const FIELD_EXAMPLES: FieldExamples = {
  victim: {
    Homicide: "Adult male victim, 35 years old, multiple gunshot wounds to chest",
    "Sex Offenses": "Female victim, 28 years old, transported to hospital for examination",
    Theft: "Business owner victim, reported theft during business hours",
    Assault: "Victim sustained facial injuries and was treated at scene",
    Robbery: "Victim was approached from behind and threatened with weapon",
    Burglary: "Homeowner returned to discover property missing",
    Arson: "Property owner reported fire damage to structure",
    Fraud: "Elderly victim disclosed unauthorized credit card charges",
    Drugs: "Undercover officer made contact with suspect",
    Weapons: "Bystander witnessed suspect brandishing firearm",
    "Motor Vehicle Theft": "Vehicle owner reported theft from parking location"
  },
  location: {
    Homicide: "Residence at 123 Main St, crime scene secured by first responders",
    "Sex Offenses": "Parking lot of shopping mall, poorly lit area near dumpsters",
    Theft: "Retail store located at 456 Oak Avenue, front entrance",
    Assault: "Public park near playground area, multiple witnesses present",
    Robbery: "ATM location at 789 Bank Street, well-lit area",
    Burglary: "Single-family residence, rear window forced open",
    Arson: "Commercial building, storage area in basement",
    Fraud: "Online transaction, victim's home computer",
    Drugs: "Vehicle stopped on highway, driver side window",
    Weapons: "School parking lot during dismissal time",
    "Motor Vehicle Theft": "Parking garage at downtown shopping center"
  },
  offender: {
    Homicide: "White male, approximately 6 feet tall, wearing dark clothing",
    "Sex Offenses": "Unknown male suspect, medium build, masked face",
    Theft: "Two suspects working together, one acting as lookout",
    Assault: "Known acquaintance of victim, previous altercations",
    Robbery: "Armed suspect demanding property from victim",
    Burglary: "Unknown suspect, no witnesses observed entry",
    Arson: "Disgruntled former employee suspected",
    Fraud: "Organized group using stolen identities",
    Drugs: "Repeat offender with prior narcotics charges",
    Weapons: "Juvenile suspect in possession of firearm",
    "Motor Vehicle Theft": "Unknown suspect, no witnesses to theft"
  },
  weapon: {
    Homicide: "Semi-automatic handgun, 9mm caliber",
    "Sex Offenses": "Physical force and intimidation used",
    Assault: "Brass knuckles used to strike victim",
    Robbery: "Knife displayed during demand for property",
    Burglary: "Crowbar used to force window open",
    Arson: "Accelerant and ignition device used",
    Weapons: "Illegally modified firearm with serial number removed",
    Theft: "No weapon used in commission of theft",
    Fraud: "No weapon involved in fraudulent activity",
    Drugs: "No weapon present during drug transaction",
    "Motor Vehicle Theft": "No weapon used in vehicle theft"
  },
  property: {
    Theft: "Laptop computer valued at $1200, jewelry worth $500",
    Robbery: "Wallet containing $150 cash and credit cards",
    Burglary: "Electronics and cash totaling $2500 in value",
    "Motor Vehicle Theft": "2022 Honda Civic, license plate ABC123",
    Homicide: "No property stolen during homicide incident",
    "Sex Offenses": "No property taken during assault",
    Assault: "Personal items taken during altercation",
    Arson: "Property destroyed by fire, estimated loss $50,000",
    Fraud: "Unauthorized electronic funds transfer of $5,000",
    Drugs: "Currency used in drug transaction seized as evidence",
    Weapons: "No property stolen during weapons offense"
  },
  injuries: {
    Homicide: "Multiple gunshot wounds, pronounced dead at scene",
    Assault: "Bruising and lacerations to face and arms",
    Robbery: "Minor abrasions from struggle over property",
    "Sex Offenses": "Physical trauma requiring medical examination",
    Burglary: "No injuries reported during burglary",
    Theft: "No injuries sustained during theft",
    Arson: "No injuries reported from fire incident",
    Fraud: "No physical injuries from fraudulent activity",
    Drugs: "No injuries during drug offense",
    Weapons: "No injuries from weapons violation",
    "Motor Vehicle Theft": "No injuries during vehicle theft"
  },
  evidence: {
    Homicide: "Ballistics evidence, DNA samples, surveillance footage",
    Burglary: "Fingerprints on point of entry, stolen property recovered",
    Drugs: "Controlled substances, paraphernalia, currency",
    Fraud: "Documentation of fraudulent transactions, witness statements",
    "Sex Offenses": "Medical examination results, clothing evidence",
    Assault: "Photographs of injuries, witness statements",
    Robbery: "Surveillance footage, recovered property",
    Theft: "Security camera footage, stolen property description",
    Arson: "Accelerant samples, fire pattern analysis",
    Weapons: "Firearm recovered, ballistic testing required",
    "Motor Vehicle Theft": "Vehicle description, license plate information"
  },
  substance: {
    Drugs: "Marijuana, approximately 28 grams in plastic baggies",
    Homicide: "No controlled substances involved",
    "Sex Offenses": "No controlled substances involved",
    Theft: "No controlled substances involved",
    Assault: "No controlled substances involved",
    Robbery: "No controlled substances involved",
    Burglary: "No controlled substances involved",
    Arson: "No controlled substances involved",
    Fraud: "No controlled substances involved",
    Weapons: "No controlled substances involved",
    "Motor Vehicle Theft": "No controlled substances involved"
  },
  circumstances: {
    Drugs: "Discovered during routine traffic stop, odor of marijuana present",
    Homicide: "Domestic dispute escalated to physical violence",
    "Sex Offenses": "Victim was walking alone when approached by suspect",
    Theft: "Suspect entered store and concealed merchandise",
    Assault: "Bar fight that started over disputed tab",
    Robbery: "Victim was using ATM when approached from behind",
    Burglary: "Forced entry through rear window while residents were away",
    Arson: "Multiple points of origin indicating intentional setting",
    Fraud: "Phishing email led to unauthorized account access",
    Weapons: "Subject was found in possession during pat-down",
    "Motor Vehicle Theft": "Vehicle was left running and unattended"
  },
  time: {
    Homicide: "Incident occurred between 2200 and 2300 hours",
    "Sex Offenses": "Assault occurred around 0200 hours",
    Theft: "Theft occurred during business hours, approximately 1400 hours",
    Assault: "Altercation took place around 2100 hours",
    Robbery: "Robbery occurred at approximately 1930 hours",
    Burglary: "Burglary likely occurred between 0900-1700 hours",
    Arson: "Fire reported at 0345 hours",
    Fraud: "Unauthorized transactions occurred over past 72 hours",
    Drugs: "Incident occurred at 1515 hours during traffic stop",
    Weapons: "Weapon discovered at 1120 hours",
    "Motor Vehicle Theft": "Vehicle was stolen overnight between 0200-0600 hours"
  },
  arrest: {
    Drugs: "Subject taken into custody without incident, Miranda rights read",
    Homicide: "Suspect arrested at scene after brief standoff",
    "Sex Offenses": "Suspect arrested based on victim identification",
    Theft: "Subject arrested after attempting to flee from officers",
    Assault: "Primary aggressor arrested at scene after witness statements",
    Robbery: "Suspect arrested following foot pursuit",
    Burglary: "Subject arrested based on forensic evidence match",
    Arson: "Suspect arrested after fire investigation",
    Fraud: "Subject arrested following financial investigation",
    Weapons: "Subject arrested for unlawful possession",
    "Motor Vehicle Theft": "Suspect arrested while driving stolen vehicle"
  }
};

// COMPREHENSIVE FIELD MAPPING
const FIELD_MAPPINGS: Record<string, FieldCategory> = {
  // Victim fields
  'victim': 'victim',
  'victiminfo': 'victim',
  'victiminformation': 'victim',
  'complainant': 'victim',
  
  // Location fields
  'location': 'location',
  'scene': 'location',
  'address': 'location',
  'premises': 'location',
  
  // Offender fields
  'offender': 'offender',
  'suspect': 'offender',
  'perpetrator': 'offender',
  'subject': 'offender',
  'actor': 'offender',
  
  // Weapon fields
  'weapon': 'weapon',
  'firearm': 'weapon',
  'gun': 'weapon',
  'knife': 'weapon',
  
  // Property fields
  'property': 'property',
  'stolen': 'property',
  'items': 'property',
  'valuables': 'property',
  'merchandise': 'property',
  'vehicle': 'property',
  
  // Injury fields
  'injuries': 'injuries',
  'injury': 'injuries',
  'wounds': 'injuries',
  'trauma': 'injuries',
  'medical': 'injuries',
  
  // Evidence fields
  'evidence': 'evidence',
  'forensic': 'evidence',
  'recovered': 'evidence',
  'collected': 'evidence',
  'documents': 'evidence',
  
  // Substance fields
  'substance': 'substance',
  'drug': 'substance',
  'narcotic': 'substance',
  'controlled': 'substance',
  'quantity': 'substance',
  'amount': 'substance',
  'weight': 'substance',
  
  // Circumstance fields
  'circumstances': 'circumstances',
  'situation': 'circumstances',
  'context': 'circumstances',
  'background': 'circumstances',
  'events': 'circumstances',
  
  // Time fields
  'time': 'time',
  'date': 'time',
  'when': 'time',
  'occurred': 'time',
  'timeline': 'time',
  
  // Arrest fields
  'arrest': 'arrest',
  'custody': 'arrest',
  'detention': 'arrest',
  'booking': 'arrest'
};

// QUICK FILL OPTIONS FOR EACH FIELD TYPE
export const QUICK_FILL_OPTIONS: Record<FieldCategory, string[]> = {
  victim: [
    "Adult male victim, approximately 30-40 years old",
    "Female victim, minor injuries sustained",
    "Elderly victim, shaken but not injured",
    "Juvenile victim, parent/guardian present"
  ],
  location: [
    "Residential address at the scene",
    "Commercial establishment location",
    "Public street or roadway",
    "Parking lot or garage area"
  ],
  offender: [
    "Adult male suspect, approximately 30-40 years old",
    "Suspect fled the scene before officers arrived",
    "Multiple suspects working together",
    "Known to victim from previous encounters"
  ],
  weapon: [
    "No weapon used in commission of offense",
    "Firearm displayed but not discharged",
    "Edged weapon used to threaten victim",
    "Physical force only, no weapons involved"
  ],
  property: [
    "Personal electronics and valuables",
    "Currency and identification documents",
    "Vehicle or automotive parts",
    "No property taken during incident"
  ],
  injuries: [
    "No visible injuries sustained",
    "Minor abrasions and bruising",
    "Serious injuries requiring medical attention",
    "Fatal injuries, pronounced at scene"
  ],
  evidence: [
    "Photographic documentation completed",
    "Witness statements collected",
    "Forensic evidence recovered from scene",
    "Surveillance footage obtained"
  ],
  substance: [
    "Suspected controlled substance, field tested positive",
    "Prescription medication without valid prescription",
    "Marijuana, approximately personal use quantity",
    "No controlled substances located"
  ],
  circumstances: [
    "Discovered during routine traffic stop",
    "Found during execution of search warrant",
    "Reported by victim/witness at scene",
    "Observed by officer during patrol"
  ],
  time: [
    "Incident occurred within the past 24 hours",
    "Exact time is currently being verified",
    "Occurred during daylight/business hours",
    "Occurred overnight/after dark"
  ],
  arrest: [
    "Subject taken into custody without incident",
    "Arrest made based on probable cause",
    "Subject released pending further investigation",
    "Warrant application in process"
  ]
};

// IMPROVED FIELD DETECTION FUNCTION
export function getFieldExamples(field: string, category: string): string {
  const fieldLower = field.toLowerCase().trim();
  
  // Find the best matching field category
  let fieldKey: FieldCategory = 'victim'; // default
  
  for (const [keyword, mappedCategory] of Object.entries(FIELD_MAPPINGS)) {
    if (fieldLower.includes(keyword)) {
      fieldKey = mappedCategory;
      break;
    }
  }
  
  // Special handling for common field variations
  if (fieldLower.includes('substance') || fieldLower.includes('drug') || fieldLower.includes('narcotic')) {
    fieldKey = 'substance';
  } else if (fieldLower.includes('quantity') || fieldLower.includes('amount') || fieldLower.includes('weight')) {
    fieldKey = 'substance';
  } else if (fieldLower.includes('circumstance') || fieldLower.includes('situation') || fieldLower.includes('context')) {
    fieldKey = 'circumstances';
  } else if (fieldLower.includes('time') || fieldLower.includes('date') || fieldLower.includes('when')) {
    fieldKey = 'time';
  } else if (fieldLower.includes('arrest') || fieldLower.includes('custody') || fieldLower.includes('detention')) {
    fieldKey = 'arrest';
  }
  
  // Get the example for this field category and offense category
  const categoryExamples = FIELD_EXAMPLES[fieldKey];
  const example = categoryExamples[category as OffenseCategory];
  
  return example || `Provide specific details about ${field.toLowerCase()}`;
}

// GET QUICK FILL OPTIONS FOR A FIELD
export function getQuickFillOptions(field: string): string[] {
  const fieldLower = field.toLowerCase().trim();
  
  // Find the best matching field category
  let fieldKey: FieldCategory = 'victim'; // default
  
  for (const [keyword, mappedCategory] of Object.entries(FIELD_MAPPINGS)) {
    if (fieldLower.includes(keyword)) {
      fieldKey = mappedCategory;
      break;
    }
  }
  
  // Special handling
  if (fieldLower.includes('substance') || fieldLower.includes('drug') || fieldLower.includes('narcotic')) {
    fieldKey = 'substance';
  } else if (fieldLower.includes('quantity') || fieldLower.includes('amount') || fieldLower.includes('weight')) {
    fieldKey = 'substance';
  } else if (fieldLower.includes('circumstance') || fieldLower.includes('situation')) {
    fieldKey = 'circumstances';
  } else if (fieldLower.includes('time') || fieldLower.includes('date')) {
    fieldKey = 'time';
  } else if (fieldLower.includes('arrest') || fieldLower.includes('custody')) {
    fieldKey = 'arrest';
  }
  
  return QUICK_FILL_OPTIONS[fieldKey] || [
    "Specific details to be documented",
    "Information currently being verified"
  ];
}

// Enhanced categorization
export function enhanceCategorizedFields(categorizedFields: any, offense: any) {
  const criticalFields = offense.requiredFields.filter((field: string) => 
    offense.fieldDefinitions[field]?.required === true
  );
  
  const importantFields = offense.requiredFields.filter((field: string) => 
    !criticalFields.includes(field)
  );

  return {
    ...categorizedFields,
    offenseSpecific: {
      critical: criticalFields,
      important: importantFields,
      contextual: getContextualFields(offense)
    },
    completionPriority: [
      ...criticalFields,
      ...importantFields,
      ...(categorizedFields.other || [])
    ]
  };
}

function getContextualFields(offense: any) {
  const contextualMap: { [key: string]: string[] } = {
    "Homicide": ["timeOfDeath", "motive", "crimeScene", "witnesses", "weaponRecovery"],
    "Sex Offenses": ["consent", "relationship", "locationType", "medicalEvidence", "digitalEvidence"],
    "Theft": ["propertyValue", "entryMethod", "security", "witnesses", "recovery"],
    "Assault": ["provocation", "selfDefense", "weaponUsed", "medicalTreatment", "witnesses"],
    "Robbery": ["weaponDisplay", "threats", "escapeRoute", "witnesses", "propertyRecovered"],
    "Burglary": ["entryPoint", "timeframe", "propertyTaken", "forensicEvidence", "suspectInfo"],
    "Drugs": ["substanceType", "quantity", "packaging", "transactionType", "buyerInfo"],
    "Weapons": ["weaponType", "possession", "intent", "locationContext", "criminalHistory"],
    "Arson": ["accelerant", "ignitionSource", "firePattern", "motive", "witnesses"],
    "Fraud": ["method", "documentation", "financialLoss", "perpetratorIdentity", "digitalEvidence"],
    "Motor Vehicle Theft": ["vehicleDescription", "theftMethod", "recoveryStatus", "witnesses", "surveillance"]
  };
  
  return contextualMap[offense.category] || [];
}

export function calculateValidationConfidence(
  presentFields: string[], 
  missingFields: string[], 
  offense: any
): {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'COMPLETE';
  message: string;
  color: string;
} {
  const totalFields = presentFields.length + missingFields.length;
  if (totalFields === 0) {
    return { score: 0, level: 'LOW', message: 'No fields to validate', color: 'red' };
  }
  
  const completionRatio = presentFields.length / totalFields;
  
  // Weight critical fields higher
  const criticalFields = offense.requiredFields.filter((field: string) => 
    offense.fieldDefinitions[field]?.required === true
  );
  
  const criticalPresent = criticalFields.filter((field: string) => 
    presentFields.includes(field)
  ).length;
  
  const criticalScore = criticalFields.length > 0 ? criticalPresent / criticalFields.length : 1;
  const overallScore = (completionRatio + criticalScore) / 2;
  
  let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'COMPLETE';
  let message: string;
  let color: string;
  
  if (overallScore >= 0.9 && missingFields.length === 0) {
    level = 'COMPLETE';
    message = 'Report contains all required information';
    color = 'green';
  } else if (overallScore >= 0.7) {
    level = 'HIGH';
    message = 'Most critical information provided';
    color = 'blue';
  } else if (overallScore >= 0.4) {
    level = 'MEDIUM';
    message = 'Some important details missing';
    color = 'orange';
  } else {
    level = 'LOW';
    message = 'Critical information missing';
    color = 'red';
  }
  
  return { score: overallScore, level, message, color };
}