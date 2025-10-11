// components/reports/sub-components/SimpleOffenseSelector.tsx
import { Search, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GROUP_A_OFFENSES, OFFENSE_CATEGORIES, OffenseType } from "@/constants/offences";
import { useState } from "react";

interface SimpleOffenseSelectorProps {
  onOffensesSelect: (offenses: OffenseType[]) => void;
  onBack: () => void;
  initialSelectedOffenses: OffenseType[];
}

const SimpleOffenseSelector = ({ onOffensesSelect, onBack }: SimpleOffenseSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedOffenses, setSelectedOffenses] = useState<OffenseType[]>([]);

  const filteredOffenses = GROUP_A_OFFENSES.filter(offense => {
    const matchesSearch = offense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offense.code.includes(searchTerm);
    const matchesCategory = selectedCategory === "All" || offense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOffenseToggle = (offense: OffenseType) => {
    const isSelected = selectedOffenses.find(selected => selected.id === offense.id);
    
    if (isSelected) {
      setSelectedOffenses(prev => prev.filter(o => o.id !== offense.id));
    } else {
      setSelectedOffenses(prev => [...prev, offense]);
    }
  };

  const handleSubmit = () => {
    if (selectedOffenses.length > 0) {
      onOffensesSelect(selectedOffenses);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "bg-red-100 text-red-800";
      case "HIGH": return "bg-orange-100 text-orange-800";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800";
      case "LOW": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Select Offenses</h1>
          <p className="text-gray-600 mt-1">Choose all applicable offenses for this incident</p>
        </div>
        <Button variant="outline" onClick={onBack}>Back</Button>
      </div>

      {/* Selected Offenses */}
      {selectedOffenses.length > 0 && (
        <div className="bg-white rounded-lg border border-blue-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              Selected ({selectedOffenses.length})
            </h3>
            <Button onClick={handleSubmit} size="sm">
              Continue
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedOffenses.map(offense => (
              <div key={offense.id} className="flex items-center bg-blue-50 rounded-full pl-3 pr-2 py-1">
                <span className="text-sm text-blue-800 mr-2">{offense.name}</span>
                <button
                  onClick={() => handleOffenseToggle(offense)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search offenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {["All", ...OFFENSE_CATEGORIES].map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Offenses List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="max-h-96 overflow-y-auto">
          {filteredOffenses.map(offense => {
            const isSelected = selectedOffenses.find(selected => selected.id === offense.id);
            
            return (
              <div
                key={offense.id}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleOffenseToggle(offense)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <h3 className="font-semibold text-gray-900">{offense.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{offense.description}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {offense.category}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getSeverityColor(offense.severity)}`}>
                        {offense.severity}
                      </Badge>
                      <code className="text-xs bg-gray-100 px-1 rounded">{offense.code}</code>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredOffenses.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No offenses found. Try different search terms.
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex justify-center space-x-4">
        <Button variant="outline" onClick={onBack}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          disabled={selectedOffenses.length === 0}
        >
          Continue with {selectedOffenses.length} {selectedOffenses.length === 1 ? 'Offense' : 'Offenses'}
        </Button>
      </div>
    </div>
  );
};

export default SimpleOffenseSelector;