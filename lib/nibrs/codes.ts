// Common NIBRS codes (extend as you need). Sources: FBI NIBRS data elements.
// Offense Codes (Group A selection—add more as needed)
export const NIBRS_OFFENSE_CODES: Record<string, string> = {
  // Person crimes
  "murder": "09A",
  "negligent manslaughter": "09B",
  "justifiable homicide": "09C",
  "kidnapping": "100",
  "rape": "11A",
  "sodomy": "11B",
  "sexual assault with object": "11C",
  "fondling": "11D",
  "robbery": "120",
  "aggravated assault": "13A",
  "simple assault": "13B",
  "intimidation": "13C",
  // Property crimes
  "burglary": "220",
  "larceny/theft": "23H",
  "motor vehicle theft": "240",
  "arson": "200",
  "vandalism": "290",
  // Drugs
  "drug/narcotic violations": "35A",
  "drug equipment violations": "35B",
  // Fraud
  "false pretenses/swindle": "26A",
  "credit card/atm fraud": "26B",
  "impersonation": "26C",
  "welfare fraud": "26D",
  "wire fraud": "26E",
  // Weapons
  "weapon law violations": "520",
  // DUI, etc.
  "driving under the influence": "90D",
  // Add more as needed...
};

// Location Type Codes
export const NIBRS_LOCATION_CODES: Record<string, string> = {
  "residence/home": "20",
  "highway/road/alley/street/sidewalk": "13",
  "parking/garage/lot": "19",
  "bar/nightclub": "05",
  "restaurant": "28",
  "school/college": "26",
  "government/public building": "14",
  "hotel/motel/etc.": "03",
  "gas station": "07",
  "bank/savings and loan": "02",
  "department/discount store": "06",
  "convenience store": "04",
  "church/synagogue/temple/mosque": "15",
  // Add more as needed...
};

// Weapon Codes
export const NIBRS_WEAPON_CODES: Record<string, string> = {
  "handgun": "13",
  "rifle": "11",
  "shotgun": "12",
  "firearm (other)": "12",
  "knife/cutting instrument": "15",
  "blunt object": "20",
  "personal weapons (hands/feet)": "40",
  "none": "99",
  // Add more as needed...
};

// Victim-Offender Relationship Codes
export const NIBRS_RELATIONSHIP_CODES: Record<string, string> = {
  "stranger": "SE",
  "spouse": "SP",
  "common-law spouse": "CS",
  "boyfriend/girlfriend": "BO",
  "child": "CH",
  "parent": "PA",
  "sibling": "SB",
  "other family member": "OF",
  "acquaintance": "AQ",
  "otherwise known": "OK",
  "unknown": "UN",
  // Add more as needed...
};

// Property Description Codes (subset)
export const NIBRS_PROPERTY_CODES: Record<string, string> = {
  "currency": "20",
  "jewelry": "37",
  "vehicle": "24",
  "computer hardware": "41",
  "credit/debit card": "10",
  "phone/cell phone/smartphone": "07",
  // Add more as needed...
};

// Simple helpers to fuzzy match strings to codes
export function matchCode(input: string, table: Record<string, string>): string | null {
  const key = input.trim().toLowerCase();
  if (table[key]) return table[key];

  // fuzzy contains
  const found = Object.keys(table).find(k => key.includes(k));
  return found ? table[found] : null;
}