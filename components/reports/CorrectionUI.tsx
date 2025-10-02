// components/reports/sub-components/UnifiedCorrectionUI.tsx
import { useState, useEffect } from "react";

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
  source?: "nibrs" | "template";
  errorCategory?: string;
  severity?: "REQUIRED" | "WARNING" | "OPTIONAL";
  guidance?: string;
  categorizedFields?: any;
  templateName?: string;
}

interface UnifiedCorrectionUIProps {
  correctionData: CorrectionData;
  onCorrect: (correctedData: any) => void;
  onCancel: () => void;
  onAddMissingInfo?: (field: string) => void;
}

const UnifiedCorrectionUI = ({
  correctionData,
  onCorrect,
  onCancel,
  onAddMissingInfo
}: UnifiedCorrectionUIProps) => {
  const [correctedData, setCorrectedData] = useState(correctionData.nibrsData || {});
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState("");

  // Get error source information
  const getErrorSourceInfo = (source: "template" | "nibrs") => {
    switch (source) {
      case "template":
        return {
          title: "Template Requirements",
          description: "Missing information for your report template",
          icon: "📋",
          color: "blue"
        };
      case "nibrs":
        return {
          title: "NIBRS Standards", 
          description: "Required for federal crime reporting",
          icon: "🏛️",
          color: "green"
        };
      default:
        return {
          title: "Report Requirements",
          description: "Additional information needed",
          icon: "⚠️",
          color: "gray"
        };
    }
  };

  // Initialize corrected data
  useEffect(() => {
    if (correctionData.nibrsData) {
      setCorrectedData(correctionData.nibrsData);
    }
  }, [correctionData.nibrsData]);

  // Handle adding custom information to narrative
  const handleAddCustomInfo = () => {
    if (selectedField && customInput.trim() && onAddMissingInfo) {
      onAddMissingInfo(`${selectedField}: ${customInput}`);
      setSelectedField(null);
      setCustomInput("");
    }
  };

  // Quick add options for common fields
  const getQuickOptions = (field: string) => {
    const options: { [key: string]: string[] } = {
      "victim information": [
        "Adult male victim, approximately 30 years old",
        "Female victim, minor injuries sustained",
        "Multiple victims involved in the incident",
        "Business victim, property damage only"
      ],
      "location": [
        "Residential address at 123 Main Street",
        "Commercial establishment on Oak Avenue", 
        "Public park near downtown area",
        "Parking lot of shopping center"
      ],
      "offense description": [
        "Forcible entry burglary of residence",
        "Simple assault resulting in minor injuries",
        "Theft of personal property from vehicle",
        "Drug possession violation observed"
      ],
      "property details": [
        "Electronic devices valued at $500",
        "Cash amount of $250 stolen",
        "Vehicle damaged during incident",
        "Personal documents and identification"
      ],
      "incident date and time": [
        "Occurred on today's date during daylight hours",
        "Incident happened yesterday evening around 8 PM",
        "Date of occurrence is within the past 24 hours",
        "Time of incident was during business hours"
      ]
    };

    const fieldLower = field.toLowerCase();
    for (const [key, values] of Object.entries(options)) {
      if (fieldLower.includes(key)) {
        return values;
      }
    }
    
    return [
      `Detailed information about ${field.toLowerCase()}`,
      `Specific circumstances regarding ${field.toLowerCase()}`,
      `Complete description of ${field.toLowerCase()}`,
      `Additional details for ${field.toLowerCase()}`
    ];
  };

  // Handle quick add
  const handleQuickAdd = (field: string, option: string) => {
    if (onAddMissingInfo) {
      onAddMissingInfo(option);
    }
  };

  // Handle form field changes for NIBRS data
  const handleFieldChange = (fieldType: string, value: string) => {
    setCorrectedData((prev: any) => {
      const newData = { ...prev };
      
      switch (fieldType) {
        case "incidentDate":
          if (!newData.administrative) newData.administrative = {};
          newData.administrative.incidentDate = value;
          break;
        case "victimType":
          if (!newData.victims || newData.victims.length === 0) {
            newData.victims = [{}];
          }
          newData.victims[0].type = value;
          break;
        case "offenseDescription":
          if (!newData.offenses || newData.offenses.length === 0) {
            newData.offenses = [{}];
          }
          newData.offenses[0].description = value;
          break;
        case "propertyDescription":
          if (!newData.properties || newData.properties.length === 0) {
            newData.properties = [{}];
          }
          newData.properties[0].description = value;
          break;
      }
      
      return newData;
    });
  };

  // Determine if we have both template and NIBRS errors
  const hasTemplateErrors = correctionData.source === "template" || correctionData.type === "validation_error";
  const hasNIBRSErrors = correctionData.source === "nibrs" || correctionData.type === "nibrs_validation_error";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Report Information Needed
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Please provide the missing details to complete your reports
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

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Error Summary */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-orange-500 mt-0.5">📝</span>
              <div>
                <h4 className="font-medium text-orange-800">Summary</h4>
                <p className="text-orange-700 text-sm mt-1">{correctionData.error}</p>
              </div>
            </div>
          </div>

          {/* Template Errors Section */}
          {hasTemplateErrors && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">📋</span>
                  <h3 className="font-semibold text-blue-800">Narrative Report Requirements</h3>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  These details are needed for your narrative report template
                </p>
              </div>
              
              <div className="p-4 space-y-4">
                {correctionData.missingFields?.map((field, index) => (
                  <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{field}</h4>
                        <p className="text-gray-500 text-sm mt-1">
                          Required for complete narrative report
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedField(field)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Add Information
                      </button>
                    </div>

                    {/* Quick Add Options */}
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Quick options:</p>
                      <div className="flex flex-wrap gap-2">
                        {getQuickOptions(field).map((option, optionIndex) => (
                          <button
                            key={optionIndex}
                            onClick={() => handleQuickAdd(field, option)}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded transition-colors"
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
          )}

          {/* NIBRS Errors Section */}
          {hasNIBRSErrors && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">🏛️</span>
                  <h3 className="font-semibold text-green-800">NIBRS Standards</h3>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Required for federal crime reporting compliance
                </p>
              </div>
              
              <div className="p-4 space-y-4">
                {correctionData.missingFields?.map((field, index) => (
                  <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">{field}</h4>
                    
                    {/* NIBRS Form Fields */}
                    {field.toLowerCase().includes("date") && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Incident Date</label>
                        <input
                          type="date"
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          value={correctedData.administrative?.incidentDate || ""}
                          onChange={(e) => handleFieldChange("incidentDate", e.target.value)}
                        />
                      </div>
                    )}
                    
                    {field.toLowerCase().includes("victim") && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Victim Type</label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          value={correctedData.victims?.[0]?.type || ""}
                          onChange={(e) => handleFieldChange("victimType", e.target.value)}
                        >
                          <option value="">Select victim type</option>
                          <option value="I">👤 Individual (assaults, thefts, burglaries)</option>
                          <option value="S">🏛️ Society/Public (drugs, weapons, DUI)</option>
                          <option value="B">🏢 Business (commercial crimes)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                          💡 Use "Society/Public" for victimless offenses like drug violations
                        </p>
                      </div>
                    )}
                    
                    {field.toLowerCase().includes("offense") && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Offense Description</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          placeholder="e.g., Burglary, Assault, Theft"
                          value={correctedData.offenses?.[0]?.description || ""}
                          onChange={(e) => handleFieldChange("offenseDescription", e.target.value)}
                        />
                      </div>
                    )}
                    
                    {field.toLowerCase().includes("property") && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Property Description</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          placeholder="e.g., Stolen laptop, Damaged vehicle"
                          value={correctedData.properties?.[0]?.description || ""}
                          onChange={(e) => handleFieldChange("propertyDescription", e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions Section */}
          {correctionData.suggestions && correctionData.suggestions.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-purple-50 px-4 py-3 border-b border-purple-200">
                <div className="flex items-center space-x-2">
                  <span className="text-purple-600">💡</span>
                  <h3 className="font-semibold text-purple-800">Suggestions</h3>
                </div>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
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

          {/* Help Section */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">💡 How to proceed:</h4>
            <ul className="text-gray-600 text-sm space-y-1">
              {hasTemplateErrors && (
                <li>• Use <strong>"Add Information"</strong> to add details to your narrative</li>
              )}
              {hasNIBRSErrors && (
                <li>• Fill in the <strong>NIBRS form fields</strong> for federal reporting</li>
              )}
              <li>• Click <strong>"Submit Corrections"</strong> when all information is provided</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {correctionData.missingFields?.length || 0} fields need attention
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onCorrect(correctedData)}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Submit Corrections
            </button>
          </div>
        </div>
      </div>

      {/* Add Information Modal */}
      {selectedField && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Add Information</h3>
            <p className="text-gray-600 text-sm mb-4">
              Add details about: <strong>{selectedField}</strong>
            </p>
            
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder={`Describe ${selectedField.toLowerCase()}...`}
              className="w-full h-32 p-3 border border-gray-300 rounded text-sm resize-none"
            />
            
            <div className="flex justify-end space-x-3 mt-4">
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
                onClick={handleAddCustomInfo}
                disabled={!customInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add to Narrative
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedCorrectionUI;