// CorrectionUI.tsx - COMPLETE ENHANCED VERSION
"use client";

import { useState, useEffect } from "react";

interface CorrectionUIProps {
  errors: string[];
  warnings: string[];
  nibrsData: any;
  confidence?: any;
  correctionContext?: any;
  onCorrect: (correctedData: any) => void;
  onCancel: () => void;
}

interface VictimRequirement {
  type: string;
  offenseCode: string;
  offenseDescription: string;
}

interface PropertySuggestion {
  description: string;
  suggestedCodes: Array<{code: string, description: string}>;
  relatedOffense: string;
}

const NIBRS_PROPERTY_SUGGESTIONS = [
  { value: "23", label: "Drugs/Narcotics (23)" },
  { value: "08", label: "Motor Vehicle (08)" },
  { value: "14", label: "Electronics (14)" },
  { value: "01", label: "Currency (01)" },
  { value: "02", label: "Jewelry (02)" },
  { value: "11", label: "Firearms (11)" },
  { value: "34", label: "Other Property (34)" }
];

const NIBRS_LOSS_TYPES = [
  { value: "1", label: "Stolen (1)" },
  { value: "4", label: "Damaged (4)" },
  { value: "7", label: "Seized (7)" }
];

const CorrectionUI = ({ 
  errors, 
  warnings, 
  nibrsData, 
  confidence, 
  correctionContext, 
  onCorrect, 
  onCancel 
}: CorrectionUIProps) => {
  const [correctedData, setCorrectedData] = useState(nibrsData);
  const [activeTab, setActiveTab] = useState('errors');

  // Initialize arrays if they don't exist
  useEffect(() => {
    const updatedData = { ...correctedData };
    if (!updatedData.victims) updatedData.victims = [];
    if (!updatedData.properties) updatedData.properties = [];
    setCorrectedData(updatedData);
  }, []);

  const addVictim = (type: string, offenseCode: string) => {
    const newVictim = {
      type,
      injury: type === 'S' ? 'N' : 'U',
      age: undefined,
      sex: 'U',
      race: 'U',
      ethnicity: 'U',
      relatedOffense: offenseCode
    };
    
    setCorrectedData((prev: { victims: any; }) => ({
      ...prev,
      victims: [...(prev.victims || []), newVictim]
    }));
  };

  const updateProperty = (index: number, field: string, value: any) => {
    setCorrectedData((prev: { properties: any; }) => {
      const newProperties = [...prev.properties];
      newProperties[index] = {
        ...newProperties[index],
        [field]: value
      };
      return { ...prev, properties: newProperties };
    });
  };

  const removeVictim = (index: number) => {
    setCorrectedData((prev: { victims: any[]; }) => ({
      ...prev,
      victims: prev.victims.filter((_: any, i: number) => i !== index)
    }));
  };

  const removeProperty = (index: number) => {
    setCorrectedData((prev: { properties: any[]; }) => ({
      ...prev,
      properties: prev.properties.filter((_: any, i: number) => i !== index)
    }));
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Review and Complete Your Report</h3>
        
        {/* Tab Navigation */}
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 ${activeTab === 'errors' ? 'border-b-2 border-blue-600' : ''}`}
            onClick={() => setActiveTab('errors')}
          >
            Errors ({errors.length})
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'warnings' ? 'border-b-2 border-yellow-600' : ''}`}
            onClick={() => setActiveTab('warnings')}
          >
            Warnings ({warnings.length})
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'review' ? 'border-b-2 border-green-600' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            Full Review
          </button>
        </div>

        {activeTab === 'errors' && (
          <div className="space-y-4">
            {/* Missing Victims Section */}
            {correctionContext?.missingVictims?.map((victimReq: VictimRequirement, index: number) => (
              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                <h4 className="font-medium text-red-800 mb-2">
                  Missing {victimReq.type} victim for {victimReq.offenseDescription}
                </h4>
                <button
                  onClick={() => addVictim(
                    victimReq.type === 'society' ? 'S' : 'I', 
                    victimReq.offenseCode
                  )}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                >
                  Add {victimReq.type} Victim
                </button>
              </div>
            ))}

            {/* Multi-offense Issues */}
            {correctionContext?.multiOffenseIssues?.map((issue: string, index: number) => (
              <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded">
                <p className="text-orange-800">{issue}</p>
              </div>
            ))}

            {/* Current Victims */}
            {correctedData.victims && correctedData.victims.length > 0 && (
              <div className="p-3 bg-gray-50 rounded">
                <h4 className="font-medium mb-2">Current Victims:</h4>
                {correctedData.victims.map((victim: any, index: number) => (
                  <div key={index} className="flex justify-between items-center mb-2 p-2 bg-white rounded">
                    <span>
                      Type: {victim.type} | Injury: {victim.injury || 'N/A'}
                      {victim.relatedOffense && ` | Offense: ${victim.relatedOffense}`}
                    </span>
                    <button
                      onClick={() => removeVictim(index)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'warnings' && (
          <div className="space-y-4">
            {/* Property Classification */}
            {correctionContext?.ambiguousProperties?.map((prop: PropertySuggestion, index: number) => (
              <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-medium text-yellow-800 mb-2">Classify: {prop.description}</h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select 
                    value={correctedData.properties[index]?.descriptionCode || ''}
                    onChange={(e) => updateProperty(index, 'descriptionCode', e.target.value)}
                    className="p-2 border rounded"
                  >
                    <option value="">Select Code</option>
                    {NIBRS_PROPERTY_SUGGESTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select 
                    value={correctedData.properties[index]?.lossType || ''}
                    onChange={(e) => updateProperty(index, 'lossType', e.target.value)}
                    className="p-2 border rounded"
                  >
                    <option value="">Select Loss Type</option>
                    {NIBRS_LOSS_TYPES.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-yellow-700">
                  <p>Suggested codes: {prop.suggestedCodes.map(s => `${s.description} (${s.code})`).join(', ')}</p>
                  <p>Related to offense: {prop.relatedOffense}</p>
                </div>
              </div>
            ))}

            {/* Current Properties */}
            {correctedData.properties && correctedData.properties.length > 0 && (
              <div className="p-3 bg-gray-50 rounded">
                <h4 className="font-medium mb-2">Current Properties:</h4>
                {correctedData.properties.map((property: any, index: number) => (
                  <div key={index} className="mb-2 p-2 bg-white rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{property.description}</span>
                      <button
                        onClick={() => removeProperty(index)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      Code: {property.descriptionCode || 'Not set'} | 
                      Loss Type: {property.lossType || 'Not set'} | 
                      Value: {property.value ? `$${property.value}` : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <div className="space-y-4">
            <h4 className="font-medium">Full Report Preview</h4>
            <div className="bg-gray-50 p-3 rounded">
              <h5 className="font-medium mb-2">Offenses:</h5>
              <pre className="text-xs bg-white p-2 rounded overflow-auto">
                {JSON.stringify(correctedData.offenses, null, 2)}
              </pre>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h5 className="font-medium mb-2">Victims:</h5>
              <pre className="text-xs bg-white p-2 rounded overflow-auto">
                {JSON.stringify(correctedData.victims, null, 2)}
              </pre>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h5 className="font-medium mb-2">Properties:</h5>
              <pre className="text-xs bg-white p-2 rounded overflow-auto">
                {JSON.stringify(correctedData.properties, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Confidence Display */}
        {confidence && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <h4 className="font-medium mb-2">Mapping Confidence:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {confidence.offenses && Array.isArray(confidence.offenses) && (
                <div>
                  Offenses: {confidence.offenses.map((conf: number, idx: number) => (
                    <span key={idx} className={getConfidenceColor(conf)}>
                      {Math.round(conf * 100)}%{idx < confidence.offenses.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}
              {confidence.location && (
                <div>
                  Location: <span className={getConfidenceColor(confidence.location)}>
                    {Math.round(confidence.location * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end mt-6">
          <button 
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={() => onCorrect(correctedData)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit Corrected Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorrectionUI;