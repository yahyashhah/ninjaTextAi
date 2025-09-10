"use client";

import { useState } from "react";

interface CorrectionUIProps {
  errors: string[];
  nibrsData: any;
  confidence?: any;
  onCorrect: (correctedData: any) => void;
  onCancel: () => void;
}

const NIBRS_LOCATION_OPTIONS = [
  { value: "13", label: "Highway/Road/Alley/Street/Sidewalk (13)" },
  { value: "20", label: "Residence/Home (20)" },
  { value: "19", label: "Parking/Garage/Lot (19)" },
  { value: "05", label: "Bar/Nightclub (05)" },
  { value: "28", label: "Restaurant (28)" },
];

const NIBRS_OFFENSE_OPTIONS = [
  { value: "13A", label: "Aggravated Assault (13A)" },
  { value: "13B", label: "Simple Assault (13B)" },
  { value: "120", label: "Robbery (120)" },
  { value: "220", label: "Burglary (220)" },
  { value: "240", label: "Motor Vehicle Theft (240)" },
];

const CorrectionUI = ({ errors, nibrsData, confidence, onCorrect, onCancel }: CorrectionUIProps) => {
  const [correctedData, setCorrectedData] = useState(nibrsData);

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Review Auto-Mapped Codes</h3>
        
        {confidence && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">Mapping Confidence:</h4>
            <div className="space-y-1 text-sm">
              {confidence.offense && (
                <div>Offense: <span className={getConfidenceColor(confidence.offense)}>
                  {Math.round(confidence.offense * 100)}%
                </span></div>
              )}
              {confidence.location && (
                <div>Location: <span className={getConfidenceColor(confidence.location)}>
                  {Math.round(confidence.location * 100)}%
                </span></div>
              )}
              {confidence.weapon && (
                <div>Weapon: <span className={getConfidenceColor(confidence.weapon)}>
                  {Math.round(confidence.weapon * 100)}%
                </span></div>
              )}
            </div>
          </div>
        )}

        <div className="mb-4">
          <h4 className="font-medium mb-2 text-red-600">Issues to fix:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          {errors.some(e => e.includes('locationCode')) && (
            <div>
              <label className="block text-sm font-medium mb-2">Location Code</label>
              <select 
                value={correctedData.locationCode}
                onChange={(e) => setCorrectedData({...correctedData, locationCode: e.target.value})}
                className="w-full p-2 border rounded"
              >
                {NIBRS_LOCATION_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {errors.some(e => e.includes('offenseCode')) && (
            <div>
              <label className="block text-sm font-medium mb-2">Offense Code</label>
              <select 
                value={correctedData.offenseCode}
                onChange={(e) => setCorrectedData({...correctedData, offenseCode: e.target.value})}
                className="w-full p-2 border rounded"
              >
                {NIBRS_OFFENSE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Add similar sections for other error types */}
        </div>

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
            Submit Corrected
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorrectionUI;