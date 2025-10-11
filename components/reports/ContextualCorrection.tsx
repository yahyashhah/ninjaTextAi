import { useState, useEffect } from "react";

interface CorrectionData {
  error: string;
  missingFields: string[];
  requiredLevel?: string;
  suggestions: string[];
  warnings: string[];
  nibrsData?: any;
  confidence?: any;
  correctionContext?: any;
  type?: string;
  isComplete?: boolean;
  confidenceScore?: number;
  source?: "nibrs" | "template";
  errorCategory?: string;
  severity?: "REQUIRED" | "WARNING" | "OPTIONAL";
  guidance?: string;
  categorizedFields?: any;
  templateName?: string;
  // NEW: Add narrative context for contextual editing
  narrativeContext?: string;
  fieldPositions?: { [field: string]: { start: number; end: number } };
}

interface ContextualCorrectionUIProps {
  correctionData: CorrectionData;
  onCorrect: (correctedData: any) => void;
  onCancel: () => void;
  currentNarrative: string; // NEW: Current narrative text
  onUpdateNarrative: (updatedNarrative: string) => void; // NEW: Callback to update narrative
}

const ContextualCorrectionUI = ({
  correctionData,
  onCorrect,
  onCancel,
  currentNarrative,
  onUpdateNarrative
}: ContextualCorrectionUIProps) => {
  const [correctedData, setCorrectedData] = useState(correctionData.nibrsData || {});
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [fieldInsertionPoints, setFieldInsertionPoints] = useState<{ [key: string]: number }>({});
  const [narrativeText, setNarrativeText] = useState(currentNarrative);

  // Analyze narrative to find best insertion points for missing fields
  useEffect(() => {
    analyzeNarrativeStructure(currentNarrative);
  }, [currentNarrative, correctionData.missingFields]);

  const analyzeNarrativeStructure = (narrative: string) => {
    const sentences = narrative.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const insertionPoints: { [key: string]: number } = {};
    
    correctionData.missingFields?.forEach(field => {
      const fieldLower = field.toLowerCase();
      
      // Find the best position to insert this field
      if (fieldLower.includes("victim") || fieldLower.includes("person")) {
        // Insert after initial dispatch or contact
        const contactIndex = narrative.toLowerCase().indexOf("contact with");
        if (contactIndex > -1) {
          insertionPoints[field] = contactIndex + 13; // After "contact with"
        } else {
          insertionPoints[field] = narrative.length; // Fallback to end
        }
      } else if (fieldLower.includes("location") || fieldLower.includes("address")) {
        // Insert near beginning where location is typically mentioned
        const dispatchIndex = narrative.toLowerCase().indexOf("dispatched to");
        if (dispatchIndex > -1) {
          insertionPoints[field] = dispatchIndex + 13; // After "dispatched to"
        } else {
          insertionPoints[field] = narrative.length;
        }
      } else if (fieldLower.includes("time") || fieldLower.includes("date")) {
        // Insert at the beginning
        insertionPoints[field] = 0;
      } else if (fieldLower.includes("property") || fieldLower.includes("item")) {
        // Insert near the end where property is typically described
        insertionPoints[field] = narrative.length;
      } else {
        // Default: insert at the end
        insertionPoints[field] = narrative.length;
      }
    });
    
    setFieldInsertionPoints(insertionPoints);
  };

  // Insert text at a specific position in the narrative
  const insertTextAtPosition = (text: string, position: number, field: string) => {
    const before = narrativeText.slice(0, position);
    const after = narrativeText.slice(position);
    
    // Format the insertion appropriately
    let formattedText = text;
    if (position === 0) {
      // At beginning - capitalize and add period
      formattedText = text.charAt(0).toUpperCase() + text.slice(1);
      if (!formattedText.endsWith('.')) formattedText += '.';
    } else if (position === narrativeText.length) {
      // At end - add proper punctuation
      if (!narrativeText.endsWith('.') && !narrativeText.endsWith('!') && !narrativeText.endsWith('?')) {
        formattedText = '. ' + formattedText;
      } else {
        formattedText = ' ' + formattedText;
      }
    } else {
      // In middle - add space and ensure proper flow
      formattedText = ' ' + formattedText;
    }
    
    const newNarrative = before + formattedText + after;
    setNarrativeText(newNarrative);
    onUpdateNarrative(newNarrative);
    
    // Remove the field from missing fields after insertion
    const updatedMissingFields = correctionData.missingFields?.filter(f => f !== field) || [];
    
    // If all fields are filled, auto-submit
    if (updatedMissingFields.length === 0) {
      setTimeout(() => {
        onCorrect({ ...correctedData, narrative: newNarrative });
      }, 500);
    }
  };

  // Quick add options with contextual formatting
  const getContextualOptions = (field: string, position: number) => {
    const fieldLower = field.toLowerCase();
    const isBeginning = position === 0;
    const isMiddle = position > 0 && position < narrativeText.length;
    
    const baseOptions: { [key: string]: string[] } = {
      "victim information": [
        "The victim was identified as an adult male, approximately 30 years old",
        "I made contact with a female victim who reported minor injuries",
        "Multiple victims were present at the scene and provided statements",
        "The business owner, acting as victim, reported property damage"
      ],
      "location": [
        "at 123 Main Street in the downtown area",
        "in the parking lot of the shopping center on Oak Avenue",
        "within the residential complex at 456 Elm Street",
        "at the commercial establishment located on 789 Pine Road"
      ],
      "offense description": [
        "in reference to a burglary with forcible entry",
        "regarding an assault that resulted in minor injuries", 
        "concerning a theft of personal property from a vehicle",
        "about a drug possession violation that was observed"
      ],
      "property details": [
        "The stolen property included electronic devices valued at approximately $500",
        "Damage was observed to the vehicle with an estimated repair cost of $1,200",
        "Missing items consisted of cash in the amount of $250 and personal documents",
        "The property involved was described as jewelry with an estimated value of $800"
      ],
      "incident date and time": [
        "On today's date at approximately 14:30 hours,",
        "The incident occurred yesterday evening around 8:00 PM",
        "This event took place on the current date during daylight hours",
        "At approximately 10:15 AM today,"
      ],
      "suspect description": [
        "The suspect was described as a white male, approximately 6 feet tall",
        "Witnesses described the offender as a Hispanic female wearing dark clothing",
        "The individual was observed to be a black male with a medium build",
        "No suspect description was available at this time"
      ]
    };

    // Find matching options
    for (const [key, options] of Object.entries(baseOptions)) {
      if (fieldLower.includes(key)) {
        return options;
      }
    }
    
    // Default options
    return [
      `Additional information regarding ${field.toLowerCase()}`,
      `Specific details about ${field.toLowerCase()} were documented`,
      `The ${field.toLowerCase()} was thoroughly examined and recorded`,
      `Further investigation revealed details about ${field.toLowerCase()}`
    ];
  };

  // Handle contextual insertion
  const handleContextualInsert = (field: string, option: string) => {
    const position = fieldInsertionPoints[field] || narrativeText.length;
    insertTextAtPosition(option, position, field);
  };

  // Handle custom text insertion
  const handleCustomInsert = () => {
    if (selectedField && customInput.trim()) {
      const position = fieldInsertionPoints[selectedField] || narrativeText.length;
      insertTextAtPosition(customInput, position, selectedField);
      setSelectedField(null);
      setCustomInput("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <span className="text-xl">✏️</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Complete Your Report
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Add missing information in the appropriate places
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-gray-400 hover:text-gray-600">✕</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Narrative Preview */}
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Current Narrative</h3>
              <p className="text-gray-600 text-sm mt-1">
                Missing information will be inserted where it makes the most sense
              </p>
            </div>
            <div className="p-4 bg-white">
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-3 bg-gray-50">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {narrativeText || "No narrative content yet..."}
                </p>
              </div>
            </div>
          </div>

          {/* Missing Fields Section */}
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-orange-50 px-4 py-3 border-b border-orange-200">
              <div className="flex items-center space-x-2">
                <span className="text-orange-600">📋</span>
                <h3 className="font-semibold text-orange-800">
                  Missing Information ({correctionData.missingFields?.length || 0})
                </h3>
              </div>
              <p className="text-orange-700 text-sm mt-1">
                {correctionData.error}
              </p>
            </div>
            
            <div className="p-4 space-y-4">
              {correctionData.missingFields?.map((field, index) => (
                <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{field}</h4>
                      <p className="text-gray-500 text-sm mt-1">
                        Will be inserted where it contextually fits
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedField(field)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Custom Input
                    </button>
                  </div>

                  {/* Quick Insert Options */}
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Quick insert:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {getContextualOptions(field, fieldInsertionPoints[field] || 0).map((option, optionIndex) => (
                        <button
                          key={optionIndex}
                          onClick={() => handleContextualInsert(field, option)}
                          className="text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-sm transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          {correctionData.suggestions && correctionData.suggestions.length > 0 && (
            <div className="border border-purple-200 rounded-lg">
              <div className="bg-purple-50 px-4 py-3 border-b border-purple-200">
                <div className="flex items-center space-x-2">
                  <span className="text-purple-600">💡</span>
                  <h3 className="font-semibold text-purple-800">Suggestions</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {correctionData.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <p className="text-purple-800 text-sm">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {correctionData.missingFields?.length || 0} fields remaining
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onCorrect({ ...correctedData, narrative: narrativeText })}
              disabled={(correctionData.missingFields?.length || 0) > 0}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Submit Complete Report
            </button>
          </div>
        </div>
      </div>

      {/* Custom Input Modal */}
      {selectedField && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Add Custom Information</h3>
            <p className="text-gray-600 text-sm mb-4">
              Add details about: <strong>{selectedField}</strong>
            </p>
            
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder={`Describe ${selectedField.toLowerCase()} in your own words...`}
              className="w-full h-32 p-3 border border-gray-300 rounded text-sm resize-none"
            />
            
            <div className="flex justify-between items-center mt-4">
              <p className="text-xs text-gray-500">
                This will be inserted where it makes the most sense in your narrative
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedField(null);
                    setCustomInput("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomInsert}
                  disabled={!customInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Insert into Narrative
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextualCorrectionUI;