// components/reports/sub-components/EnhancedCorrectionUI.tsx - FIXED VERSION
import { useState, useEffect } from "react";
import { OffenseType, GROUP_A_OFFENSES } from "@/constants/offences";
import { getFieldExamples, getQuickFillOptions } from "@/lib/field-utils";
import MultiOffenseSelector from "./OffenceSelector";

interface ExtractedFieldData {
  field: string;
  value: string;
  confidence: number;
  source: string;
}

interface OffenseValidationResult {
  suggestedOffense: OffenseType | null;
  confidence: number;
  reason: string;
  matches: string[];
  mismatches: string[];
  alternativeOffenses: OffenseType[];
}

interface MultiOffenseValidation {
  validatedOffenses: {
    offense: OffenseType;
    validation: any;
    offenseValidation?: any;
  }[];
  allComplete: boolean;
  combinedMissingFields: string[];
  combinedPresentFields: string[];
  primaryOffense?: OffenseType;
  allExtractedData?: ExtractedFieldData[];
  allStructuredData?: Record<string, any>;
}

interface CorrectionData {
  error: string;
  missingFields: string[];
  requiredLevel?: string;
  suggestions: string[];
  warnings: string[];
  nibrsData: any;
  confidence?: any;
  correctionContext?: any;
  type?: string;
  isComplete?: boolean;
  confidenceScore?: number;
  source?: "nibrs" | "template" | "offense";
  errorCategory?: string;
  severity?: "REQUIRED" | "WARNING" | "OPTIONAL";
  guidance?: string;
  categorizedFields?: any;
  templateName?: string;
  offenseName?: string;
  offenseCode?: string;
  offenses?: OffenseType[];
  fieldExamples?: { [key: string]: string };
  validationDetails?: any;
  sessionKey?: string;
  originalNarrative?: string;
  offenseValidation?: OffenseValidationResult;
  multiOffenseValidation?: MultiOffenseValidation;
  extractedData?: ExtractedFieldData[];
  structuredData?: Record<string, any>;
  missingUniversalFields?: string[];
}

interface EnhancedCorrectionUIProps {
  correctionData: CorrectionData;
  onCorrect: (correctedData: { 
    enhancedPrompt: string; 
    sessionKey?: string;
    newOffenses?: OffenseType[];
  }) => void;
  onCancel: () => void;
  currentInput: string;
  offenses: OffenseType[];
}

// UNIVERSAL FIELD DEFINITIONS - MATCHING BACKEND
const UNIVERSAL_REQUIRED_FIELDS = [
  'incidentDate',
  'incidentTime', 
  'locationDescription'
];

const UNIVERSAL_FIELD_DEFINITIONS = {
  incidentDate: {
    label: "Incident Date",
    description: "The date when the incident occurred",
    required: true,
    examples: "2024-01-15, January 15, 2024, yesterday, last Tuesday"
  },
  incidentTime: {
    label: "Incident Time", 
    description: "The time when the incident occurred",
    required: true,
    examples: "14:30, 2:30 PM, around noon, approximately 10:00"
  },
  locationDescription: {
    label: "Location Description",
    description: "Where the incident took place",
    required: true,
    examples: "123 Main Street, parking lot of Walmart, near the intersection of 5th and Elm"
  }
};

