// components/reports/sub-components/OffenseSelector.tsx - MINIMAL VERSION
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GROUP_A_OFFENSES, OffenseType } from "@/constants/offences";
import { useState } from "react";

interface OffenseSelectorProps {
  onOffensesSelect: (offenses: OffenseType[]) => void;
  onBack: () => void;
  initialSelectedOffenses: OffenseType[];
}

const OffenseSelector = ({ onOffensesSelect, onBack }: OffenseSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOffenses, setSelectedOffenses] = useState<OffenseType[]>([]);

  const filteredOffenses = GROUP_A_OFFENSES.filter(offense => 
    offense.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOffenseToggle = (offense: OffenseType) => {
    const isSelected = selectedOffenses.find(selected => selected.id === offense.id);
    setSelectedOffenses(isSelected 
      ? selectedOffenses.filter(o => o.id !== offense.id)
      : [...selectedOffenses, offense]
    );
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Select Offense</h1>
        <Button variant="outline" onClick={onBack} size="sm">← Back</Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search offenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected Chips */}
      {selectedOffenses.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedOffenses.map(offense => (
            <div key={offense.id} className="flex items-center bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-xs">
              {offense.name}
              <button
                onClick={() => handleOffenseToggle(offense)}
                className="ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Offense List */}
      <div className="border rounded-lg max-h-64 overflow-y-auto">
        {filteredOffenses.map(offense => {
          const isSelected = selectedOffenses.find(selected => selected.id === offense.id);
          return (
            <div
              key={offense.id}
              className={`p-3 border-b cursor-pointer flex items-center space-x-3 ${
                isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleOffenseToggle(offense)}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
              }`}>
                {isSelected && <span className="text-white text-xs">✓</span>}
              </div>
              <div>
                <div className="font-medium text-sm">{offense.name}</div>
                <div className="text-xs text-gray-500">{offense.code}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <Button variant="outline" onClick={onBack} className="flex-1">Cancel</Button>
        <Button 
          onClick={() => onOffensesSelect(selectedOffenses)} 
          disabled={selectedOffenses.length === 0}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default OffenseSelector;