"use client";

import { useState } from "react";
import * as Label from "@radix-ui/react-label";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { useRouter } from 'next/navigation';

interface FormValues {
  templateName: string;
  instructions: string;
  reportType: string[];
  examples: string;
  requiredFields: string[];
  fieldDefinitions: { [key: string]: any };
  strictMode: boolean;
}

interface FieldDefinition {
  label: string;
  description: string;
  required: boolean;
  type: string;
  validation?: string;
  example?: string;
}

const Create_template = () => {
  const [formValues, setFormValues] = useState<FormValues>({
    templateName: "",
    instructions: "",
    reportType: [],
    examples: "",
    requiredFields: [],
    fieldDefinitions: {},
    strictMode: true
  });

  const [newField, setNewField] = useState({
    name: "",
    label: "",
    description: "",
    required: true,
    type: "text"
  });

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormValues(prev => ({
      ...prev,
      reportType: prev.reportType.includes(value)
        ? prev.reportType.filter(item => item !== value)
        : [...prev.reportType, value]
    }));
  };

  const addField = () => {
    if (!newField.name.trim() || !newField.label.trim()) return;

    const fieldKey = newField.name.toLowerCase().replace(/\s+/g, '_');
    
    setFormValues(prev => ({
      ...prev,
      requiredFields: [...prev.requiredFields, fieldKey],
      fieldDefinitions: {
        ...prev.fieldDefinitions,
        [fieldKey]: {
          label: newField.label,
          description: newField.description,
          required: newField.required,
          type: newField.type,
          example: newField.type === 'datetime' ? 'MM/DD/YYYY HH:MM' : 'Example value'
        }
      }
    }));

    // Reset new field form
    setNewField({
      name: "",
      label: "",
      description: "",
      required: true,
      type: "text"
    });
  };

  const removeField = (fieldKey: string) => {
    setFormValues(prev => ({
      ...prev,
      requiredFields: prev.requiredFields.filter(f => f !== fieldKey),
      fieldDefinitions: Object.fromEntries(
        Object.entries(prev.fieldDefinitions).filter(([key]) => key !== fieldKey)
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/create_template', {
        templateName: formValues.templateName,
        instructions: formValues.instructions,
        examples: formValues.examples,
        reportTypes: formValues.reportType,
        requiredFields: formValues.requiredFields,
        fieldDefinitions: formValues.fieldDefinitions,
        strictMode: formValues.strictMode
      });
      router.push("/templates_page");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error:', error.response?.data?.message || error.message);
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };

  const reportTypeOptions = [
    "Incident report", 
    "Arrest report", 
    "Accident report", 
    "Witness Statement",
    "Use of force report", 
    "Domestic violence report", 
    "Field interview report", 
    "Supplemental report"
  ];

  const fieldTypes = ["text", "datetime", "number", "array", "boolean"];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="w-full flex justify-between items-center p-4 px-6 bg-white border border-slate-300 rounded-b-lg sticky top-0 z-10">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft />        
          Back
        </button>
        <h1 className="text-lg font-semibold">Create Strict Template</h1>
        <div className="w-20"></div> {/* Spacer for balance */}
      </div>
      
      <div className='flex-1 p-4 px-6'>
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 p-6 bg-white border rounded-lg shadow-sm">
          
          {/* Template Name */}
          <div className="flex flex-col gap-2">
            <Label.Root htmlFor="templateName" className="text-sm font-medium text-gray-700">
              Template Name *
            </Label.Root>
            <input
              id="templateName"
              name="templateName"
              placeholder="Enter Template Name"
              value={formValues.templateName}
              onChange={handleInputChange}
              required
              className="p-2 border rounded-lg w-full focus:outline-none focus:ring focus:ring-indigo-500"
            />
          </div>

          {/* Strict Mode Toggle */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <input
              type="checkbox"
              id="strictMode"
              checked={formValues.strictMode}
              onChange={(e) => setFormValues(prev => ({ ...prev, strictMode: e.target.checked }))}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <Label.Root htmlFor="strictMode" className="text-sm font-medium text-gray-700">
              Enable Strict Validation
            </Label.Root>
            <TooltipIcon 
              content="When enabled, the system will validate that all required fields are present in the narrative before generating the report."
            />
          </div>

          {/* Required Fields Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <Label.Root className="text-sm font-medium text-gray-700">
                Required Fields
              </Label.Root>
              <TooltipIcon 
                content="Define specific fields that must be present in the narrative. The system will prompt users for missing information."
              />
            </div>

            {/* Add New Field Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded mb-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Field Name *</label>
                <input
                  value={newField.name}
                  onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., incident_time"
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Display Label *</label>
                <input
                  value={newField.label}
                  onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., Incident Time"
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-600">Description</label>
                <input
                  value={newField.description}
                  onChange={(e) => setNewField(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Exact date and time of incident"
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                    className="h-3 w-3"
                  />
                  Required Field
                </label>
                <select 
                  value={newField.type}
                  onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value }))}
                  className="text-xs p-1 border rounded"
                >
                  {fieldTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="button"
                  onClick={addField}
                  disabled={!newField.name.trim() || !newField.label.trim()}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  <Plus className="h-3 w-3" />
                  Add Field
                </button>
              </div>
            </div>

            {/* Existing Fields List */}
            {formValues.requiredFields.length > 0 ? (
              <div className="space-y-2">
                {formValues.requiredFields.map(fieldKey => {
                  const field = formValues.fieldDefinitions[fieldKey];
                  return (
                    <div key={fieldKey} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium text-sm">{field.label}</span>
                        <span className="text-xs text-gray-500 ml-2">({fieldKey})</span>
                        <div className="text-xs text-gray-600">{field.description}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeField(fieldKey)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No required fields added yet
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-1 items-center">
              <Label.Root htmlFor="instructions" className="text-sm font-medium text-gray-700">
                Instructions for AI *
              </Label.Root>
              <TooltipIcon 
                content="Describe exactly how you want the AI to format the report. Include section headers, formatting rules, and any specific requirements."
              />
            </div>
            <textarea
              id="instructions"
              name="instructions"
              placeholder="Describe the exact format and structure for the report..."
              value={formValues.instructions}
              onChange={handleChange}
              required
              className="p-2 border rounded-lg w-full h-32 resize-none focus:outline-none focus:ring focus:ring-indigo-500"
            />
          </div>

          {/* Report Type */}
          <div className="flex flex-col gap-2">
            <Label.Root htmlFor="reportType" className="text-sm font-medium text-gray-700">
              Report Type (Select multiple) *
            </Label.Root>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border rounded-lg">
              {reportTypeOptions.map((type) => {
                const value = type.toLowerCase().replace(/\s+/g, '_');
                return (
                  <div key={value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`reportType-${value}`}
                      checked={formValues.reportType.includes(value)}
                      onChange={() => handleSelectChange(value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`reportType-${value}`} className="ml-2 block text-sm text-gray-700">
                      {type}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Examples */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-1 items-center">
              <Label.Root htmlFor="examples" className="text-sm font-medium text-gray-700">
                Examples (Optional)
              </Label.Root>
              <TooltipIcon 
                content="Provide examples of complete, well-formatted reports. This helps the AI understand your preferred style and structure."
              />
            </div>
            <textarea
              id="examples"
              name="examples"
              placeholder="Paste example reports here to show the desired format..."
              value={formValues.examples}
              onChange={handleChange}
              className="p-2 border rounded-lg w-full h-40 resize-none focus:outline-none focus:ring focus:ring-indigo-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500"
          >
            Create Strict Template
          </button>
        </form>
      </div>
    </div>
  );
};

// Reusable Tooltip Component
const TooltipIcon = ({ content }: { content: string }) => (
  <div className="relative group inline-block">
    <svg
      className="text-slate-500"
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.877075 7.49972C0.877075 3.84204 3.84222 0.876892 7.49991 0.876892C11.1576 0.876892 14.1227 3.84204 14.1227 7.49972C14.1227 11.1574 11.1576 14.1226 7.49991 14.1226C3.84222 14.1226 0.877075 11.1574 0.877075 7.49972ZM7.49991 1.82689C4.36689 1.82689 1.82708 4.36671 1.82708 7.49972C1.82708 10.6327 4.36689 13.1726 7.49991 13.1726C10.6329 13.1726 13.1727 10.6327 13.1727 7.49972C13.1727 4.36671 10.6329 1.82689 7.49991 1.82689ZM8.24993 10.5C8.24993 10.9142 7.91414 11.25 7.49993 11.25C7.08571 11.25 6.74993 10.9142 6.74993 10.5C6.74993 10.0858 7.08571 9.75 7.49993 9.75C7.91414 9.75 8.24993 10.0858 8.24993 10.5ZM6.05003 6.25C6.05003 5.57211 6.63511 4.925 7.50003 4.925C8.36496 4.925 8.95003 5.57211 8.95003 6.25C8.95003 6.74118 8.68002 6.99212 8.21447 7.27494C8.16251 7.30651 8.10258 7.34131 8.03847 7.37854L8.03841 7.37858C7.85521 7.48497 7.63788 7.61119 7.47449 7.73849C7.23214 7.92732 6.95003 8.23198 6.95003 8.7C6.95004 9.00376 7.19628 9.25 7.50004 9.25C7.8024 9.25 8.04778 9.00601 8.05002 8.70417L8.05056 8.7033C8.05924 8.6896 8.08493 8.65735 8.15058 8.6062C8.25207 8.52712 8.36508 8.46163 8.51567 8.37436L8.51571 8.37433C8.59422 8.32883 8.68296 8.27741 8.78559 8.21506C9.32004 7.89038 10.05 7.35382 10.05 6.25C10.05 4.92789 8.93511 3.825 7.50003 3.825C6.06496 3.825 4.95003 4.92789 4.95003 6.25C4.95003 6.55376 5.19628 6.8 5.50003 6.8C5.80379 6.8 6.05003 6.55376 6.05003 6.25Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
    <span className="absolute left-3 top-14 transform translate-x-2 -translate-y-full mt-1 px-3 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-40 sm:w-72 z-10">
      {content}
    </span>
  </div>
);

export default Create_template;