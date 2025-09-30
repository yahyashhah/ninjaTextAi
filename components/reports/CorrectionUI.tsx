// components/reports/sub-components/CorrectionUI.tsx
import { useState, useEffect } from "react";

interface CorrectionUIProps {
  error: string;
  missingFields: string[];
  requiredLevel?: string;
  suggestions: string[];
  warnings: string[];
  nibrsData: any;
  confidence?: any;
  correctionContext?: any;
  onCorrect: (correctedData: any) => void;
  onCancel: () => void;
  onAddMissingInfo?: (field: string) => void;
  errorSource?: "template" | "nibrs";
  type?: string;
}

const CorrectionUI = ({
  error,
  missingFields = [],
  requiredLevel,
  suggestions = [],
  warnings = [],
  nibrsData,
  confidence,
  correctionContext,
  onCorrect,
  onCancel,
  onAddMissingInfo,
  errorSource = "template",
  type = "validation_error",
}: CorrectionUIProps) => {
  const [correctedData, setCorrectedData] = useState(nibrsData || {});
  const [activeTab, setActiveTab] = useState("errors");
  const [autoFixApplied, setAutoFixApplied] = useState(false);

  // Determine error source from type if not explicitly provided
  const actualErrorSource = errorSource || (type === "nibrs_validation_error" ? "nibrs" : "template");

  // Get error source information
  const getErrorSourceInfo = () => {
    switch (actualErrorSource) {
      case "template":
        return {
          title: "Template Requirements",
          description: "These fields are required by the selected report template",
          icon: "📋",
          color: "blue",
          badge: "Template"
        };
      case "nibrs":
        return {
          title: "NIBRS Standards",
          description: "These fields are required for federal crime reporting standards",
          icon: "🏛️",
          color: "green",
          badge: "NIBRS"
        };
      default:
        return {
          title: "Report Requirements",
          description: "Additional information needed",
          icon: "⚠️",
          color: "gray",
          badge: "Report"
        };
    }
  };

  const errorSourceInfo = getErrorSourceInfo();

  // Enhanced initialization with victim inference
  useEffect(() => {
    const initializedData = { ...nibrsData };
    
    // Ensure basic structure exists
    if (!initializedData.victims) initializedData.victims = [];
    if (!initializedData.properties) initializedData.properties = [];
    if (!initializedData.offenders) initializedData.offenders = [];
    if (!initializedData.offenses) initializedData.offenses = [];
    if (!initializedData.administrative) initializedData.administrative = {};
    
    // Auto-fix common NIBRS issues (only for NIBRS errors)
    if (actualErrorSource === "nibrs") {
      const fixesApplied = applyNIBRSAutoFixes(initializedData);
      if (fixesApplied) {
        setAutoFixApplied(true);
      }
    }
    
    // Initialize missing fields from validation
    missingFields.forEach(field => {
      if (field.includes("Date") && !initializedData.administrative.incidentDate) {
        initializedData.administrative.incidentDate = new Date().toISOString().split('T')[0];
      }
      if (field.includes("Victim") && initializedData.victims.length === 0) {
        // Determine victim type based on offenses
        const victimType = determineVictimType(initializedData.offenses);
        initializedData.victims.push({ 
          type: victimType,
          injury: 'N',
          sex: 'U',
          race: 'U',
          ethnicity: 'U'
        });
      }
      if (field.includes("Property") && initializedData.properties.length === 0) {
        initializedData.properties.push({});
      }
      if (field.includes("Offense") && initializedData.offenses.length === 0) {
        initializedData.offenses.push({ description: "", code: "" });
      }
    });
    
    setCorrectedData(initializedData);
  }, [missingFields, nibrsData, actualErrorSource]);

  // Helper function to auto-fix common NIBRS issues
  const applyNIBRSAutoFixes = (data: any): boolean => {
    let fixesApplied = false;

    // Fix: Add Society victim for victimless offenses
    if (data.offenses && data.offenses.length > 0 && (!data.victims || data.victims.length === 0)) {
      const victimlessOffenses = ['Drug/Narcotic Violation', 'Weapon Law Violation', 'Driving Under Influence'];
      const hasVictimless = data.offenses.some((offense: any) =>
        victimlessOffenses.includes(offense.description)
      );
      
      if (hasVictimless) {
        data.victims = [{
          type: 'S',
          injury: 'N',
          sex: 'U',
          race: 'U',
          ethnicity: 'U'
        }];
        fixesApplied = true;
      }
    }

    // Fix: Ensure victim type matches offense type
    if (data.victims && data.victims.length > 0 && data.offenses && data.offenses.length > 0) {
      const appropriateVictimType = determineVictimType(data.offenses);
      data.victims.forEach((victim: any) => {
        if (victim.type !== appropriateVictimType) {
          victim.type = appropriateVictimType;
          fixesApplied = true;
        }
      });
    }

    return fixesApplied;
  };

  // Determine appropriate victim type based on offenses
  const determineVictimType = (offenses: any[]): string => {
    if (!offenses || offenses.length === 0) return 'U';
    
    const victimlessOffenses = ['Drug/Narcotic Violation', 'Weapon Law Violation', 'Driving Under Influence'];
    const hasVictimless = offenses.some((offense: any) =>
      victimlessOffenses.includes(offense.description)
    );
    
    if (hasVictimless && offenses.every(offense => victimlessOffenses.includes(offense.description))) {
      return 'S';
    }
    
    return 'I';
  };

  const tabs = [
    { id: "errors", label: "Errors", color: "red" },
    { id: "missing", label: "Missing Info", color: "blue" },
    { id: "suggestions", label: "Suggestions", color: "green" },
    { id: "warnings", label: "Warnings", color: "yellow" },
    ...(actualErrorSource === "nibrs" ? [{ id: "auto-fixes", label: "Auto-Fixes", color: "purple" }] : []),
  ];

  const renderMissingFieldsForm = () => {
    // Unified validation mode (template requirements)
    if (onAddMissingInfo && missingFields.length > 0) {
      return (
        <div className="space-y-4">
          <div className={`p-4 bg-${errorSourceInfo.color}-50 border border-${errorSourceInfo.color}-200 rounded-lg`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-lg mr-2">{errorSourceInfo.icon}</span>
                <h4 className="font-medium text-gray-800">{errorSourceInfo.title}</h4>
              </div>
              <span className={`px-2 py-1 text-xs font-medium bg-${errorSourceInfo.color}-100 text-${errorSourceInfo.color}-800 rounded-full`}>
                {errorSourceInfo.badge}
              </span>
            </div>
            <p className="text-sm text-gray-600">{errorSourceInfo.description}</p>
          </div>
          
          <h4 className="font-medium text-blue-800 mb-2">Missing Required Information</h4>
          <p className="text-sm text-gray-600 mb-3">
            Please add the following information to your narrative:
          </p>
          {missingFields.map((field, index) => (
            <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-800">{field}</span>
                <button
                  onClick={() => onAddMissingInfo(field)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                >
                  Add Information
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // NIBRS correction form
    return (
      <div className="space-y-4">
        <div className={`p-4 bg-${errorSourceInfo.color}-50 border border-${errorSourceInfo.color}-200 rounded-lg`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-lg mr-2">{errorSourceInfo.icon}</span>
              <h4 className="font-medium text-gray-800">{errorSourceInfo.title}</h4>
            </div>
            <span className={`px-2 py-1 text-xs font-medium bg-${errorSourceInfo.color}-100 text-${errorSourceInfo.color}-800 rounded-full`}>
              {errorSourceInfo.badge}
            </span>
          </div>
          <p className="text-sm text-gray-600">{errorSourceInfo.description}</p>
        </div>

        <h4 className="font-medium text-gray-800 mb-2">Missing Information</h4>
        
        {missingFields.map((field, index) => (
          <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="block text-sm font-medium text-blue-800 mb-1">
              {field}
            </label>
            
            {field.includes("Date") && (
              <input
                type="date"
                className="w-full p-2 border border-gray-300 rounded"
                value={correctedData.administrative?.incidentDate || ""}
                onChange={(e) => setCorrectedData({
                  ...correctedData,
                  administrative: {
                    ...correctedData.administrative,
                    incidentDate: e.target.value
                  }
                })}
              />
            )}
            
            {field.includes("Victim") && (
              <div className="space-y-2">
                <select
                  className="w-full p-2 border border-gray-300 rounded"
                  value={correctedData.victims[0]?.type || ""}
                  onChange={(e) => {
                    const newVictims = [...correctedData.victims];
                    if (newVictims.length === 0) newVictims.push({});
                    newVictims[0].type = e.target.value;
                    setCorrectedData({...correctedData, victims: newVictims});
                  }}
                >
                  <option value="">Select Victim Type</option>
                  <option value="I">Individual (Assault, Theft, Burglary)</option>
                  <option value="S">Society/Public (Drugs, Weapons, DUI)</option>
                  <option value="B">Business</option>
                  <option value="U">Unknown</option>
                </select>
                <p className="text-xs text-gray-500">
                  💡 <strong>Individual</strong>: For assaults, thefts, burglaries<br />
                  💡 <strong>Society/Public</strong>: For drug, weapon, DUI offenses
                </p>
              </div>
            )}
            
            {field.includes("Property") && (
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Property description"
                value={correctedData.properties[0]?.description || ""}
                onChange={(e) => {
                  const newProperties = [...correctedData.properties];
                  if (newProperties.length === 0) newProperties.push({});
                  newProperties[0].description = e.target.value;
                  setCorrectedData({...correctedData, properties: newProperties});
                }}
              />
            )}
            
            {field.includes("Offense") && (
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Offense description"
                value={correctedData.offenses[0]?.description || ""}
                onChange={(e) => {
                  const newOffenses = [...correctedData.offenses];
                  if (newOffenses.length === 0) newOffenses.push({});
                  newOffenses[0].description = e.target.value;
                  setCorrectedData({...correctedData, offenses: newOffenses});
                }}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderAutoFixesTab = () => {
    if (!autoFixApplied) {
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-600 text-sm">No automatic fixes were applied.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-medium text-purple-800 mb-2">Automatic Fixes Applied</h4>
          <p className="text-purple-700 text-sm mb-2">
            The following issues were automatically corrected:
          </p>
          <ul className="text-purple-600 text-sm list-disc list-inside space-y-1">
            {correctedData.victims && correctedData.victims.length > 0 && (
              <li>Added missing victim information based on offense types</li>
            )}
            {correctedData.victims?.[0]?.type === 'S' && (
              <li>Set victim type to "Society/Public" for victimless offenses</li>
            )}
            {correctedData.administrative?.incidentDate && (
              <li>Added default incident date</li>
            )}
          </ul>
        </div>
        
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700 text-sm">
            <strong>Note:</strong> Review the fixes above and click "Submit Fixed Report" to proceed.
          </p>
        </div>
      </div>
    );
  };

  const handleSubmitFixedReport = () => {
    // Apply final validation before submitting
    const finalData = { ...correctedData };
    
    // Ensure victim type consistency
    if (finalData.victims && finalData.victims.length > 0) {
      const appropriateType = determineVictimType(finalData.offenses);
      finalData.victims.forEach((victim: any) => {
        victim.type = appropriateType;
      });
    }
    
    onCorrect(finalData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center mb-6">
          <span className="text-2xl mr-3">{errorSourceInfo.icon}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">
                {onAddMissingInfo ? "Additional Information Required" : "Report Correction Needed"}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium bg-${errorSourceInfo.color}-100 text-${errorSourceInfo.color}-800 rounded-full`}>
                {errorSourceInfo.badge}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {errorSourceInfo.description}
            </p>
          </div>
        </div>

        {/* Success notification for auto-fixes */}
        {autoFixApplied && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm flex items-center">
              <span className="mr-2">✅</span>
              <strong>Automatic fixes applied!</strong> Some issues have been automatically corrected. Please review below.
            </p>
          </div>
        )}

        {/* Tabs - Only show if not unified validation */}
        {!onAddMissingInfo && (
          <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex-shrink-0 px-4 py-2 font-medium transition-colors duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? `border-b-2 border-${tab.color}-600 text-${tab.color}-700`
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Unified Validation Mode */}
        {onAddMissingInfo ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Information Required</h4>
              <p className="text-blue-700 text-sm">{error}</p>
            </div>
            {renderMissingFieldsForm()}
          </div>
        ) : (
          <>
            {/* Errors Tab */}
            {activeTab === "errors" && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Validation Error</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>

                {requiredLevel && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-medium text-orange-800 mb-2">Required Level</h4>
                    <p className="text-orange-700 text-sm">{requiredLevel}</p>
                  </div>
                )}

                {/* NIBRS-specific guidance */}
                {error.includes("victim") && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">NIBRS Victim Guidance</h4>
                    <p className="text-blue-700 text-sm">
                      <strong>For drug, weapon, or DUI offenses:</strong> Use "Society/Public" victim type<br/>
                      <strong>For assaults, thefts, burglaries:</strong> Use "Individual" victim type<br/>
                      <strong>For business crimes:</strong> Use "Business" victim type
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Missing Info Tab */}
            {activeTab === "missing" && missingFields.length > 0 && (
              <div className="space-y-4">
                {renderMissingFieldsForm()}
              </div>
            )}

            {/* Suggestions Tab */}
            {activeTab === "suggestions" && suggestions.length > 0 && (
              <div className="space-y-3">
                {suggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm"
                  >
                    <span className="mr-2">💡</span>
                    {suggestion}
                  </div>
                ))}
              </div>
            )}

            {/* Warnings Tab */}
            {activeTab === "warnings" && warnings.length > 0 && (
              <div className="space-y-3">
                {warnings.map((warning, i) => (
                  <div
                    key={i}
                    className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm"
                  >
                    <span className="mr-2">⚠️</span>
                    {warning}
                  </div>
                ))}
              </div>
            )}

            {/* Auto-Fixes Tab */}
            {activeTab === "auto-fixes" && renderAutoFixesTab()}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          {onAddMissingInfo ? (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={onCancel}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                I'll Add the Information
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFixedReport}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {autoFixApplied ? "Submit Fixed Report" : "Submit Corrections"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CorrectionUI;