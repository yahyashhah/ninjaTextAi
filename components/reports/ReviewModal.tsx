// components/reports/sub-components/ReviewModal.tsx
import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewModalProps {
  isOpen: boolean;
  fieldName: string;
  options: string[];
  onSelect: (selectedOption: string) => void;
  onClose: () => void;
}

const ReviewModal = ({ isOpen, fieldName, options, onSelect, onClose }: ReviewModalProps) => {
  const [selectedOption, setSelectedOption] = useState("");
  const [safeOptions, setSafeOptions] = useState<string[]>([]);

  // Ensure options is always a valid array
  useEffect(() => {
    if (Array.isArray(options) && options.length > 0) {
      setSafeOptions(options);
    } else {
      setSafeOptions(["Unknown", "Not specified", "Please specify"]);
    }
    setSelectedOption(""); // Reset selection when modal opens
  }, [options, isOpen]);

  if (!isOpen) return null;

  const fieldLabels: { [key: string]: string } = {
    incidentType: "Type of Incident",
    victimGender: "Victim Gender",
    race: "Race",
    ethnicity: "Ethnicity",
    relationship: "Relationship to Offender",
    offenseStatus: "Offense Status",
    injuryType: "Injury Type",
    forceUsed: "Force Used",
    propertyLoss: "Property Loss Type",
    arrestStatus: "Arrest Status",
    bodyCam: "Body Camera Usage",
    location: "Incident Location",
    victimName: "Victim Name",
    victimAge: "Victim Age",
    suspectAge: "Suspect Age",
    statute: "Statute Number",
    offenseDescription: "Offense Description",
    clothing: "Clothing Description",
    physicalDescription: "Physical Description",
    offenderCount: "Number of Offenders",
    propertyItems: "Property Items",
    propertyDescription: "Property Description",
    propertyValue: "Property Value",
    arrestType: "Arrest Type",
    charges: "Charges",
    general: "General Assistance"
  };

  const handleSubmit = () => {
    if (selectedOption) {
      onSelect(selectedOption);
    }
  };

  const handleClose = () => {
    setSelectedOption("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {fieldLabels[fieldName] || fieldName}
          </h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Please select the appropriate option:
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {safeOptions.map((option, index) => (
            <button
              key={index}
              className={`w-full p-3 text-left rounded-lg border transition-colors ${
                selectedOption === option
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedOption(option)}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedOption}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Insert Selection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;