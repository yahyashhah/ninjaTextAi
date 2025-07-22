import { useState } from "react";
import Image from "next/image";
import { Mic, MicOff } from "lucide-react";

interface Template {
  id: string;
  templateName: string;
  reportTypes: string[];
  createdAt: string;
  instructions: string; 
}

interface EmptyProps {
  prompt?: string;
  setPrompt?: (prompt: string) => void;
  isListening?: boolean;
  startListening?: () => void;
  stopListening?: () => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  filteredTemplates?: Template[];
  selectedTemplate?: Template | null;
  setSelectedTemplate?: (template: Template | null) => void;
}

export const Empty = ({
  prompt,
  setPrompt,
  isListening,
  startListening,
  stopListening,
  searchTerm = "",
  setSearchTerm = () => {},
  filteredTemplates = [],
  selectedTemplate = null,
  setSelectedTemplate = () => {},
}: EmptyProps) => {
  const [isFocused, setIsFocused] = useState(false);
  
  // If voice recording props are provided, show voice recording UI
  if (prompt !== undefined && setPrompt) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-xl font-medium text-gray-500 mb-4">
          Describe the accident to generate a report
        </div>
        <div className="flex items-center gap-2">
          {isListening ? (
            <button
              onClick={stopListening}
              className="p-2 bg-red-100 rounded-full text-red-500"
            >
              <MicOff className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={startListening}
              className="p-2 bg-blue-100 rounded-full text-blue-500"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Or type your description here..."
            className="border px-4 py-2 rounded shadow flex-1 min-w-[300px]"
          />
        </div>
      </div>
    );
  }

  // Otherwise show template search UI
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
        <p className="p-2 w-[65%] bg-gray-200 font-semibold rounded-lg">
          {selectedTemplate?.templateName || "None"}
        </p>
      </div>
    </div>
  );
};