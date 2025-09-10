// codes.ts
import type { z } from "zod";
import type { VictimSchema, OffenderSchema } from "./schema";

// ---------------- COMPLETE NIBRS Offense Codes ----------------
export const NIBRS_OFFENSE_CODES: Record<string, string> = {
  // Homicide offenses
  "murder/nonnegligent manslaughter": "09A",
  "negligent manslaughter": "09B",
  "justifiable homicide": "09C",
  
  // Sex offenses
  "rape": "11A",
  "sodomy": "11B",
  "sexual assault with object": "11C",
  "fondling": "11D",
  
  // Robbery
  "robbery": "120",
  "armed robbery": "121", // CRITICAL MISSING CODE!
  
  // Assault offenses
  "aggravated assault": "13A",
  "simple assault": "13B", // CRITICAL MISSING CODE!
  "intimidation": "13C",
  
  // Burglary/breaking and entering
  "burglary": "220",
  "breaking and entering": "220",
  
  // Larceny-theft offenses
  "pocket-picking": "23A",
  "purse-snatching": "23B",
  "shoplifting": "23C", // CRITICAL MISSING CODE!
  "theft from building": "23D",
  "theft from coin-operated machine": "23E",
  "theft from motor vehicle": "23F",
  "theft of motor vehicle parts": "23G",
  "all other larceny": "23H",
  
  // Motor vehicle theft
  "motor vehicle theft": "240",
  "auto theft": "240",
  
  // Arson
  "arson": "200",
  
  // Fraud offenses
  "false pretenses/swindle/confidence game": "26A",
  "credit card/atm fraud": "26B",
  "impersonation": "26C",
  "welfare fraud": "26D",
  "wire fraud": "26E",
  "identity theft": "26F", // CRITICAL MISSING CODE!
  "hacking/computer invasion": "26G", // CRITICAL MISSING CODE!
  
  // Vandalism
  "vandalism": "290",
  "criminal mischief": "290",
  "destruction of property": "290",
  
  // Drug/narcotic offenses
  "drug/narcotic violations": "35A",
  "drug equipment violations": "35B",
  
  // Gambling offenses
  "gambling": "39A",
  "gambling equipment violations": "39B",
  "sports tampering": "39C",
  
  // Prostitution offenses
  "prostitution": "40A",
  "assisting or promoting prostitution": "40B",
  "purchasing prostitution": "40C",
  
  // Sex offenses (commercial)
  "human trafficking/commercial sex acts": "64A",
  "involuntary servitude": "64B",
  
  // Weapon law violations
  "weapon law violations": "520",
  "carrying concealed weapon": "520",
  "weapon possession": "520",
  
  // Assault on law enforcement
  "assault on law enforcement officer": "13A", // Uses same code but different context
  
  // DUI/DWI
  "driving under influence": "90D",
  "dui": "90D",
  "dwi": "90D",
  
  // Liquor law violations
  "liquor law violations": "90A",
  
  // Drunkenness
  "drunkenness": "90C", // CRITICAL MISSING CODE!
  "public intoxication": "90C",
  
  // Disorderly conduct
  "disorderly conduct": "90D",
  "disturbing the peace": "90D",
  
  // Vagrancy
  "vagrancy": "90E",
  
  // All other offenses
  "all other offenses": "90F",
  "suspicion": "90G",
  "curfew/loitering violations": "90H",
  "runaway": "90I"
};

// ---------------- ENHANCED NIBRS Location Codes ----------------
export const NIBRS_LOCATION_CODES: Record<string, string> = {
  "air/bus/train terminal": "01",
  "bank/savings and loan": "02",
  "bar/nightclub": "03",
  "convenience store": "04",
  "construction site": "05",
  "department/discount store": "06",
  "gas station": "07",
  "grocery/supermarket": "08",
  "liquor store": "09",
  "restaurant": "10",
  "parking lot/garage": "11", // Combined for better matching
  "highway/road/alley/street/sidewalk": "13",
  "government/public building": "14",
  "hotel/motel/etc.": "15",
  "church/synagogue/temple/mosque": "16",
  "park/playground": "17",
  "school/college": "18",
  "residence/home": "19", // Changed from 20 to correct code
  "apartment": "20", // Added apartment specific code
  "commercial/office building": "21",
  "industrial site": "22",
  "military installation": "23",
  "farm": "24",
  "lake/waterway": "25",
  "campground": "26",
  "marina": "27",
  "railroad property": "28",
  "unknown": "29",
  "other/not specified": "30"
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

// ---------------- ENHANCED NIBRS Property Codes ----------------
export const NIBRS_PROPERTY_CODES: Record<string, string> = {
  "currency": "01",
  "jewelry/precious metals": "02",
  "clothing/furs": "03",
  "locally stolen property": "04",
  "household goods": "05",
  "consumable goods": "06",
  "livestock": "07",
  "motor vehicle": "08",
  "aircraft": "09",
  "watercraft": "10",
  "firearms": "11",
  "television/radio/stereo": "12",
  "office equipment": "13",
  "electronic equipment": "14",
  "firearms-related articles": "15",
  "agricultural equipment": "16",
  "construction equipment": "17",
  "industrial equipment": "18",
  "merchandise": "19",
  "money orders": "20",
  "credit/debit cards": "21",
  "negotiable instruments": "22",
  "drugs/narcotics": "23",
  "tobacco products": "24",
  "tickets": "25",
  "documents": "26",
  "art objects": "27",
  "gems": "28",
  "medical supplies": "29",
  "chemicals": "30",
  "computer hardware/software": "31",
  "cellular phones": "32",
  "motor vehicle parts/accessories": "33",
  "other property": "34"
};

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