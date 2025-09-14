// codes.ts
import type { z } from "zod";
import type { VictimSchema, OffenderSchema } from "./schema";

export const NIBRS_GROUP_A_OFFENSE_CODES: Record<string, string> = {
  // Homicide
  "murder": "09A",
  "nonnegligent manslaughter": "09A",
  "negligent manslaughter": "09B",
  "justifiable homicide": "09C",
  
  // Sex offenses
  "rape": "11A",
  "sodomy": "11B",
  "sexual assault with object": "11C",
  "fondling": "11D",
  
  // Robbery
  "robbery": "120",
  "armed robbery": "121",
  
  // Assault
  "aggravated assault": "13A",
  "simple assault": "13B",
  "intimidation": "13C",
  
  // Burglary
  "burglary": "220",
  "breaking and entering": "220",
  "forced entry": "220",
  
  // Larceny
  "pocket-picking": "23A",
  "purse-snatching": "23B",
  "shoplifting": "23C",
  "theft from building": "23D",
  "theft from coin-operated machine": "23E",
  "theft from motor vehicle": "23F",
  "theft of motor vehicle parts": "23G",
  "all other larceny": "23H",
  "theft": "23H",
  "steal": "23H",
  "stolen": "23H",
  
  // Motor vehicle theft
  "motor vehicle theft": "240",
  "auto theft": "240",
  "car theft": "240",
  
  // Arson
  "arson": "200",
  
  // Fraud
  "fraud": "26A",
  "false pretenses": "26A",
  "credit card fraud": "26B",
  "impersonation": "26C",
  "welfare fraud": "26D",
  "wire fraud": "26E",
  "identity theft": "26F",
  "hacking": "26G",
  "computer invasion": "26G",
  "unauthorized access": "26G",
  
  // Vandalism
  "vandalism": "290",
  "criminal mischief": "290",
  "destruction of property": "290",
  "damage property": "290",
  "graffiti": "290",
  
  // Drug offenses - ENHANCED MAPPING
  "drug possession": "35A",
  "drug sale": "35B",
  "drug equipment": "35B",
  "narcotic violations": "35A",
  "cocaine": "35A",
  "methamphetamine": "35A",
  "heroin": "35A",
  "controlled substance": "35A",
  "narcotic": "35A",
  "meth": "35A",
  
  // Weapon law violations - ENHANCED MAPPING
  "weapon violation": "520",
  "firearm possession": "520",
  "weapon law": "520",
  "gun possession": "520",
  "prohibited weapon": "520",
  "handgun": "520",
  "firearm": "520",
  
  // Human trafficking
  "human trafficking": "64A",
  "involuntary servitude": "64B",
  "commercial sex acts": "64A"
};

// === GROUP B OFFENSE CODES (Only with arrest) ===
export const NIBRS_GROUP_B_OFFENSE_CODES: Record<string, string> = {
  "driving under influence": "90D",
  "dui": "90D",
  "dwi": "90D",
  "impaired driving": "90D",
  "public intoxication": "90C",
  "drunkenness": "90C",
  "disorderly conduct": "90D",
  "disturbing the peace": "90D"
};

// Combined for mapping (Group A prioritized)
export const NIBRS_OFFENSE_CODES = {
  ...NIBRS_GROUP_A_OFFENSE_CODES,
  ...NIBRS_GROUP_B_OFFENSE_CODES
};

// Enhanced location codes with proper mappings
export const NIBRS_LOCATION_CODES: Record<string, string> = {
  "air bus train terminal": "01",
  "bank": "02",
  "bar nightclub": "03",
  "convenience store": "04",
  "construction site": "05",
  "department store": "06",
  "discount store": "06",
  "target": "06",
  "walmart": "06",
  "gas station": "07",
  "grocery supermarket": "08",
  "liquor store": "09",
  "restaurant": "10",
  "cafe": "10",
  "parking lot": "11",
  "parking garage": "11",
  "highway": "13",
  "road": "13",
  "alley": "13",
  "street": "13",
  "sidewalk": "13",
  "interstate": "13",
  "freeway": "13",
  "government building": "14",
  "public building": "14",
  "hotel motel": "15",
  "church": "16",
  "synagogue": "16",
  "temple": "16",
  "mosque": "16",
  "park": "17",
  "playground": "17",
  "recreation": "17",
  "school": "18",
  "college": "18",
  "residence": "19",
  "home": "19",
  "apartment": "20",
  "condo": "20",
  "commercial building": "21",
  "office building": "21",
  "industrial site": "22",
  "military installation": "23",
  "farm": "24",
  "lake waterway": "25",
  "campground": "26",
  "marina": "27",
  "railroad property": "28",
  "unknown": "29",
  "other": "30",
  "not specified": "30"
};

// Enhanced property codes
export const NIBRS_PROPERTY_CODES: Record<string, string> = {
  "currency": "01",
  "cash": "01",
  "money": "01",
  "jewelry precious metals": "02",
  "jewelry": "02",
  "watch": "02",
  "ring": "02",
  "clothing furs": "03",
  "clothing": "03",
  "locally stolen property": "04",
  "household goods": "05",
  "consumable goods": "06",
  "livestock": "07",
  "motor vehicle": "08",
  "car": "08",
  "auto": "08",
  "truck": "08",
  "vehicle": "08",
  "aircraft": "09",
  "watercraft": "10",
  "firearms": "11",
  "gun": "11",
  "handgun": "11",
  "pistol": "11",
  "rifle": "11",
  "television radio stereo": "12",
  "tv": "12",
  "office equipment": "13",
  "electronic equipment": "14",
  "computer": "14",
  "laptop": "14",
  "tablet": "14",
  "firearms-related articles": "15",
  "agricultural equipment": "16",
  "construction equipment": "17",
  "industrial equipment": "18",
  "merchandise": "19",
  "money orders": "20",
  "credit debit cards": "21",
  "credit card": "21",
  "negotiable instruments": "22",
  "drugs narcotics": "23",
  "cocaine": "23",
  "methamphetamine": "23",
  "heroin": "23",
  "drug": "23",
  "narcotic": "23",
  "controlled substance": "23",
  "tobacco products": "24",
  "tickets": "25",
  "documents": "26",
  "art objects": "27",
  "gems": "28",
  "medical supplies": "29",
  "chemicals": "30",
  "computer hardware software": "31",
  "cellular phones": "32",
  "phone": "32",
  "iphone": "32",
  "motor vehicle parts accessories": "33",
  "other property": "34",
  "scale": "34",
  "baggie": "34",
  "paraphernalia": "34"
};

// ---------------- ENHANCED NIBRS Weapon Codes ----------------
export const NIBRS_WEAPON_CODES: Record<string, string> = {
  "handgun": "11",
  "rifle": "12",
  "shotgun": "13",
  "firearm (type not stated)": "14",
  "knife/cutting instrument": "15",
  "blunt object": "16",
  "motor vehicle": "17",
  "personal weapons (hands/feet/teeth)": "18", // Updated code
  "poison": "19",
  "explosives": "20",
  "fire/incendiary device": "21",
  "drugs/narcotics/sleeping pills": "22",
  "asphyxiation": "23",
  "other weapon": "24",
  "unknown weapon": "25",
  "none": "26"
};

// ---------------- ENHANCED NIBRS Victim-Offender Relationship Codes ----------------
export const NIBRS_RELATIONSHIP_CODES: Record<string, string> = {
  "spouse": "SP",
  "common-law spouse": "CS",
  "ex-spouse": "ES",
  "boyfriend": "BO",
  "girlfriend": "BO",
  "child": "CH",
  "stepchild": "SC",
  "grandchild": "GC",
  "parent": "PA",
  "stepparent": "SPP",
  "grandparent": "GP",
  "sibling": "SB",
  "stepsibling": "SS",
  "other family": "OF",
  "in-law": "IL",
  "friend": "FR",
  "neighbor": "NE",
  "acquaintance": "AQ",
  "babysittee": "BA",
  "employee": "EM",
  "employer": "ER",
  "otherwise known": "OK",
  "stranger": "SE",
  "business": "BU",
  "victim was offender": "VO",
  "victim was other offender": "OO",
  "unknown": "UN"
};

// ADD to existing codes.ts - Enhanced drug property mapping
export const NIBRS_DRUG_PROPERTY_CODES: Record<string, string> = {
  "cocaine": "10",
  "methamphetamine": "10", 
  "heroin": "10",
  "marijuana": "10",
  "controlled substance": "10",
  "narcotic": "10",
  "drug": "10",
  "crack": "10",
  "powder": "10",
  "white powder": "10",
  "pill": "10",
  "tablet": "10"
};

// Enhanced location codes for traffic scenarios
export const NIBRS_TRAFFIC_LOCATION_CODES: Record<string, string> = {
  "highway": "13",
  "road": "13", 
  "street": "13",
  "avenue": "13",
  "boulevard": "13",
  "interstate": "13",
  "freeway": "13",
  "intersection": "13",
  "parking lot": "18",
  "parking garage": "19"
};

// Enhanced exclusion patterns for traffic offenses
export const TRAFFIC_OFFENSE_EXCLUSIONS = [
  'traffic collision', 'vehicle accident', 'car crash', 'rear.end',
  'failure to stop', 'traffic violation', 'speeding', 'reckless driving',
  'at fault', 'liable', 'collision', 'accident', 'crash'
];

// ---------------- ENHANCED Matching Function ----------------
export function matchCode(
  input: string,
  table: Record<string, string>
): string | null {
  if (!input) return null;
  
  const inputLower = input.toLowerCase().trim();
  
  // 1. Exact match
  if (table[inputLower]) return table[inputLower];
  
  // 2. Direct contains match
  for (const [key, code] of Object.entries(table)) {
    if (inputLower.includes(key) || key.includes(inputLower)) {
      return code;
    }
  }
  
  // 3. Word-based matching with scoring
  let bestMatch: { code: string; score: number } | null = null;
  const inputWords = inputLower.split(/\s+/);
  
  for (const [key, code] of Object.entries(table)) {
    const keyWords = key.toLowerCase().split(/\s+/);
    let score = 0;
    
    // Count matching words
    for (const inputWord of inputWords) {
      for (const keyWord of keyWords) {
        if (inputWord.includes(keyWord) || keyWord.includes(inputWord)) {
          score++;
          break;
        }
      }
    }
    
    // Calculate match percentage
    const matchPercentage = score / Math.max(inputWords.length, keyWords.length);
    
    if (matchPercentage > 0.5 && (!bestMatch || matchPercentage > bestMatch.score)) {
      bestMatch = { code, score: matchPercentage };
    }
  }
  
  return bestMatch?.code || null;
}