// lib/offenses/groupAOffenses.ts
export interface OffenseType {
  id: string;
  name: string;
  code: string;
  category: string;
  nibrsCode: string;
  description: string;
  isGroupA: boolean;
  requiredFields: string[];
  fieldDefinitions: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export const GROUP_A_OFFENSES: OffenseType[] = [
  // ========== HOMICIDE OFFENSES ==========
  {
    id: "09A",
    name: "Murder/Non-negligent Manslaughter",
    code: "09A",
    category: "Homicide",
    nibrsCode: "09A",
    description: "The willful killing of one human being by another",
    isGroupA: true,
    severity: "CRITICAL",
    requiredFields: ["victim", "offender", "weapon", "location", "time", "date", "motive", "injuries", "evidence"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Complete victim demographics and identification", required: true },
      offender: { label: "Offender Information", description: "Suspect description and identification", required: true },
      weapon: { label: "Weapon Used", description: "Type of weapon and how it was used", required: true },
      location: { label: "Crime Scene", description: "Detailed location description", required: true },
      time: { label: "Time of Incident", description: "When the homicide occurred", required: true },
      date: { label: "Date of Incident", description: "Date the homicide occurred", required: true },
      motive: { label: "Apparent Motive", description: "Reason for the homicide", required: true },
      injuries: { label: "Injuries Sustained", description: "Detailed description of injuries", required: true },
      evidence: { label: "Evidence Collected", description: "Physical evidence and documentation", required: true }
    }
  },
  {
    id: "09B",
    name: "Negligent Manslaughter",
    code: "09B",
    category: "Homicide",
    nibrsCode: "09B",
    description: "The killing of another person through gross negligence",
    isGroupA: true,
    severity: "HIGH",
    requiredFields: ["victim", "circumstances", "location", "time", "date", "negligence"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Complete victim demographics", required: true },
      circumstances: { label: "Circumstances", description: "How the negligence occurred", required: true },
      location: { label: "Incident Location", description: "Where the incident occurred", required: true },
      time: { label: "Time of Incident", description: "When the incident occurred", required: true },
      date: { label: "Date of Incident", description: "Date the incident occurred", required: true },
      negligence: { label: "Nature of Negligence", description: "Specific negligent actions", required: true }
    }
  },
  {
    id: "09C",
    name: "Justifiable Homicide",
    code: "09C",
    category: "Homicide",
    nibrsCode: "09C",
    description: "The killing of a felon by a peace officer in the line of duty",
    isGroupA: true,
    severity: "CRITICAL",
    requiredFields: ["officer", "suspect", "circumstances", "weapon", "location", "justification"],
    fieldDefinitions: {
      officer: { label: "Officer Information", description: "Officer details and assignment", required: true },
      suspect: { label: "Suspect Information", description: "Deceased suspect details", required: true },
      circumstances: { label: "Circumstances", description: "Events leading to the shooting", required: true },
      weapon: { label: "Weapon Used", description: "Officer and suspect weapons", required: true },
      location: { label: "Incident Location", description: "Where the incident occurred", required: true },
      justification: { label: "Justification", description: "Legal justification for use of force", required: true }
    }
  },

  // ========== SEX OFFENSES ==========
  {
    id: "11A",
    name: "Rape",
    code: "11A",
    category: "Sex Offenses",
    nibrsCode: "11A",
    description: "The carnal knowledge of a person forcibly and/or against that person's will",
    isGroupA: true,
    severity: "CRITICAL",
    requiredFields: ["victim", "offender", "location", "time", "force", "medical", "evidence"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Victim demographics and statement", required: true },
      offender: { label: "Offender Description", description: "Suspect physical description", required: true },
      location: { label: "Incident Location", description: "Where the assault occurred", required: true },
      time: { label: "Time of Incident", description: "When the assault occurred", required: true },
      force: { label: "Force Used", description: "Type of force or coercion", required: true },
      medical: { label: "Medical Attention", description: "Medical examination results", required: true },
      evidence: { label: "Evidence Collected", description: "Physical evidence obtained", required: true }
    }
  },
  {
    id: "11B",
    name: "Sodomy",
    code: "11B",
    category: "Sex Offenses",
    nibrsCode: "11B",
    description: "Oral or anal sexual intercourse with another person forcibly and/or against that person's will",
    isGroupA: true,
    severity: "CRITICAL",
    requiredFields: ["victim", "offender", "location", "time", "force", "medical"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Victim demographics and statement", required: true },
      offender: { label: "Offender Description", description: "Suspect physical description", required: true },
      location: { label: "Incident Location", description: "Where the assault occurred", required: true },
      time: { label: "Time of Incident", description: "When the assault occurred", required: true },
      force: { label: "Force Used", description: "Type of force or coercion", required: true },
      medical: { label: "Medical Attention", description: "Medical examination results", required: true }
    }
  },
  {
    id: "11C",
    name: "Sexual Assault With An Object",
    code: "11C",
    category: "Sex Offenses",
    nibrsCode: "11C",
    description: "To use an object or instrument to unlawfully penetrate, however slightly, the genital or anal opening of the body of another person",
    isGroupA: true,
    severity: "CRITICAL",
    requiredFields: ["victim", "offender", "object", "location", "time", "medical"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Victim demographics and statement", required: true },
      offender: { label: "Offender Description", description: "Suspect physical description", required: true },
      object: { label: "Object Used", description: "Description of the object used", required: true },
      location: { label: "Incident Location", description: "Where the assault occurred", required: true },
      time: { label: "Time of Incident", description: "When the assault occurred", required: true },
      medical: { label: "Medical Attention", description: "Medical examination results", required: true }
    }
  },
  {
    id: "11D",
    name: "Fondling",
    code: "11D",
    category: "Sex Offenses",
    nibrsCode: "11D",
    description: "The touching of the private body parts of another person for the purpose of sexual gratification",
    isGroupA: true,
    severity: "HIGH",
    requiredFields: ["victim", "offender", "location", "time", "circumstances"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Victim demographics and statement", required: true },
      offender: { label: "Offender Description", description: "Suspect physical description", required: true },
      location: { label: "Incident Location", description: "Where the incident occurred", required: true },
      time: { label: "Time of Incident", description: "When the incident occurred", required: true },
      circumstances: { label: "Circumstances", description: "How the incident occurred", required: true }
    }
  },

  // ========== ROBBERY ==========
  {
    id: "120",
    name: "Robbery",
    code: "120",
    category: "Robbery",
    nibrsCode: "120",
    description: "The taking or attempting to take anything of value from another person by force or threat of force",
    isGroupA: true,
    severity: "HIGH",
    requiredFields: ["victim", "offender", "propertyTaken", "location", "time", "force"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Victim demographics and statement", required: true },
      offender: { label: "Offender Description", description: "Suspect physical description", required: true },
      propertyTaken: { label: "Property Taken", description: "Items stolen and their value", required: true },
      location: { label: "Incident Location", description: "Where the robbery occurred", required: true },
      time: { label: "Time of Incident", description: "When the robbery occurred", required: true },
      force: { label: "Force/Threat Used", description: "Type of force or threat", required: true }
    }
  },

  // ========== ASSAULT OFFENSES ==========
  {
    id: "13A",
    name: "Aggravated Assault",
    code: "13A",
    category: "Assault",
    nibrsCode: "13A",
    description: "An unlawful attack by one person upon another for the purpose of inflicting severe or aggravated bodily injury",
    isGroupA: true,
    severity: "HIGH",
    requiredFields: ["victim", "offender", "weapon", "injuries", "location", "time"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Victim demographics and injuries", required: true },
      offender: { label: "Offender Description", description: "Suspect physical description", required: true },
      weapon: { label: "Weapon Used", description: "Type of weapon employed", required: true },
      injuries: { label: "Injuries Sustained", description: "Nature and extent of injuries", required: true },
      location: { label: "Incident Location", description: "Where the assault occurred", required: true },
      time: { label: "Time of Incident", description: "When the assault occurred", required: true }
    }
  },
  {
    id: "13B",
    name: "Simple Assault",
    code: "13B",
    category: "Assault",
    nibrsCode: "13B",
    description: "An unlawful physical attack by one person upon another where neither the offender displays a weapon nor the victim suffers obvious severe or aggravated bodily injury",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["victim", "offender", "location", "time", "circumstances"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Victim demographics", required: true },
      offender: { label: "Offender Description", description: "Suspect physical description", required: true },
      location: { label: "Incident Location", description: "Where the assault occurred", required: true },
      time: { label: "Time of Incident", description: "When the assault occurred", required: true },
      circumstances: { label: "Circumstances", description: "How the assault occurred", required: true }
    }
  },
  {
    id: "13C",
    name: "Intimidation",
    code: "13C",
    category: "Assault",
    nibrsCode: "13C",
    description: "To unlawfully place another person in reasonable fear of bodily harm through the use of threatening words and/or other conduct",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["victim", "offender", "threat", "location", "time"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Victim demographics and statement", required: true },
      offender: { label: "Offender Description", description: "Suspect physical description", required: true },
      threat: { label: "Threat Made", description: "Specific threats communicated", required: true },
      location: { label: "Incident Location", description: "Where the intimidation occurred", required: true },
      time: { label: "Time of Incident", description: "When the intimidation occurred", required: true }
    }
  },

  // ========== BURGLARY/BREAKING & ENTERING ==========
  {
    id: "220",
    name: "Burglary/Breaking & Entering",
    code: "220",
    category: "Burglary",
    nibrsCode: "220",
    description: "The unlawful entry of a structure to commit a felony or theft",
    isGroupA: true,
    severity: "HIGH",
    requiredFields: ["location", "entryMethod", "propertyStolen", "time", "date", "premises"],
    fieldDefinitions: {
      location: { label: "Location Address", description: "Complete address of burglarized property", required: true },
      entryMethod: { label: "Method of Entry", description: "How entry was gained", required: true },
      propertyStolen: { label: "Property Stolen", description: "Itemized list of stolen items", required: true },
      time: { label: "Time of Incident", description: "When burglary likely occurred", required: true },
      date: { label: "Date of Incident", description: "Date burglary occurred", required: true },
      premises: { label: "Type of Premises", description: "Residence, business, etc.", required: true }
    }
  },

  // ========== THEFT OFFENSES ==========
  {
    id: "23A",
    name: "Pocket-picking",
    code: "23A",
    category: "Theft",
    nibrsCode: "23A",
    description: "The theft of articles from another person's physical possession by stealth where the victim is unaware of the theft at the time",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["victim", "propertyStolen", "location", "time", "value"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Victim demographics", required: true },
      propertyStolen: { label: "Property Stolen", description: "Items taken and their value", required: true },
      location: { label: "Incident Location", description: "Where the theft occurred", required: true },
      time: { label: "Time of Incident", description: "When the theft occurred", required: true },
      value: { label: "Property Value", description: "Estimated value of stolen property", required: true }
    }
  },
  {
    id: "23B",
    name: "Purse-snatching",
    code: "23B",
    category: "Theft",
    nibrsCode: "23B",
    description: "The grabbing or snatching of a purse, handbag, etc., from the physical possession of another person",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["victim", "propertyStolen", "location", "time", "force"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Victim demographics and statement", required: true },
      propertyStolen: { label: "Property Stolen", description: "Items taken and their value", required: true },
      location: { label: "Incident Location", description: "Where the theft occurred", required: true },
      time: { label: "Time of Incident", description: "When the theft occurred", required: true },
      force: { label: "Force Used", description: "Amount of force employed", required: true }
    }
  },
  {
    id: "23C",
    name: "Shoplifting",
    code: "23C",
    category: "Theft",
    nibrsCode: "23C",
    description: "The theft by someone other than an employee of the merchant of goods or merchandise exposed for sale",
    isGroupA: true,
    severity: "LOW",
    requiredFields: ["suspect", "propertyStolen", "location", "time", "value"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect description and actions", required: true },
      propertyStolen: { label: "Property Stolen", description: "Items taken and their value", required: true },
      location: { label: "Business Location", description: "Store name and address", required: true },
      time: { label: "Time of Incident", description: "When the theft occurred", required: true },
      value: { label: "Property Value", description: "Estimated value of stolen property", required: true }
    }
  },
  {
    id: "23D",
    name: "Theft From Building",
    code: "23D",
    category: "Theft",
    nibrsCode: "23D",
    description: "A theft from within a building which is either open to the general public or where the offender has legal access",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["propertyStolen", "location", "time", "date", "access"],
    fieldDefinitions: {
      propertyStolen: { label: "Property Stolen", description: "Items taken and their value", required: true },
      location: { label: "Building Location", description: "Building name and address", required: true },
      time: { label: "Time of Incident", description: "When the theft occurred", required: true },
      date: { label: "Date of Incident", description: "Date the theft occurred", required: true },
      access: { label: "Access Method", description: "How access was gained", required: true }
    }
  },
  {
    id: "23E",
    name: "Theft From Motor Vehicle",
    code: "23E",
    category: "Theft",
    nibrsCode: "23E",
    description: "The theft of articles from a motor vehicle, whether locked or unlocked",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["vehicle", "propertyStolen", "location", "time", "entry"],
    fieldDefinitions: {
      vehicle: { label: "Vehicle Information", description: "Vehicle description and owner", required: true },
      propertyStolen: { label: "Property Stolen", description: "Items taken and their value", required: true },
      location: { label: "Location", description: "Where vehicle was parked", required: true },
      time: { label: "Time of Incident", description: "When the theft occurred", required: true },
      entry: { label: "Entry Method", description: "How vehicle was accessed", required: true }
    }
  },
  {
    id: "23F",
    name: "Theft of Motor Vehicle Parts/Accessories",
    code: "23F",
    category: "Theft",
    nibrsCode: "23F",
    description: "The theft of any part or accessory attached to the interior or exterior of a motor vehicle",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["vehicle", "partsStolen", "location", "time", "damage"],
    fieldDefinitions: {
      vehicle: { label: "Vehicle Information", description: "Vehicle description and owner", required: true },
      partsStolen: { label: "Parts Stolen", description: "Specific parts or accessories taken", required: true },
      location: { label: "Location", description: "Where vehicle was parked", required: true },
      time: { label: "Time of Incident", description: "When the theft occurred", required: true },
      damage: { label: "Damage Caused", description: "Damage to vehicle during theft", required: true }
    }
  },
  {
    id: "23G",
    name: "All Other Larceny",
    code: "23G",
    category: "Theft",
    nibrsCode: "23G",
    description: "All thefts which do not fit the definition of the specific subcategories of larceny/theft",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["propertyStolen", "location", "time", "value", "circumstances"],
    fieldDefinitions: {
      propertyStolen: { label: "Property Stolen", description: "Items taken and their value", required: true },
      location: { label: "Incident Location", description: "Where the theft occurred", required: true },
      time: { label: "Time of Incident", description: "When the theft occurred", required: true },
      value: { label: "Property Value", description: "Estimated value of stolen property", required: true },
      circumstances: { label: "Circumstances", description: "How the theft occurred", required: true }
    }
  },
  {
    id: "23H",
    name: "Motor Vehicle Theft",
    code: "23H",
    category: "Theft",
    nibrsCode: "23H",
    description: "The theft or attempted theft of a motor vehicle",
    isGroupA: true,
    severity: "HIGH",
    requiredFields: ["vehicle", "owner", "location", "time", "date", "recovery"],
    fieldDefinitions: {
      vehicle: { label: "Vehicle Description", description: "Complete vehicle identification", required: true },
      owner: { label: "Owner Information", description: "Registered owner details", required: true },
      location: { label: "Theft Location", description: "Where vehicle was stolen from", required: true },
      time: { label: "Time of Theft", description: "When vehicle was stolen", required: true },
      date: { label: "Date of Theft", description: "Date vehicle was stolen", required: true },
      recovery: { label: "Recovery Status", description: "Whether vehicle was recovered", required: true }
    }
  },

  // ========== ARSON ==========
  {
    id: "200",
    name: "Arson",
    code: "200",
    category: "Arson",
    nibrsCode: "200",
    description: "To unlawfully and intentionally damage, or attempt to damage, any real or personal property by fire or incendiary device",
    isGroupA: true,
    severity: "HIGH",
    requiredFields: ["location", "damage", "ignition", "time", "motive", "evidence"],
    fieldDefinitions: {
      location: { label: "Property Location", description: "Address and type of property", required: true },
      damage: { label: "Damage Extent", description: "Extent of fire damage", required: true },
      ignition: { label: "Ignition Source", description: "How fire was started", required: true },
      time: { label: "Time of Incident", description: "When fire occurred", required: true },
      motive: { label: "Suspected Motive", description: "Reason for arson", required: true },
      evidence: { label: "Evidence Collected", description: "Arson investigation findings", required: true }
    }
  },

  // ========== FORGERY/COUNTERFEITING ==========
  {
    id: "250",
    name: "Forgery/Counterfeiting",
    code: "250",
    category: "Fraud",
    nibrsCode: "250",
    description: "The altering, copying, or imitating of something, without authority or right, with the intent to deceive or defraud",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["suspect", "forgedItems", "location", "method", "victim"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect description and actions", required: true },
      forgedItems: { label: "Forged Items", description: "Description of counterfeit items", required: true },
      location: { label: "Incident Location", description: "Where forgery occurred", required: true },
      method: { label: "Forgery Method", description: "How forgery was accomplished", required: true },
      victim: { label: "Victim Information", description: "Who was defrauded", required: true }
    }
  },

  // ========== FRAUD OFFENSES ==========
  {
    id: "26A",
    name: "False Pretenses/Swindle/Confidence Game",
    code: "26A",
    category: "Fraud",
    nibrsCode: "26A",
    description: "The intentional misrepresentation of existing fact or condition, or the use of some other deceptive scheme, to cause another person to pass title to property",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["suspect", "victim", "scheme", "property", "value", "location"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect description and methods", required: true },
      victim: { label: "Victim Information", description: "Victim demographics and statement", required: true },
      scheme: { label: "Fraudulent Scheme", description: "How the fraud was conducted", required: true },
      property: { label: "Property Involved", description: "What was obtained through fraud", required: true },
      value: { label: "Value", description: "Monetary value involved", required: true },
      location: { label: "Incident Location", description: "Where fraud occurred", required: true }
    }
  },
  {
    id: "26B",
    name: "Credit Card/Automated Teller Machine Fraud",
    code: "26B",
    category: "Fraud",
    nibrsCode: "26B",
    description: "The unlawful use of a credit card or ATM card to obtain money, property, or services",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["suspect", "victim", "cards", "transactions", "location", "loss"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect description and methods", required: true },
      victim: { label: "Victim Information", description: "Cardholder information", required: true },
      cards: { label: "Cards Involved", description: "Credit/debit card information", required: true },
      transactions: { label: "Fraudulent Transactions", description: "Details of unauthorized transactions", required: true },
      location: { label: "Incident Location", description: "Where fraud occurred", required: true },
      loss: { label: "Financial Loss", description: "Total monetary loss", required: true }
    }
  },
  {
    id: "26C",
    name: "Impersonation",
    code: "26C",
    category: "Fraud",
    nibrsCode: "26C",
    description: "False personation of another to gain some benefit or cause harm to another",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["suspect", "victim", "impersonation", "benefit", "location"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect description and methods", required: true },
      victim: { label: "Victim Information", description: "Person being impersonated", required: true },
      impersonation: { label: "Impersonation Details", description: "How impersonation occurred", required: true },
      benefit: { label: "Benefit Gained", description: "What suspect gained from impersonation", required: true },
      location: { label: "Incident Location", description: "Where impersonation occurred", required: true }
    }
  },
  {
    id: "26D",
    name: "Welfare Fraud",
    code: "26D",
    category: "Fraud",
    nibrsCode: "26D",
    description: "The intentional deception of a welfare agency to obtain benefits to which one is not entitled",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["suspect", "agency", "falseInformation", "benefits", "timeframe"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect demographics and eligibility", required: true },
      agency: { label: "Welfare Agency", description: "Agency defrauded", required: true },
      falseInformation: { label: "False Information", description: "What information was falsified", required: true },
      benefits: { label: "Benefits Obtained", description: "Type and value of benefits", required: true },
      timeframe: { label: "Timeframe", description: "Duration of fraudulent activity", required: true }
    }
  },
  {
    id: "26E",
    name: "Wire Fraud",
    code: "26E",
    category: "Fraud",
    nibrsCode: "26E",
    description: "The use of electronic communications to intentionally deceive for financial gain",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["suspect", "victim", "method", "communications", "loss"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect description and methods", required: true },
      victim: { label: "Victim Information", description: "Victim demographics and statement", required: true },
      method: { label: "Fraud Method", description: "How electronic communications were used", required: true },
      communications: { label: "Communications", description: "Emails, calls, or messages used", required: true },
      loss: { label: "Financial Loss", description: "Total monetary loss", required: true }
    }
  },

  // ========== STOLEN PROPERTY OFFENSES ==========
  {
    id: "280",
    name: "Stolen Property Offenses",
    code: "280",
    category: "Property",
    nibrsCode: "280",
    description: "Receiving, buying, selling, possessing, concealing, or transporting any property with the knowledge that it has been unlawfully taken",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["suspect", "property", "knowledge", "location", "disposition"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect description and actions", required: true },
      property: { label: "Stolen Property", description: "Description of property and origin", required: true },
      knowledge: { label: "Knowledge of Theft", description: "Evidence suspect knew property was stolen", required: true },
      location: { label: "Incident Location", description: "Where offense occurred", required: true },
      disposition: { label: "Property Disposition", description: "What happened to the property", required: true }
    }
  },

  // ========== VANDALISM/DESTRUCTION OF PROPERTY ==========
  {
    id: "290",
    name: "Vandalism/Destruction of Property",
    code: "290",
    category: "Vandalism",
    nibrsCode: "290",
    description: "To willfully or maliciously destroy, injure, disfigure, or deface any public or private property",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["property", "damage", "location", "time", "suspect"],
    fieldDefinitions: {
      property: { label: "Property Description", description: "What property was damaged", required: true },
      damage: { label: "Damage Extent", description: "Nature and extent of damage", required: true },
      location: { label: "Incident Location", description: "Where vandalism occurred", required: true },
      time: { label: "Time of Incident", description: "When vandalism occurred", required: true },
      suspect: { label: "Suspect Information", description: "Suspect description if known", required: true }
    }
  },

  // ========== WEAPON LAW VIOLATIONS ==========
  {
    id: "520",
    name: "Weapon Law Violations",
    code: "520",
    category: "Weapons",
    nibrsCode: "520",
    description: "The violation of laws or ordinances regulating the manufacture, sale, purchase, transportation, possession, or use of firearms or other weapons",
    isGroupA: true,
    severity: "HIGH",
    requiredFields: ["suspect", "weapon", "violation", "location", "circumstances"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect demographics and criminal history", required: true },
      weapon: { label: "Weapon Description", description: "Type of weapon and identification", required: true },
      violation: { label: "Specific Violation", description: "What law was violated", required: true },
      location: { label: "Incident Location", description: "Where violation occurred", required: true },
      circumstances: { label: "Circumstances", description: "How violation was discovered", required: true }
    }
  },

  // ========== PROSTITUTION OFFENSES ==========
  {
    id: "40A",
    name: "Prostitution",
    code: "40A",
    category: "Vice",
    nibrsCode: "40A",
    description: "To unlawfully engage in or promote sexual activities for profit",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["suspect", "location", "time", "evidence", "solicitation"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect description and role", required: true },
      location: { label: "Incident Location", description: "Where offense occurred", required: true },
      time: { label: "Time of Incident", description: "When offense occurred", required: true },
      evidence: { label: "Evidence", description: "How offense was documented", required: true },
      solicitation: { label: "Solicitation Details", description: "How prostitution was arranged", required: true }
    }
  },
  {
    id: "40B",
    name: "Assisting or Promoting Prostitution",
    code: "40B",
    category: "Vice",
    nibrsCode: "40B",
    description: "To solicit, transport, or provide a person for the purpose of prostitution; to own, manage, or operate a dwelling or other establishment for the purpose of providing a place where prostitution is performed",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["suspect", "operation", "location", "time", "evidence"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect description and role", required: true },
      operation: { label: "Operation Details", description: "How prostitution was facilitated", required: true },
      location: { label: "Operation Location", description: "Where activity occurred", required: true },
      time: { label: "Timeframe", description: "Duration of operation", required: true },
      evidence: { label: "Evidence", description: "Documentation of the operation", required: true }
    }
  },

  // ========== SEX OFFENSES (NON-FORCIBLE) ==========
  {
    id: "36A",
    name: "Incest",
    code: "36A",
    category: "Sex Offenses",
    nibrsCode: "36A",
    description: "Non-forcible sexual intercourse between persons who are related to each other within the degrees wherein marriage is prohibited by law",
    isGroupA: true,
    severity: "HIGH",
    requiredFields: ["victim", "offender", "relationship", "timeframe", "disclosure"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Victim demographics and statement", required: true },
      offender: { label: "Offender Information", description: "Offender demographics", required: true },
      relationship: { label: "Family Relationship", description: "How victim and offender are related", required: true },
      timeframe: { label: "Timeframe", description: "When offenses occurred", required: true },
      disclosure: { label: "Disclosure", description: "How offense was reported", required: true }
    }
  },
  {
    id: "36B",
    name: "Statutory Rape",
    code: "36B",
    category: "Sex Offenses",
    nibrsCode: "36B",
    description: "Non-forcible sexual intercourse with a person who is under the statutory age of consent",
    isGroupA: true,
    severity: "HIGH",
    requiredFields: ["victim", "offender", "ages", "location", "time"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Victim age and demographics", required: true },
      offender: { label: "Offender Information", description: "Offender age and demographics", required: true },
      ages: { label: "Ages", description: "Ages of victim and offender", required: true },
      location: { label: "Incident Location", description: "Where offense occurred", required: true },
      time: { label: "Time of Incident", description: "When offense occurred", required: true }
    }
  },

  // ========== DRUG/NARCOTIC OFFENSES ==========
  {
    id: "35A",
    name: "Drug/Narcotic Violations",
    code: "35A",
    category: "Drugs",
    nibrsCode: "35A",
    description: "The unlawful cultivation, manufacture, distribution, sale, purchase, use, possession, transportation, or importation of any controlled drug or narcotic substance",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["suspect", "substance", "quantity", "location", "circumstances"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect description and actions", required: true },
      substance: { label: "Substance Type", description: "Type of drug/narcotic", required: true },
      quantity: { label: "Quantity", description: "Amount of substance involved", required: true },
      location: { label: "Incident Location", description: "Where offense occurred", required: true },
      circumstances: { label: "Circumstances", description: "How offense was discovered", required: true }
    }
  },
  {
    id: "35B",
    name: "Drug Equipment Violations",
    code: "35B",
    category: "Drugs",
    nibrsCode: "35B",
    description: "The unlawful manufacture, sale, purchase, possession, or transportation of equipment or devices used for preparing or using drugs/narcotics",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["suspect", "equipment", "location", "purpose", "evidence"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect description and actions", required: true },
      equipment: { label: "Equipment Description", description: "Type of drug equipment", required: true },
      location: { label: "Incident Location", description: "Where offense occurred", required: true },
      purpose: { label: "Intended Purpose", description: "How equipment was to be used", required: true },
      evidence: { label: "Evidence", description: "Documentation of the violation", required: true }
    }
  },

  // ========== GAMBLING OFFENSES ==========
  {
    id: "39A",
    name: "Betting/Wagering",
    code: "39A",
    category: "Vice",
    nibrsCode: "39A",
    description: "To unlawfully stake or risk something of value upon the outcome of a contest of chance or future contingent event",
    isGroupA: true,
    severity: "LOW",
    requiredFields: ["suspect", "operation", "location", "time", "evidence"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect description and role", required: true },
      operation: { label: "Gambling Operation", description: "How gambling was conducted", required: true },
      location: { label: "Operation Location", description: "Where gambling occurred", required: true },
      time: { label: "Timeframe", description: "Duration of operation", required: true },
      evidence: { label: "Evidence", description: "Documentation of gambling activity", required: true }
    }
  },
  {
    id: "39B",
    name: "Operating/Promoting/Assisting Gambling",
    code: "39B",
    category: "Vice",
    nibrsCode: "39B",
    description: "To unlawfully operate, promote, or assist in the operation of a game of chance, lottery, or other gambling activity",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["suspect", "operation", "location", "profits", "evidence"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect description and role", required: true },
      operation: { label: "Gambling Operation", description: "Nature and scope of operation", required: true },
      location: { label: "Operation Location", description: "Where gambling occurred", required: true },
      profits: { label: "Profits", description: "Financial gains from operation", required: true },
      evidence: { label: "Evidence", description: "Documentation of the operation", required: true }
    }
  },
  {
    id: "39C",
    name: "Gambling Equipment Violations",
    code: "39C",
    category: "Vice",
    nibrsCode: "39C",
    description: "To unlawfully manufacture, sell, buy, possess, or transport equipment, devices, or goods used for gambling purposes",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["suspect", "equipment", "location", "purpose", "evidence"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect description and actions", required: true },
      equipment: { label: "Gambling Equipment", description: "Type of equipment involved", required: true },
      location: { label: "Incident Location", description: "Where violation occurred", required: true },
      purpose: { label: "Intended Purpose", description: "How equipment was to be used", required: true },
      evidence: { label: "Evidence", description: "Documentation of the violation", required: true }
    }
  },
  {
    id: "39D",
    name: "Sports Tampering",
    code: "39D",
    category: "Vice",
    nibrsCode: "39D",
    description: "To unlawfully alter, meddle in, or otherwise interfere with a sporting contest or event for the purpose of influencing the outcome or score",
    isGroupA: true,
    severity: "MEDIUM",
    requiredFields: ["suspect", "sportingEvent", "tampering", "purpose", "evidence"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Suspect description and role", required: true },
      sportingEvent: { label: "Sporting Event", description: "Event that was tampered with", required: true },
      tampering: { label: "Tampering Method", description: "How the event was interfered with", required: true },
      purpose: { label: "Purpose", description: "Reason for tampering", required: true },
      evidence: { label: "Evidence", description: "Documentation of tampering", required: true }
    }
  }
];

// ========== GROUP B OFFENSES ==========
export const GROUP_B_OFFENSES: OffenseType[] = [
  // ========== SIMPLE ASSAULT ==========
  {
    id: "13B-GB",
    name: "Simple Assault (Group B)",
    code: "13B",
    category: "Assault",
    nibrsCode: "13B",
    description: "Minor physical altercation without serious injury or weapon",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["victim", "offender", "location", "circumstances"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Victim demographics", required: true },
      offender: { label: "Offender Description", description: "Suspect physical description", required: true },
      location: { label: "Incident Location", description: "Where assault occurred", required: true },
      circumstances: { label: "Circumstances", description: "How the assault occurred", required: true }
    }
  },

  // ========== FORGERY ==========
  {
    id: "250-GB",
    name: "Forgery (Group B)",
    code: "250",
    category: "Fraud",
    nibrsCode: "250",
    description: "Creation or alteration of documents with intent to defraud",
    isGroupA: false,
    severity: "MEDIUM",
    requiredFields: ["suspect", "forgedItem", "method", "intent"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person committing forgery", required: true },
      forgedItem: { label: "Forged Item", description: "Description of forged document", required: true },
      method: { label: "Forgery Method", description: "How forgery was accomplished", required: true },
      intent: { label: "Intent", description: "Purpose of the forgery", required: true }
    }
  },

  // ========== FRAUD ==========
  {
    id: "26A-GB",
    name: "Fraud (Group B)",
    code: "26A",
    category: "Fraud",
    nibrsCode: "26A",
    description: "Deceptive practice for financial gain",
    isGroupA: false,
    severity: "MEDIUM",
    requiredFields: ["suspect", "victim", "scheme", "loss"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person committing fraud", required: true },
      victim: { label: "Victim Information", description: "Person or entity defrauded", required: true },
      scheme: { label: "Fraudulent Scheme", description: "How fraud was conducted", required: true },
      loss: { label: "Financial Loss", description: "Amount of money or value lost", required: true }
    }
  },

  // ========== EMBEZZLEMENT ==========
  {
    id: "26F-GB",
    name: "Embezzlement (Group B)",
    code: "26F",
    category: "Fraud",
    nibrsCode: "26F",
    description: "Misappropriation of funds or property entrusted to one's care",
    isGroupA: false,
    severity: "MEDIUM",
    requiredFields: ["suspect", "victim", "property", "amount"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person who misappropriated funds", required: true },
      victim: { label: "Victim Organization", description: "Organization that owned property", required: true },
      property: { label: "Property Embezzled", description: "What was taken", required: true },
      amount: { label: "Amount", description: "Value of embezzled property", required: true }
    }
  },

  // ========== STOLEN PROPERTY ==========
  {
    id: "280-GB",
    name: "Stolen Property (Group B)",
    code: "280",
    category: "Property",
    nibrsCode: "280",
    description: "Possession, buying, receiving of stolen property",
    isGroupA: false,
    severity: "MEDIUM",
    requiredFields: ["suspect", "property", "knowledge"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person with stolen property", required: true },
      property: { label: "Stolen Property", description: "Description of stolen items", required: true },
      knowledge: { label: "Knowledge", description: "Evidence suspect knew property was stolen", required: true }
    }
  },

  // ========== VANDALISM ==========
  {
    id: "290-GB",
    name: "Vandalism (Group B)",
    code: "290",
    category: "Vandalism",
    nibrsCode: "290",
    description: "Willful destruction or damage of property",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["property", "damage", "suspect"],
    fieldDefinitions: {
      property: { label: "Property Description", description: "What property was damaged", required: true },
      damage: { label: "Damage Description", description: "Nature of damage", required: true },
      suspect: { label: "Suspect Information", description: "Person responsible", required: true }
    }
  },

  // ========== WEAPONS VIOLATION ==========
  {
    id: "520-GB",
    name: "Weapons Violation (Group B)",
    code: "520",
    category: "Weapons",
    nibrsCode: "520",
    description: "Illegal possession, carrying, or use of weapons",
    isGroupA: false,
    severity: "MEDIUM",
    requiredFields: ["suspect", "weapon", "violation"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person with weapon", required: true },
      weapon: { label: "Weapon Description", description: "Type of weapon involved", required: true },
      violation: { label: "Violation", description: "Specific law violated", required: true }
    }
  },

  // ========== PROSTITUTION ==========
  {
    id: "40A-GB",
    name: "Prostitution (Group B)",
    code: "40A",
    category: "Vice",
    nibrsCode: "40A",
    description: "Engaging in or promoting sexual acts for money",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["suspect", "activity", "location"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person involved in prostitution", required: true },
      activity: { label: "Criminal Activity", description: "Nature of prostitution activity", required: true },
      location: { label: "Location", description: "Where activity occurred", required: true }
    }
  },

  // ========== DRUG VIOLATION ==========
  {
    id: "35A-GB",
    name: "Drug Violation (Group B)",
    code: "35A",
    category: "Drugs",
    nibrsCode: "35A",
    description: "Possession or use of controlled substances",
    isGroupA: false,
    severity: "MEDIUM",
    requiredFields: ["suspect", "substance", "quantity"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person with drugs", required: true },
      substance: { label: "Substance Type", description: "Type of drug involved", required: true },
      quantity: { label: "Quantity", description: "Amount of substance", required: true }
    }
  },

  // ========== GAMBLING ==========
  {
    id: "39A-GB",
    name: "Gambling Violation (Group B)",
    code: "39A",
    category: "Vice",
    nibrsCode: "39A",
    description: "Illegal betting or gambling operations",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["suspect", "operation", "location"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person involved in gambling", required: true },
      operation: { label: "Gambling Operation", description: "Nature of gambling activity", required: true },
      location: { label: "Location", description: "Where gambling occurred", required: true }
    }
  },

  // ========== OFFENSES AGAINST FAMILY ==========
  {
    id: "99A",
    name: "Offenses Against Family",
    code: "99A",
    category: "Domestic",
    nibrsCode: "99A",
    description: "Crimes involving family or household members",
    isGroupA: false,
    severity: "MEDIUM",
    requiredFields: ["victim", "offender", "relationship", "incident"],
    fieldDefinitions: {
      victim: { label: "Victim Information", description: "Family member victim", required: true },
      offender: { label: "Offender Information", description: "Family member offender", required: true },
      relationship: { label: "Relationship", description: "Family relationship between parties", required: true },
      incident: { label: "Incident Details", description: "What occurred", required: true }
    }
  },

  // ========== DUI/DWI ==========
  {
    id: "90A",
    name: "Driving Under Influence",
    code: "90A",
    category: "Traffic",
    nibrsCode: "90A",
    description: "Operating vehicle while impaired by alcohol or drugs",
    isGroupA: false,
    severity: "MEDIUM",
    requiredFields: ["suspect", "vehicle", "impairment", "testResults"],
    fieldDefinitions: {
      suspect: { label: "Driver Information", description: "Person operating vehicle", required: true },
      vehicle: { label: "Vehicle Information", description: "Description of vehicle", required: true },
      impairment: { label: "Impairment Evidence", description: "Signs of impairment observed", required: true },
      testResults: { label: "Test Results", description: "Breathalyzer or field test results", required: true }
    }
  },

  // ========== LIQUOR LAW VIOLATION ==========
  {
    id: "90B",
    name: "Liquor Law Violation",
    code: "90B",
    category: "Vice",
    nibrsCode: "90B",
    description: "Violation of laws regulating alcoholic beverages",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["suspect", "violation", "location"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person violating liquor laws", required: true },
      violation: { label: "Violation Type", description: "Specific liquor law violated", required: true },
      location: { label: "Location", description: "Where violation occurred", required: true }
    }
  },

  // ========== DRUNKENNESS ==========
  {
    id: "90C",
    name: "Drunkenness",
    code: "90C",
    category: "Vice",
    nibrsCode: "90C",
    description: "Public intoxication or disorderly conduct due to alcohol",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["suspect", "behavior", "location"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Intoxicated person", required: true },
      behavior: { label: "Disorderly Behavior", description: "Disruptive conduct observed", required: true },
      location: { label: "Location", description: "Where incident occurred", required: true }
    }
  },

  // ========== DISORDERLY CONDUCT ==========
  {
    id: "90D",
    name: "Disorderly Conduct",
    code: "90D",
    category: "Public Order",
    nibrsCode: "90D",
    description: "Disruptive behavior disturbing public peace",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["suspect", "behavior", "location", "disturbance"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person causing disturbance", required: true },
      behavior: { label: "Disorderly Behavior", description: "Specific disruptive actions", required: true },
      location: { label: "Location", description: "Where disturbance occurred", required: true },
      disturbance: { label: "Public Disturbance", description: "How public was disturbed", required: true }
    }
  },

  // ========== VAGRANCY ==========
  {
    id: "90E",
    name: "Vagrancy",
    code: "90E",
    category: "Public Order",
    nibrsCode: "90E",
    description: "Homelessness or wandering without visible means of support",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["suspect", "circumstances", "location"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Vagrant individual", required: true },
      circumstances: { label: "Circumstances", description: "Living situation and behavior", required: true },
      location: { label: "Location", description: "Where individual was located", required: true }
    }
  },

  // ========== CURFEW VIOLATION ==========
  {
    id: "90F",
    name: "Curfew/Loitering Violation",
    code: "90F",
    category: "Public Order",
    nibrsCode: "90F",
    description: "Violation of curfew laws or illegal loitering",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["suspect", "violation", "location", "time"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person violating curfew/loitering", required: true },
      violation: { label: "Violation Type", description: "Specific curfew or loitering violation", required: true },
      location: { label: "Location", description: "Where violation occurred", required: true },
      time: { label: "Time of Violation", description: "When violation occurred", required: true }
    }
  },

  // ========== RUNAWAY ==========
  {
    id: "91A",
    name: "Runaway",
    code: "91A",
    category: "Juvenile",
    nibrsCode: "91A",
    description: "Juvenile leaving home without parental permission",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["juvenile", "guardian", "circumstances", "duration"],
    fieldDefinitions: {
      juvenile: { label: "Juvenile Information", description: "Runaway juvenile details", required: true },
      guardian: { label: "Guardian Information", description: "Parent or legal guardian", required: true },
      circumstances: { label: "Circumstances", description: "Why juvenile left home", required: true },
      duration: { label: "Duration", description: "How long juvenile was missing", required: true }
    }
  },

  // ========== TRUANCY ==========
  {
    id: "91B",
    name: "Truancy",
    code: "91B",
    category: "Juvenile",
    nibrsCode: "91B",
    description: "Juvenile skipping school without valid excuse",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["juvenile", "school", "violations", "guardian"],
    fieldDefinitions: {
      juvenile: { label: "Juvenile Information", description: "Truant student details", required: true },
      school: { label: "School Information", description: "School student should attend", required: true },
      violations: { label: "Violation Details", description: "Dates and times of truancy", required: true },
      guardian: { label: "Guardian Notification", description: "Parent/guardian awareness", required: true }
    }
  },

  // ========== UNDERAGE ALCOHOL ==========
  {
    id: "91C",
    name: "Underage Alcohol Violation",
    code: "91C",
    category: "Juvenile",
    nibrsCode: "91C",
    description: "Minor in possession or consumption of alcohol",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["juvenile", "alcohol", "location", "source"],
    fieldDefinitions: {
      juvenile: { label: "Juvenile Information", description: "Minor involved", required: true },
      alcohol: { label: "Alcohol Details", description: "Type and amount of alcohol", required: true },
      location: { label: "Location", description: "Where violation occurred", required: true },
      source: { label: "Alcohol Source", description: "How minor obtained alcohol", required: true }
    }
  },

  // ========== STATUS OFFENSES ==========
  {
    id: "91D",
    name: "Status Offense",
    code: "91D",
    category: "Juvenile",
    nibrsCode: "91D",
    description: "Behavior that is only illegal because of juvenile status",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["juvenile", "offense", "circumstances", "guardian"],
    fieldDefinitions: {
      juvenile: { label: "Juvenile Information", description: "Minor involved", required: true },
      offense: { label: "Offense Type", description: "Specific status offense", required: true },
      circumstances: { label: "Circumstances", description: "Context of offense", required: true },
      guardian: { label: "Guardian Information", description: "Parent/guardian details", required: true }
    }
  },

  // ========== ANIMAL CRUELTY ==========
  {
    id: "720",
    name: "Animal Cruelty",
    code: "720",
    category: "Other",
    nibrsCode: "720",
    description: "Neglect, abuse, or harm to animals",
    isGroupA: false,
    severity: "MEDIUM",
    requiredFields: ["suspect", "animal", "abuse", "condition"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person responsible for abuse", required: true },
      animal: { label: "Animal Information", description: "Animal(s) involved and condition", required: true },
      abuse: { label: "Abuse Details", description: "Type and extent of abuse", required: true },
      condition: { label: "Living Conditions", description: "Environment where animal was kept", required: true }
    }
  },

  // ========== ENVIRONMENTAL CRIME ==========
  {
    id: "730",
    name: "Environmental Crime",
    code: "730",
    category: "Other",
    nibrsCode: "730",
    description: "Violation of environmental protection laws",
    isGroupA: false,
    severity: "MEDIUM",
    requiredFields: ["suspect", "violation", "location", "impact"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person/company violating laws", required: true },
      violation: { label: "Environmental Violation", description: "Specific law violated", required: true },
      location: { label: "Location", description: "Where violation occurred", required: true },
      impact: { label: "Environmental Impact", description: "Damage to environment", required: true }
    }
  },

  // ========== FISH AND GAME VIOLATION ==========
  {
    id: "740",
    name: "Fish and Game Violation",
    code: "740",
    category: "Other",
    nibrsCode: "740",
    description: "Illegal hunting, fishing, or wildlife violations",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["suspect", "violation", "location", "wildlife"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person violating game laws", required: true },
      violation: { label: "Violation Type", description: "Specific game law violated", required: true },
      location: { label: "Location", description: "Where violation occurred", required: true },
      wildlife: { label: "Wildlife Involved", description: "Animals or fish involved", required: true }
    }
  },

  // ========== HEALTH AND SAFETY VIOLATION ==========
  {
    id: "750",
    name: "Health/Safety Violation",
    code: "750",
    category: "Other",
    nibrsCode: "750",
    description: "Violation of public health or safety codes",
    isGroupA: false,
    severity: "MEDIUM",
    requiredFields: ["suspect", "violation", "location", "risk"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person/entity violating codes", required: true },
      violation: { label: "Violation Type", description: "Specific health/safety code violated", required: true },
      location: { label: "Location", description: "Where violation occurred", required: true },
      risk: { label: "Public Risk", description: "Risk to public health/safety", required: true }
    }
  },

  // ========== TRAFFIC VIOLATION ==========
  {
    id: "800",
    name: "Traffic Violation",
    code: "800",
    category: "Traffic",
    nibrsCode: "800",
    description: "Moving or non-moving traffic infractions",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["driver", "vehicle", "violation", "location"],
    fieldDefinitions: {
      driver: { label: "Driver Information", description: "Person operating vehicle", required: true },
      vehicle: { label: "Vehicle Information", description: "Description of vehicle", required: true },
      violation: { label: "Traffic Violation", description: "Specific traffic law violated", required: true },
      location: { label: "Location", description: "Where violation occurred", required: true }
    }
  },

  // ========== OTHER OFFENSES ==========
  {
    id: "999",
    name: "All Other Offenses",
    code: "999",
    category: "Other",
    nibrsCode: "999",
    description: "Miscellaneous offenses not classified elsewhere",
    isGroupA: false,
    severity: "LOW",
    requiredFields: ["suspect", "offense", "circumstances"],
    fieldDefinitions: {
      suspect: { label: "Suspect Information", description: "Person involved", required: true },
      offense: { label: "Offense Description", description: "Nature of the offense", required: true },
      circumstances: { label: "Circumstances", description: "Context of the incident", required: true }
    }
  }
];

export const OFFENSE_CATEGORIES = [
  "Homicide",
  "Sex Offenses", 
  "Assault",
  "Robbery",
  "Burglary",
  "Theft",
  "Arson",
  "Fraud",
  "Property",
  "Vandalism",
  "Weapons",
  "Vice",
  "Drugs",
  "Domestic",
  "Traffic",
  "Public Order",
  "Juvenile",
  "Other"
];

// Combined array of all offenses
export const ALL_OFFENSES: OffenseType[] = [
  ...GROUP_A_OFFENSES,
  ...GROUP_B_OFFENSES
];

// Helper function to get offenses by type
export function getOffensesByType(isGroupA: boolean): OffenseType[] {
  return isGroupA ? GROUP_A_OFFENSES : GROUP_B_OFFENSES;
}

// Helper function to search all offenses
export function searchAllOffenses(searchTerm: string): OffenseType[] {
  return ALL_OFFENSES.filter(offense => 
    offense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offense.code.includes(searchTerm) ||
    offense.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export function getOffensesByCategory(category: string): OffenseType[] {
  return GROUP_A_OFFENSES.filter(offense => offense.category === category);
}

export function getOffenseById(id: string): OffenseType | undefined {
  return GROUP_A_OFFENSES.find(offense => offense.id === id);
}

export function getOffenseByCode(code: string): OffenseType | undefined {
  return GROUP_A_OFFENSES.find(offense => offense.code === code);
}

export function getOffensesBySeverity(severity: string): OffenseType[] {
  return GROUP_A_OFFENSES.filter(offense => offense.severity === severity);
}