const CorrectionUI = ({
  correctionData,
  onCorrect,
  onCancel,
  currentInput,
  offenses = []
}: EnhancedCorrectionUIProps) => {
  const [fieldInputs, setFieldInputs] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOffenses, setSelectedOffenses] = useState<OffenseType[]>(offenses);
  const [showOffenseSelector, setShowOffenseSelector] = useState(false);

  // Check if this is an offense type mismatch error
  const isOffenseTypeMismatch = correctionData.type === "offense_type_validation_error";
  const hasOffenseValidation = !!correctionData.offenseValidation;
  const isMultipleOffenses = offenses.length > 1;

  // Initialize field inputs WITH EXTRACTED DATA - PRIORITIZE UNIVERSAL FIELDS
  useEffect(() => {
    if (isOffenseTypeMismatch) return; // Don't initialize fields for offense mismatch

    const initialInputs: Record<string, string> = {};
    
    // Get all missing fields including universal ones
    const allMissingFields = [...(correctionData.missingFields || [])];
    
    allMissingFields.forEach(field => {
      // Check if we have extracted data for this field
      const extractedValue = correctionData.extractedData?.find(
        item => item.field === field
      )?.value;
      
      // Pre-fill with extracted data if available
      initialInputs[field] = extractedValue || "";
    });
    
    setFieldInputs(initialInputs);
  }, [correctionData.missingFields, correctionData.extractedData, isOffenseTypeMismatch]);

  // Initialize selected offenses from props
  useEffect(() => {
    setSelectedOffenses(offenses);
  }, [offenses]);

  // Handle field input change
  const handleFieldInputChange = (field: string, value: string) => {
    setFieldInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle offenses change
  const handleOffensesChange = (newOffenses: OffenseType[]) => {
    setSelectedOffenses(newOffenses);
  };

  // Handle offense selection from mismatch suggestions
  const handleOffenseSuggestionSelect = (suggestedOffense: OffenseType) => {
    setSelectedOffenses([suggestedOffense]);
  };

  // Generate comprehensive enhanced prompt
  const generateEnhancedPrompt = () => {
    const originalNarrative = correctionData.originalNarrative || currentInput;
    
    let enhancedPrompt = originalNarrative;
    
    // Only add field information if we're not in offense mismatch mode
    if (!isOffenseTypeMismatch) {
      const newInformation: string[] = [];
      
      // PRIORITIZE UNIVERSAL FIELDS IN THE OUTPUT
      Object.entries(fieldInputs)
        .sort(([fieldA], [fieldB]) => {
          // Sort universal fields first
          const aIsUniversal = UNIVERSAL_REQUIRED_FIELDS.includes(fieldA);
          const bIsUniversal = UNIVERSAL_REQUIRED_FIELDS.includes(fieldB);
          
          if (aIsUniversal && !bIsUniversal) return -1;
          if (!aIsUniversal && bIsUniversal) return 1;
          return 0;
        })
        .forEach(([field, value]) => {
          if (value.trim()) {
            let fieldLabel = getFieldLabel(field);
            
            newInformation.push(`${fieldLabel}: ${value.trim()}`);
          }
        });

      if (newInformation.length > 0) {
        enhancedPrompt += "\n\n--- SUPPLEMENTAL INVESTIGATIVE INFORMATION ---\n";
        newInformation.forEach(info => {
          enhancedPrompt += `• ${info}\n`;
        });
        
        enhancedPrompt += "--- END SUPPLEMENTAL INFORMATION ---\n";
      }
    }

    return enhancedPrompt;
  };

  // FIXED: Handle form submission for multiple offenses
  const handleSubmit = async () => {
    if (isSubmitting) return;

    // For offense type mismatch, we don't check field completion
    if (!isOffenseTypeMismatch) {
      // Check if mandatory universal fields are filled - ONLY CHECK UNIVERSAL FIELDS
      const missingUniversalFields = correctionData.missingUniversalFields || [];
      const unfilledUniversalFields = missingUniversalFields.filter(
        field => !fieldInputs[field]?.trim()
      );

      if (unfilledUniversalFields.length > 0) {
        const universalFieldNames = unfilledUniversalFields.map(field => 
          UNIVERSAL_FIELD_DEFINITIONS[field as keyof typeof UNIVERSAL_FIELD_DEFINITIONS]?.label || field
        ).join(', ');
        
        if (!confirm(`The following MANDATORY fields are still empty: ${universalFieldNames}. These are required for all police reports. Continue anyway?`)) {
          return;
        }
      }

      // For multiple offenses, don't require ALL fields to be filled
      // Just check if at least some information was provided
      const filledFields = Object.values(fieldInputs).filter(value => value.trim()).length;
      
      if (filledFields === 0) {
        if (!confirm("You haven't provided any additional information. The report may still be incomplete. Continue anyway?")) {
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const enhancedPrompt = generateEnhancedPrompt();
      
      const submissionData: any = { 
        enhancedPrompt,
        sessionKey: correctionData.sessionKey
      };

      // Check if offenses changed
      const offensesChanged = JSON.stringify(selectedOffenses.map(o => o.id).sort()) !== 
                            JSON.stringify(offenses.map(o => o.id).sort());

      if (offensesChanged) {
        submissionData.newOffenses = selectedOffenses;
      }
      
      await onCorrect(submissionData);
      
    } catch (error) {
      console.error("❌ Error in handleSubmit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get field importance - ENHANCED TO PRIORITIZE UNIVERSAL FIELDS
  const getFieldImportance = (field: string) => {
    // UNIVERSAL FIELDS ARE ALWAYS CRITICAL
    if (UNIVERSAL_REQUIRED_FIELDS.includes(field)) {
      return { level: "critical", label: "Mandatory", color: "red" };
    }
    
    if (correctionData.categorizedFields?.offenseSpecific?.critical?.includes(field)) {
      return { level: "critical", label: "Critical", color: "red" };
    }
    if (correctionData.categorizedFields?.offenseSpecific?.important?.includes(field)) {
      return { level: "important", label: "Important", color: "orange" };
    }
    return { level: "standard", label: "Required", color: "blue" };
  };

  // FIXED: Calculate completion progress for multiple offenses
  const completionProgress = () => {
    if (isOffenseTypeMismatch) {
      // For offense mismatch, progress is based on whether user selected a different offense
      const offensesChanged = JSON.stringify(selectedOffenses.map(o => o.id).sort()) !== 
                            JSON.stringify(offenses.map(o => o.id).sort());
      return offensesChanged ? 100 : 50;
    }

    const filledFields = Object.values(fieldInputs).filter(value => value.trim()).length;
    const totalFields = correctionData.missingFields?.length || 0;
    
    if (totalFields === 0) return 0;
    
    // Calculate base progress
    let baseProgress = (filledFields / totalFields) * 100;
    
    // For multiple offenses, don't penalize as heavily for missing fields
    // since not all fields may be applicable to all offenses
    if (isMultipleOffenses) {
      // For multiple offenses, be more lenient - 50% is acceptable
      baseProgress = Math.min(100, baseProgress * 1.5);
    }
    
    // Still penalize for missing universal fields
    const missingUniversalFields = correctionData.missingUniversalFields || [];
    const unfilledUniversalFields = missingUniversalFields.filter(
      field => !fieldInputs[field]?.trim()
    );
    
    if (unfilledUniversalFields.length > 0) {
      baseProgress = Math.max(0, baseProgress - (unfilledUniversalFields.length * 15));
    }
    
    return Math.round(baseProgress);
  };

  const progress = completionProgress();

  // Get display name for offenses
  const getOffenseDisplayName = () => {
    if (selectedOffenses.length === 0) return 'No offense selected';
    if (selectedOffenses.length === 1) return selectedOffenses[0].name;
    return `${selectedOffenses.length} offenses`;
  };

  // Get field label - PRIORITIZE UNIVERSAL FIELD DEFINITIONS
  const getFieldLabel = (field: string): string => {
    // Check universal fields first
    if (UNIVERSAL_REQUIRED_FIELDS.includes(field)) {
      return UNIVERSAL_FIELD_DEFINITIONS[field as keyof typeof UNIVERSAL_FIELD_DEFINITIONS]?.label || field;
    }
    
    // Then check offense-specific definitions
    for (const offense of selectedOffenses) {
      const definition = offense.fieldDefinitions?.[field];
      if (definition?.label) return definition.label;
    }
    return field;
  };

  // Get field description - PRIORITIZE UNIVERSAL FIELD DEFINITIONS
  const getFieldDescription = (field: string): string => {
    // Check universal fields first
    if (UNIVERSAL_REQUIRED_FIELDS.includes(field)) {
      return UNIVERSAL_FIELD_DEFINITIONS[field as keyof typeof UNIVERSAL_FIELD_DEFINITIONS]?.description || 'Required information for police reports';
    }
    
    // Then check offense-specific definitions
    for (const offense of selectedOffenses) {
      const definition = offense.fieldDefinitions?.[field];
      if (definition?.description) return definition.description;
    }
    return 'Required information for the selected offenses';
  };

  // Get proper examples and quick options - PRIORITIZE UNIVERSAL FIELD EXAMPLES
  const getFieldExample = (field: string): string => {
    // Check universal fields first
    if (UNIVERSAL_REQUIRED_FIELDS.includes(field)) {
      return UNIVERSAL_FIELD_DEFINITIONS[field as keyof typeof UNIVERSAL_FIELD_DEFINITIONS]?.examples || `Provide ${field}`;
    }
    
    // Use the field examples from correction data
    if (correctionData.fieldExamples?.[field]) {
      return correctionData.fieldExamples[field];
    }
    
    // Use the first offense category for context
    const offenseCategory = selectedOffenses[0]?.category || 'general';
    return getFieldExamples(field, offenseCategory);
  };

  const getFieldQuickOptions = (field: string): string[] => {
    return getQuickFillOptions(field);
  };

  // Check if field is universal
  const isUniversalField = (field: string): boolean => {
    return UNIVERSAL_REQUIRED_FIELDS.includes(field);
  };

  // Sort fields: universal first, then by importance
  const getSortedMissingFields = () => {
    const missingFields = correctionData.missingFields || [];
    
    return [...missingFields].sort((a, b) => {
      const aIsUniversal = isUniversalField(a);
      const bIsUniversal = isUniversalField(b);
      
      // Universal fields come first
      if (aIsUniversal && !bIsUniversal) return -1;
      if (!aIsUniversal && bIsUniversal) return 1;
      
      // Then sort by importance
      const aImportance = getFieldImportance(a);
      const bImportance = getFieldImportance(b);
      
      const importanceOrder = { critical: 0, important: 1, standard: 2 };
      return importanceOrder[aImportance.level as keyof typeof importanceOrder] - importanceOrder[bImportance.level as keyof typeof importanceOrder];
    });
  };

  const sortedMissingFields = getSortedMissingFields();

  // RENDER OFFENSE TYPE MISMATCH UI
  if (isOffenseTypeMismatch && correctionData.offenseValidation) {
    const offenseValidation = correctionData.offenseValidation;
    const suggestedOffense = offenseValidation.suggestedOffense;
    const currentOffense = offenses[0]; // Assuming single offense for mismatch

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Review Offense Classification
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  The narrative may better match a different offense type
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <span className="text-gray-400 hover:text-gray-600 text-lg">✕</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Current vs Suggested */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Offense */}
              <div className="border border-gray-300 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Current Selection</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{currentOffense?.name}</p>
                  <p className="text-xs text-gray-500">{currentOffense?.description}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      Confidence: {Math.round((offenseValidation.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Suggested Offense */}
              {suggestedOffense && (
                <div className="border border-blue-300 bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Suggested Offense</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-blue-800 font-medium">{suggestedOffense.name}</p>
                    <p className="text-xs text-blue-700">{suggestedOffense.description}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        Better Match
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reasoning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Analysis</h4>
              <p className="text-sm text-yellow-700">{offenseValidation.reason}</p>
              
              {/* Matches & Mismatches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {offenseValidation.matches.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-green-700 mb-1">✓ Matching Elements</h5>
                    <ul className="text-xs text-green-600 space-y-1">
                      {offenseValidation.matches.slice(0, 3).map((match, index) => (
                        <li key={index}>• {match}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {offenseValidation.mismatches.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-red-700 mb-1">✗ Mismatched Elements</h5>
                    <ul className="text-xs text-red-600 space-y-1">
                      {offenseValidation.mismatches.slice(0, 3).map((mismatch, index) => (
                        <li key={index}>• {mismatch}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Alternative Offenses */}
            {offenseValidation.alternativeOffenses.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Other Possible Offenses</h4>
                <div className="space-y-2">
                  {offenseValidation.alternativeOffenses.slice(0, 3).map((offense, index) => (
                    <button
                      key={offense.id}
                      onClick={() => handleOffenseSuggestionSelect(offense)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{offense.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{offense.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              {suggestedOffense && (
                <button
                  onClick={() => handleOffenseSuggestionSelect(suggestedOffense)}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Switch to {suggestedOffense.name}
                </button>
              )}
              
              <button
                onClick={() => setSelectedOffenses(offenses)} // Keep current selection
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Keep Current Selection ({currentOffense?.name})
              </button>

              <button
                onClick={() => setShowOffenseSelector(true)}
                className="w-full py-3 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Choose Different Offense
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-white">
            <div className="text-sm text-gray-500">
              {selectedOffenses[0]?.id !== offenses[0]?.id ? (
                <span className="text-green-600 font-medium">Offense changed to {selectedOffenses[0]?.name}</span>
              ) : (
                "Select an offense to continue"
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedOffenses.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Continuing...</span>
                  </>
                ) : (
                  <span>Continue with {selectedOffenses[0]?.name}</span>
                )}
              </button>
            </div>
          </div>

          {/* Offense Selector Modal */}
          {showOffenseSelector && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Select Offense Type</h3>
                </div>
                <div className="p-6">
                  <MultiOffenseSelector
                    onOffensesSelect={(newOffenses) => {
                      setSelectedOffenses(newOffenses);
                      setShowOffenseSelector(false);
                    }}
                    onBack={() => setShowOffenseSelector(false)}
                    initialSelectedOffenses={selectedOffenses}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDER STANDARD FIELD COMPLETION UI
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Complete Your Report
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Add missing information for {getOffenseDisplayName()}
                {correctionData.missingUniversalFields && correctionData.missingUniversalFields.length > 0 && (
                  <span className="text-red-600 font-medium ml-2">
                    • {correctionData.missingUniversalFields.length} mandatory field(s) required
                  </span>
                )}
                {isMultipleOffenses && (
                  <span className="text-blue-600 font-medium ml-2">
                    • Multiple offenses selected
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <span className="text-gray-400 hover:text-gray-600 text-lg">✕</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Completion Progress
            </span>
            <span className="text-sm text-gray-500">
              {progress}% ({Object.values(fieldInputs).filter(v => v.trim()).length}/{correctionData.missingFields?.length || 0})
              {isMultipleOffenses && " (Multiple offenses - more lenient)"}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                progress < 50 ? 'bg-red-500' :
                progress < 80 ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Universal Fields Warning */}
        {correctionData.missingUniversalFields && correctionData.missingUniversalFields.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 mx-6 mt-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-red-500 mt-0.5">🔴</span>
              <div>
                <p className="text-sm text-red-800 font-medium">
                  Mandatory Fields Required
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Date, time, and location are required for all police reports. Please provide these details below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Multiple Offenses Guidance */}
        {isMultipleOffenses && (
          <div className="p-4 bg-blue-50 border border-blue-200 mx-6 mt-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">ℹ️</span>
              <div>
                <p className="text-sm text-blue-800 font-medium">
                  Multiple Offenses Selected
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  You have selected {offenses.length} offenses. Not all fields may apply to every offense. 
                  Focus on providing the most critical information first.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* General Guidance */}
        <div className="p-4 bg-blue-50 border border-blue-200 mx-6 mt-4 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 mt-0.5">💡</span>
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Fill in all missing fields below. All information will be combined with your original report.
              </p>
              <p className="text-sm text-blue-700 mt-1">
                <strong>Mandatory fields</strong> (in red) must be completed for report generation.
                {isMultipleOffenses && " For multiple offenses, focus on the most critical information first."}
              </p>
            </div>
          </div>
        </div>

        {/* Missing Fields Form */}
        <div className="p-6 space-y-6">
          {sortedMissingFields.map((field, index) => {
            const importance = getFieldImportance(field);
            const example = getFieldExample(field);
            const quickOptions = getFieldQuickOptions(field);
            const extractedValue = correctionData.extractedData?.find(item => item.field === field)?.value;
            const isUniversal = isUniversalField(field);

            return (
              <div 
                key={index} 
                className={`p-4 bg-white border rounded-lg shadow-sm ${
                  isUniversal ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {isUniversal && (
                        <span className="text-red-500 text-sm">🔴</span>
                      )}
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        importance.color === 'red' ? 'bg-red-500' :
                        importance.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}></span>
                      <h4 className={`font-medium ${
                        isUniversal ? 'text-red-900' : 'text-gray-900'
                      }`}>
                        {getFieldLabel(field)}
                        {isUniversal && (
                          <span className="ml-2 text-xs text-red-600">(Mandatory)</span>
                        )}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        importance.color === 'red' ? 'bg-red-100 text-red-800' :
                        importance.color === 'orange' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {importance.label}
                      </span>
                    </div>
                    <p className={`text-sm mb-2 ${
                      isUniversal ? 'text-red-700' : 'text-gray-600'
                    }`}>
                      {getFieldDescription(field)}
                    </p>
                    
                    {/* Example */}
                    <div className={`p-3 rounded border mb-3 ${
                      isUniversal ? 'bg-red-100 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <p className={`text-sm ${
                        isUniversal ? 'text-red-800' : 'text-gray-700'
                      }`}>
                        <strong>Example:</strong> {example}
                      </p>
                    </div>

                    {/* Text Input */}
                    <textarea
                      value={fieldInputs[field] || ""}
                      onChange={(e) => handleFieldInputChange(field, e.target.value)}
                      placeholder={`Describe ${getFieldLabel(field).toLowerCase()} in detail...`}
                      className={`w-full h-24 p-3 border rounded text-sm resize-none focus:ring-2 focus:border-blue-500 ${
                        isUniversal 
                          ? 'border-red-300 focus:ring-red-500 bg-white' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />

                    {/* Quick Fill Options */}
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Quick options:</p>
                      <div className="flex flex-wrap gap-2">
                        {quickOptions.map((option, optionIndex) => (
                          <button
                            key={optionIndex}
                            onClick={() => handleFieldInputChange(field, option)}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors border border-gray-300"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-white sticky bottom-0">
          <div className="text-sm text-gray-500">
            {progress === 100 ? (
              <span className="text-green-600 font-medium">All fields completed! Ready to generate.</span>
            ) : correctionData.missingUniversalFields && correctionData.missingUniversalFields.length > 0 ? (
              <span className="text-red-600 font-medium">
                Mandatory fields required: {correctionData.missingUniversalFields.length} remaining
              </span>
            ) : isMultipleOffenses ? (
              <span className="text-blue-600 font-medium">
                Multiple offenses: {progress}% complete - focus on critical information
              </span>
            ) : (
              "Fill in missing information above."
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <span>Generate Complete Report</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrectionUI;