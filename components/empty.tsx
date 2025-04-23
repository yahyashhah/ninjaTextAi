import { useState } from "react";
import Image from "next/image";

interface Template {
  id: string;
  templateName: string;
  reportTypes: string[];
  createdAt: string;
  instructions: string; 
}

interface EmptyProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredTemplates: Template[];
  selectedTemplate: Template | null;
  setSelectedTemplate: (template: Template | null) => void;
}

export const Empty = ({
  searchTerm,
  setSearchTerm,
  filteredTemplates,
  selectedTemplate,
  setSelectedTemplate,
}: EmptyProps) => {
  const [isFocused, setIsFocused] = useState(false);
  console.log(selectedTemplate);
  
  return (
    <div className="w-full">
    <div className="flex flex-col w-full max-w-md mx-auto">
      <input
        type="text"
        placeholder="Search templates..."
        value={searchTerm}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border px-4 py-2 rounded shadow mb-2"
      />
      {isFocused && (
        <div className="border rounded shadow p-2 max-h-60 overflow-y-auto">
          {filteredTemplates.map((template) => (
  <div
    key={template.id}
    className={`p-2 hover:bg-gray-100 w-full flex justify-between items-center cursor-pointer rounded ${
      selectedTemplate?.id === template.id ? "bg-gray-200" : ""
    }`}
    onMouseDown={() => setSelectedTemplate(template)}
  >
    <div>
      <strong>{template.templateName}</strong>
      {/* Join the array into a string for display */}
      <p className="text-xs text-gray-400">
        {template.reportTypes.join(", ")}
      </p>
    </div>
    <div>
      <p className="text-sm text-gray-400">
        {new Date(template.createdAt).toLocaleDateString()}
      </p>
    </div>
  </div>
))}
        </div>
      )}
    </div>
    <div className="flex items-center gap-2 w-full max-w-md mx-auto pt-2">
     <label className="w-[35%]">Selected Template:</label>
     <p className="p-2 w-[65%] bg-gray-200 font-semibold rounded-lg">{selectedTemplate?.templateName}</p>
    </div>

    </div>
  );
};