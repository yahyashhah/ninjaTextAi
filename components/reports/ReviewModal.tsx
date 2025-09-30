// components/reports/sub-components/ReviewModal.tsx
import { useState, useEffect } from "react";
import { X, Check, ArrowLeft, Folder, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewModalProps {
  isOpen: boolean;
  fieldName: string;
  options: string[];
  currentSegment?: string;
  currentField?: string;
  onSelect: (selectedOption: string, segment?: string, field?: string) => void;
  onClose: () => void;
}

// Define proper TypeScript interfaces for the hierarchy
interface FieldDefinition {
  name: string;
  options: string[];
}

interface SegmentDefinition {
  name: string;
  fields: {
    [key: string]: FieldDefinition;
  };
}

interface ReviewHierarchy {
  segments: {
    [key: string]: SegmentDefinition;
  };
}

// Define the hierarchical structure with proper typing
const reviewHierarchy: ReviewHierarchy = {
  segments: {
    'administrative': {
      name: 'Administrative Segment',
      fields: {
        'incidentDateTime': { name: 'Incident Date/Time', options: ['current date/time', 'yesterday', 'specific date'] },
        'reportingOfficer': { name: 'Reporting Officer', options: ['officer name', 'badge number', 'unit number'] },
        'caseNumber': { name: 'Case Number', options: ['to be assigned', 'existing case number'] },
        'location': { name: 'Incident Location', options: ['residence', 'business', 'street', 'park', 'school', 'vehicle', 'other'] }
      }
    },
    'offense': {
      name: 'Offense Segment',
      fields: {
        'statute': { name: 'Statute Number', options: ['PC 459 - Burglary', 'PC 245 - Assault', 'PC 211 - Robbery', 'PC 487 - Grand Theft', 'to be determined'] },
        'offenseDescription': { name: 'Offense Description', options: ['burglary', 'assault', 'robbery', 'theft', 'vandalism', 'drug offense'] },
        'offenseStatus': { name: 'Offense Status', options: ['attempted', 'completed'] },
        'weaponUsed': { name: 'Weapon Used', options: ['firearm', 'knife', 'physical force', 'threat', 'none'] }
      }
    },
    'victim': {
      name: 'Victim Segment',
      fields: {
        'victimName': { name: 'Victim Name', options: ['name provided', 'name withheld', 'unknown'] },
        'victimAge': { name: 'Victim Age', options: ['adult', 'juvenile', 'elderly', 'unknown'] },
        'victimGender': { name: 'Victim Gender', options: ['male', 'female', 'unknown'] },
        'victimRace': { name: 'Victim Race', options: ['white', 'black', 'asian', 'native american', 'pacific islander', 'unknown'] },
        'injuryType': { name: 'Injury Type', options: ['none', 'minor', 'serious', 'fatal'] }
      }
    },
    'suspect': {
      name: 'Suspect Segment',
      fields: {
        'suspectDescription': { name: 'Suspect Description', options: ['male', 'female', 'unknown gender', 'average build', 'tall', 'short'] },
        'clothing': { name: 'Clothing Description', options: ['dark clothing', 'light clothing', 'casual', 'uniform', 'unknown'] },
        'offenderCount': { name: 'Number of Offenders', options: ['one', 'two', 'three', 'multiple', 'unknown'] },
        'relationship': { name: 'Relationship to Victim', options: ['stranger', 'acquaintance', 'family member', 'spouse/partner', 'unknown'] }
      }
    },
    'property': {
      name: 'Property Segment',
      fields: {
        'propertyType': { name: 'Property Type', options: ['electronics', 'jewelry', 'cash', 'vehicle', 'documents', 'personal items'] },
        'propertyValue': { name: 'Property Value', options: ['under $100', '$100-$500', '$500-$1000', 'over $1000', 'unknown'] },
        'propertyStatus': { name: 'Property Status', options: ['stolen', 'damaged', 'recovered', 'seized'] }
      }
    },
    'arrest': {
      name: 'Arrest Segment',
      fields: {
        'arrestStatus': { name: 'Arrest Status', options: ['arrested', 'not arrested', 'summons issued', 'warrant pending'] },
        'arrestType': { name: 'Arrest Type', options: ['taken into custody', 'on view', 'warrant arrest'] },
        'charges': { name: 'Charges', options: ['PC 459 - Burglary', 'PC 245 - Assault', 'PC 211 - Robbery', 'to be determined'] }
      }
    }
  }
};

type SegmentKey = keyof typeof reviewHierarchy.segments;

const ReviewModal = ({ isOpen, fieldName, options, currentSegment, currentField, onSelect, onClose }: ReviewModalProps) => {
  const [currentView, setCurrentView] = useState<'segments' | 'fields' | 'options'>('segments');
  const [selectedSegment, setSelectedSegment] = useState<SegmentKey | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState("");

  // Reset state when modal opens/closes or handle direct field selection
  useEffect(() => {
    if (isOpen) {
      if (fieldName === "fieldSelection" && currentField) {
        // Direct field selection from DictationTemplate buttons
        setCurrentView('options');
        setSelectedField(currentField);
        setSelectedOption("");
      } else {
        // Standard hierarchical flow
        setCurrentView('segments');
        setSelectedSegment(null);
        setSelectedField(null);
        setSelectedOption("");
      }
    }
  }, [isOpen, fieldName, currentField]);

  const handleSegmentSelect = (segmentKey: SegmentKey) => {
    setSelectedSegment(segmentKey);
    setCurrentView('fields');
  };

  const handleFieldSelect = (fieldKey: string) => {
    setSelectedField(fieldKey);
    setCurrentView('options');
  };

  const handleOptionSelect = () => {
  if (selectedOption) {
    if (selectedSegment && selectedField) {
      onSelect(selectedOption, String(selectedSegment), selectedField);
    } else if (selectedField) {
      // Direct field selection case
      onSelect(selectedOption, undefined, selectedField);
    }
  }
};

  const handleBack = () => {
    if (currentView === 'options') {
      setCurrentView('fields');
      setSelectedOption("");
    } else if (currentView === 'fields') {
      setCurrentView('segments');
      setSelectedSegment(null);
      setSelectedField(null);
    }
  };

  const handleClose = () => {
    setCurrentView('segments');
    setSelectedSegment(null);
    setSelectedField(null);
    setSelectedOption("");
    onClose();
  };

  // Get options based on current view and selection with proper type safety
  const getCurrentOptions = (): string[] => {
    if (currentView === 'options' && selectedField) {
      if (fieldName === "fieldSelection" && options.length > 0) {
        // Use options passed from DictationTemplate buttons
        return options;
      } else if (selectedSegment) {
        const segment = reviewHierarchy.segments[selectedSegment];
        if (segment && segment.fields[selectedField]) {
          // Use options from hierarchy with type safety
          return segment.fields[selectedField].options;
        }
      }
    }
    return [];
  };

  // Safe field name formatting function
  const formatFieldName = (field: string): string => {
    return field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  // Safe field access for display names
  const getFieldDisplayName = (): string => {
    if (currentView === 'options' && selectedField) {
      if (fieldName === "fieldSelection") {
        return formatFieldName(selectedField);
      } else if (selectedSegment) {
        const segment = reviewHierarchy.segments[selectedSegment];
        if (segment && segment.fields[selectedField]) {
          return segment.fields[selectedField].name;
        }
      }
    }
    return 'Select Option';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {currentView !== 'segments' && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="p-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h3 className="text-lg font-semibold text-gray-800">
              {currentView === 'segments' && 'Select Segment'}
              {currentView === 'fields' && selectedSegment && reviewHierarchy.segments[selectedSegment].name}
              {currentView === 'options' && getFieldDisplayName()}
            </h3>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentView === 'segments' && (
            <div className="space-y-3">
              {Object.entries(reviewHierarchy.segments).map(([key, segment]) => (
                <button
                  key={key}
                  className="w-full p-4 text-left rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center gap-3"
                  onClick={() => handleSegmentSelect(key as SegmentKey)}
                >
                  <Folder className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-gray-800">{segment.name}</div>
                    <div className="text-sm text-gray-600">
                      {Object.keys(segment.fields).length} fields available
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {currentView === 'fields' && selectedSegment && (
            <div className="space-y-3">
              {Object.entries(reviewHierarchy.segments[selectedSegment].fields).map(([key, field]) => (
                <button
                  key={key}
                  className="w-full p-4 text-left rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-200 transition-colors flex items-center gap-3"
                  onClick={() => handleFieldSelect(key)}
                >
                  <FileText className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium text-gray-800">{field.name}</div>
                    <div className="text-sm text-gray-600">
                      {field.options.length} options available
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {currentView === 'options' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-4">
                Select an option to insert into your report:
              </p>
              {getCurrentOptions().map((option: string, index: number) => (
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
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          {currentView === 'options' ? (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                onClick={handleOptionSelect}
                disabled={!selectedOption}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Insert Selection
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {currentView === 'segments' ? 'Select a segment to continue' : 'Select a field to see options'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;