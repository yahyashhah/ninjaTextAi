"use client";
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
}

// In your CorrectionUI component
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
}: CorrectionUIProps) => {
  const [correctedData, setCorrectedData] = useState(nibrsData || {});
  const [activeTab, setActiveTab] = useState("errors");
  
  // Initialize data structure
  useEffect(() => {
    const initializedData = { ...nibrsData };
    
    if (!initializedData.victims) initializedData.victims = [];
    if (!initializedData.properties) initializedData.properties = [];
    if (!initializedData.offenders) initializedData.offenders = [];
    if (!initializedData.offenses) initializedData.offenses = [];
    if (!initializedData.administrative) initializedData.administrative = {};
    
    // Initialize missing fields
    missingFields.forEach(field => {
      if (field.includes("Incident Date") && !initializedData.administrative.incidentDate) {
        initializedData.administrative.incidentDate = new Date().toISOString().split('T')[0];
      }
      if (field.includes("Victim") && initializedData.victims.length === 0) {
        initializedData.victims.push({ type: field.includes("Society") ? "S" : "I" });
      }
      if (field.includes("Property") && initializedData.properties.length === 0) {
        initializedData.properties.push({});
      }
      if (field.includes("Offense") && initializedData.offenses.length === 0) {
        initializedData.offenses.push({ description: "", code: "" });
      }
    });
    
    setCorrectedData(initializedData);
  }, [missingFields, nibrsData]);

  const tabs = [
    { id: "errors", label: "Errors", color: "red" },
    { id: "missing", label: "Missing Info", color: "blue" },
    { id: "suggestions", label: "Suggestions", color: "green" },
    { id: "warnings", label: "Warnings", color: "yellow" },
  ];

  const renderMissingFieldsForm = () => {
    return (
      <div className="space-y-4">
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
                <option value="I">Individual</option>
                <option value="S">Society/Public</option>
                <option value="B">Business</option>
              </select>
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-xl font-semibold mb-6 text-gray-800">
          Report Issues & Suggestions
        </h3>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 font-medium transition-colors duration-200 ${
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

        {/* Errors Tab */}
        {activeTab === "errors" && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Main Error</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>

            {requiredLevel && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">Required Level</h4>
                <p className="text-orange-700 text-sm">{requiredLevel}</p>
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
                {warning}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onCorrect(correctedData)}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Submit Fixed Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorrectionUI;