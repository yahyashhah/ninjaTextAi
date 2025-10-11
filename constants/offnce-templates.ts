// lib/templates/offenseTemplates.ts
import { OffenseType } from "@/constants/offences";

export interface OffenseTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  fieldMappings: Record<string, string>;
  instructions: string;
}

export const OFFENSE_TEMPLATES: Record<string, OffenseTemplate> = {
  // ========== HOMICIDE TEMPLATES ==========
  HOMICIDE: {
    id: "homicide",
    name: "Homicide Investigation Report",
    category: "Homicide",
    template: `
INVESTIGATIVE REPORT - HOMICIDE

INCIDENT DETAILS:
Date: [date]
Time: [time] 
Location: [location]

VICTIM INFORMATION:
[victim]

DECEASED STATUS:
- Pronounced deceased at: [time_of_death]
- Cause of death: [cause_of_death]
- Injuries observed: [injuries]

SUSPECT INFORMATION:
[offender]

WEAPON/EVIDENCE:
- Weapon used: [weapon]
- Additional evidence: [evidence]

INVESTIGATIVE DETAILS:
- Apparent motive: [motive]
- Crime scene processed by: [crime_scene_units]
- Additional investigative steps: [next_steps]

This concludes the initial homicide investigation report.
    `,
    fieldMappings: {
      victim: "victim",
      offender: "offender", 
      weapon: "weapon",
      location: "location",
      time: "time",
      date: "date",
      motive: "motive",
      injuries: "injuries",
      evidence: "evidence"
    },
    instructions: "Document all homicide investigation details including victim information, suspect details, weapon used, and investigative steps taken."
  },

  // ========== SEX OFFENSE TEMPLATES ==========
  SEX_ASSAULT: {
    id: "sex_assault",
    name: "Sexual Assault Investigation Report",
    category: "Sex Offenses",
    template: `
SEXUAL ASSAULT INVESTIGATION REPORT

INCIDENT DETAILS:
Date: [date]
Time: [time]
Location: [location]

VICTIM INFORMATION:
[victim]

SUSPECT DESCRIPTION:
[offender]

ASSAULT DETAILS:
- Type of force used: [force]
- Object used (if applicable): [object]
- Circumstances: [circumstances]

MEDICAL/TREATMENT:
- Medical attention provided: [medical]
- SANE exam conducted: [sane_exam]
- Evidence collected: [evidence]

INVESTIGATION STATUS:
- Suspect in custody: [custody_status]
- Additional evidence: [additional_evidence]

This report documents a sexual assault investigation.
    `,
    fieldMappings: {
      victim: "victim",
      offender: "offender",
      location: "location", 
      time: "time",
      force: "force",
      medical: "medical",
      evidence: "evidence",
      object: "object"
    },
    instructions: "Document sexual assault details with sensitivity, including victim information, medical examination results, and evidence collection."
  },

  // ========== ROBBERY TEMPLATE ==========
  ROBBERY: {
    id: "robbery",
    name: "Robbery Incident Report", 
    category: "Robbery",
    template: `
ROBBERY INCIDENT REPORT

INCIDENT DETAILS:
Date: [date] 
Time: [time]
Location: [location]

VICTIM INFORMATION:
[victim]

SUSPECT DESCRIPTION:
[offender]

ROBBERY DETAILS:
- Property taken: [propertyTaken]
- Value of property: [property_value]
- Force/threat used: [force]
- Weapon displayed: [weapon_displayed]

INVESTIGATIVE ACTIONS:
- Area canvassed: [canvass]
- Surveillance footage: [surveillance]
- Evidence collected: [evidence]

SUSPECT STATUS:
[apprehension_status]

This report documents a robbery incident.
    `,
    fieldMappings: {
      victim: "victim",
      offender: "offender",
      propertyTaken: "propertyTaken", 
      location: "location",
      time: "time",
      force: "force"
    },
    instructions: "Document robbery details including property taken, force used, and investigative actions taken."
  },

  // ========== ASSAULT TEMPLATES ==========
  ASSAULT: {
    id: "assault",
    name: "Assault Investigation Report",
    category: "Assault",
    template: `
ASSAULT INVESTIGATION REPORT

INCIDENT DETAILS:
Date: [date]
Time: [time]
Location: [location]

VICTIM INFORMATION:
[victim]

SUSPECT INFORMATION:
[offender]

ASSAULT DETAILS:
- Weapon used: [weapon]
- Injuries sustained: [injuries]
- Circumstances: [circumstances]
- Threat made: [threat]

MEDICAL ATTENTION:
- Treatment provided: [medical_treatment]
- Hospital transport: [hospital_transport]

INVESTIGATION:
- Witness statements: [witnesses]
- Evidence collected: [evidence]

This report documents an assault investigation.
    `,
    fieldMappings: {
      victim: "victim",
      offender: "offender",
      weapon: "weapon",
      injuries: "injuries", 
      location: "location",
      time: "time",
      circumstances: "circumstances",
      threat: "threat"
    },
    instructions: "Document assault details including injuries, weapons used, and medical treatment provided."
  },

  // ========== BURGLARY/THEFT TEMPLATES ==========
  BURGLARY: {
    id: "burglary",
    name: "Burglary Investigation Report",
    category: "Burglary",
    template: `
BURGLARY INVESTIGATION REPORT

INCIDENT DETAILS:
Date: [date]
Time: [time] 
Location: [location]
Type of premises: [premises]

ENTRY METHOD:
[entryMethod]

PROPERTY STOLEN:
[propertyStolen]

CRIME SCENE:
- Point of entry: [point_of_entry]
- Damage caused: [damage]
- Evidence collected: [evidence]

INVESTIGATION:
- Suspect information: [suspect_info]
- Forensic evidence: [forensics]
- Neighborhood canvass: [canvass]

This report documents a burglary investigation.
    `,
    fieldMappings: {
      location: "location",
      entryMethod: "entryMethod",
      propertyStolen: "propertyStolen",
      time: "time",
      date: "date", 
      premises: "premises"
    },
    instructions: "Document burglary details including entry method, property stolen, and crime scene evidence."
  },

  THEFT: {
    id: "theft",
    name: "Theft/Larceny Report",
    category: "Theft",
    template: `
THEFT/LARCENY REPORT

INCIDENT DETAILS:
Date: [date]
Time: [time]
Location: [location]

VICTIM/SUSPECT INFORMATION:
[victim]
[suspect]

PROPERTY DETAILS:
[propertyStolen]
Estimated value: [value]

THEFT CIRCUMSTANCES:
[circumstances]

INVESTIGATIVE ACTIONS:
- Evidence collected: [evidence]
- Witness statements: [witnesses]
- Recovery efforts: [recovery_efforts]

This report documents a theft/larceny incident.
    `,
    fieldMappings: {
      victim: "victim",
      propertyStolen: "propertyStolen",
      location: "location",
      time: "time", 
      value: "value",
      circumstances: "circumstances",
      suspect: "suspect"
    },
    instructions: "Document theft details including property description, value, and investigative actions."
  },

  // ========== DRUG OFFENSE TEMPLATES ==========
  DRUG_OFFENSE: {
    id: "drug_offense",
    name: "Drug/Narcotics Violation Report",
    category: "Drugs",
    template: `
DRUG/NARCOTICS VIOLATION REPORT

INCIDENT DETAILS:
Date: [date]
Time: [time]
Location: [location]

SUSPECT INFORMATION:
[suspect]

DRUG EVIDENCE:
- Substance type: [substance]
- Quantity: [quantity]
- Packaging: [packaging]
- Field test results: [field_test]

CIRCUMSTANCES:
[circumstances]

ADDITIONAL EVIDENCE:
[evidence]
[equipment]

DISPOSITION:
- Arrest made: [arrest_status]
- Evidence logged: [evidence_logged]
- Charges filed: [charges]

This report documents a drug/narcotics violation.
    `,
    fieldMappings: {
      suspect: "suspect",
      substance: "substance", 
      quantity: "quantity",
      location: "location",
      circumstances: "circumstances",
      equipment: "equipment",
      evidence: "evidence"
    },
    instructions: "Document drug violation details including substance type, quantity, and evidence collected."
  },

  // ========== WEAPONS TEMPLATE ==========
  WEAPONS: {
    id: "weapons",
    name: "Weapons Violation Report",
    category: "Weapons",
    template: `
WEAPONS VIOLATION REPORT

INCIDENT DETAILS:
Date: [date]
Time: [time]
Location: [location]

SUSPECT INFORMATION:
[suspect]

WEAPON INFORMATION:
[weapon]

VIOLATION DETAILS:
[violation]

CIRCUMSTANCES:
[circumstances]

EVIDENCE/ACTIONS:
- Weapon secured: [weapon_secured]
- Additional evidence: [evidence]
- Charges filed: [charges]

This report documents a weapons law violation.
    `,
    fieldMappings: {
      suspect: "suspect",
      weapon: "weapon",
      violation: "violation",
      location: "location",
      circumstances: "circumstances"
    },
    instructions: "Document weapons violation details including weapon type, violation specifics, and evidence secured."
  },

  // ========== FRAUD TEMPLATES ==========
  FRAUD: {
    id: "fraud",
    name: "Fraud Investigation Report",
    category: "Fraud",
    template: `
FRAUD INVESTIGATION REPORT

INCIDENT DETAILS:
Date: [date]
Time: [time]
Location: [location]

SUSPECT INFORMATION:
[suspect]

VICTIM INFORMATION:
[victim]

FRAUD SCHEME:
[scheme]

PROPERTY/VALUE INVOLVED:
[property]
[value]

EVIDENCE:
- Documents obtained: [documents]
- Financial records: [financial_records]
- Communications: [communications]

INVESTIGATION:
- Loss amount: [loss]
- Additional victims: [additional_victims]
- Forensic accounting: [forensic_analysis]

This report documents a fraud investigation.
    `,
    fieldMappings: {
      suspect: "suspect",
      victim: "victim",
      scheme: "scheme",
      property: "property",
      value: "value",
      location: "location",
      loss: "loss"
    },
    instructions: "Document fraud investigation details including scheme description, financial loss, and evidence collected."
  },

  // ========== VICE OFFENSES TEMPLATES ==========
  VICE: {
    id: "vice",
    name: "Vice Offense Report",
    category: "Vice",
    template: `
VICE OFFENSE REPORT

INCIDENT DETAILS:
Date: [date]
Time: [time]
Location: [location]

SUSPECT INFORMATION:
[suspect]

OFFENSE DETAILS:
[operation]
[activity]
[solicitation]

EVIDENCE:
[evidence]

DISPOSITION:
- Arrest made: [arrest_status]
- Evidence secured: [evidence_secured]
- Additional investigation: [additional_investigation]

This report documents a vice offense.
    `,
    fieldMappings: {
      suspect: "suspect",
      location: "location",
      time: "time",
      evidence: "evidence",
      solicitation: "solicitation",
      operation: "operation",
      activity: "activity"
    },
    instructions: "Document vice offense details including operation specifics, evidence collected, and disposition."
  },

  // ========== TRAFFIC/DUI TEMPLATES ==========
  TRAFFIC: {
    id: "traffic",
    name: "Traffic Offense Report",
    category: "Traffic",
    template: `
TRAFFIC OFFENSE REPORT

INCIDENT DETAILS:
Date: [date]
Time: [time]
Location: [location]

DRIVER INFORMATION:
[driver]
[suspect]

VEHICLE INFORMATION:
[vehicle]

VIOLATION DETAILS:
[violation]

IMPAIRMENT EVIDENCE:
[impairment]

TEST RESULTS:
[testResults]

DISPOSITION:
- Citation issued: [citation_issued]
- Arrest made: [arrest_status]
- Vehicle towed: [vehicle_towed]

This report documents a traffic offense.
    `,
    fieldMappings: {
      driver: "driver",
      vehicle: "vehicle",
      violation: "violation",
      location: "location",
      impairment: "impairment",
      testResults: "testResults",
      suspect: "suspect"
    },
    instructions: "Document traffic offense details including driver information, violation specifics, and test results."
  },

  // ========== JUVENILE OFFENSES TEMPLATE ==========
  JUVENILE: {
    id: "juvenile",
    name: "Juvenile Offense Report",
    category: "Juvenile",
    template: `
JUVENILE OFFENSE REPORT

INCIDENT DETAILS:
Date: [date]
Time: [time]
Location: [location]

JUVENILE INFORMATION:
[juvenile]

GUARDIAN INFORMATION:
[guardian]

OFFENSE DETAILS:
[offense]
[circumstances]

SCHOOL/AGENCY NOTIFICATION:
[school]
[agency]

DISPOSITION:
- Released to guardian: [released_to_guardian]
- Juvenile division notified: [juvenile_division]
- Additional actions: [additional_actions]

This report documents a juvenile offense.
    `,
    fieldMappings: {
      juvenile: "juvenile",
      guardian: "guardian",
      offense: "offense",
      circumstances: "circumstances",
      location: "location",
      school: "school",
      agency: "agency"
    },
    instructions: "Document juvenile offense details with appropriate sensitivity, including guardian notification and disposition."
  },

  // ========== DEFAULT TEMPLATE ==========
  DEFAULT: {
    id: "default",
    name: "General Offense Report",
    category: "Other",
    template: `
OFFENSE REPORT

INCIDENT DETAILS:
Date: [date]
Time: [time]
Location: [location]

SUSPECT INFORMATION:
[suspect]

OFFENSE DESCRIPTION:
[offense]

CIRCUMSTANCES:
[circumstances]

EVIDENCE/ACTIONS:
[evidence]

DISPOSITION:
[disposition]

This report documents the referenced offense.
    `,
    fieldMappings: {
      suspect: "suspect",
      offense: "offense",
      circumstances: "circumstances",
      location: "location",
      evidence: "evidence"
    },
    instructions: "Document general offense details including suspect information, circumstances, and evidence collected."
  }
};

// Template mapping function
export function getTemplateForOffense(offenseCategory: string, offenseName: string = ""): OffenseTemplate {
  const category = offenseCategory.toLowerCase();
  const name = offenseName.toLowerCase();

  // Homicide offenses
  if (category.includes('homicide') || name.includes('murder') || name.includes('manslaughter')) {
    return OFFENSE_TEMPLATES.HOMICIDE;
  }

  // Sex offenses
  if (category.includes('sex') || name.includes('rape') || name.includes('assault') || name.includes('fondling') || name.includes('sodomy')) {
    return OFFENSE_TEMPLATES.SEX_ASSAULT;
  }

  // Robbery
  if (category.includes('robbery')) {
    return OFFENSE_TEMPLATES.ROBBERY;
  }

  // Assault
  if (category.includes('assault') || name.includes('intimidation')) {
    return OFFENSE_TEMPLATES.ASSAULT;
  }

  // Burglary
  if (category.includes('burglary') || name.includes('breaking')) {
    return OFFENSE_TEMPLATES.BURGLARY;
  }

  // Theft
  if (category.includes('theft') || name.includes('larceny') || name.includes('shoplifting') || name.includes('stealing') || name.includes('pocket') || name.includes('purse')) {
    return OFFENSE_TEMPLATES.THEFT;
  }

  // Drug offenses
  if (category.includes('drug') || name.includes('narcotic')) {
    return OFFENSE_TEMPLATES.DRUG_OFFENSE;
  }

  // Weapons
  if (category.includes('weapon')) {
    return OFFENSE_TEMPLATES.WEAPONS;
  }

  // Fraud
  if (category.includes('fraud') || name.includes('forgery') || name.includes('counterfeit') || name.includes('embezzlement')) {
    return OFFENSE_TEMPLATES.FRAUD;
  }

  // Vice
  if (category.includes('vice') || name.includes('prostitution') || name.includes('gambling')) {
    return OFFENSE_TEMPLATES.VICE;
  }

  // Traffic
  if (category.includes('traffic') || name.includes('dui') || name.includes('driving')) {
    return OFFENSE_TEMPLATES.TRAFFIC;
  }

  // Juvenile
  if (category.includes('juvenile') || name.includes('runaway') || name.includes('truancy')) {
    return OFFENSE_TEMPLATES.JUVENILE;
  }

  // Default template
  return OFFENSE_TEMPLATES.DEFAULT;
}

// Helper to get template by offense
export function getTemplateByOffense(offense: OffenseType): OffenseTemplate {
  return getTemplateForOffense(offense.category, offense.name);
}