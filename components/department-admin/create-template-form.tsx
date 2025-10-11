"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface CreateTemplateFormProps {
  organizationId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateTemplateForm({ organizationId, onSuccess, onCancel }: CreateTemplateFormProps) {
  const [formData, setFormData] = useState({
    templateName: "",
    instructions: "",
    examples: "",
    reportTypes: [] as string[],
    strictMode: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportTypeOptions = [
    "incident_report",
    "arrest_report", 
    "accident_report",
    "witness_statement",
    "use_of_force_report",
    "domestic_violence_report",
    "field_interview_report",
    "supplemental_report"
  ];

  const handleReportTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      reportTypes: prev.reportTypes.includes(type)
        ? prev.reportTypes.filter(t => t !== type)
        : [...prev.reportTypes, type]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.templateName.trim() || !formData.instructions.trim() || formData.reportTypes.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/department/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organizationId
          // No requiredFields or fieldDefinitions - they're empty by default
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create template');
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating template:', error);
      alert(error instanceof Error ? error.message : 'Failed to create template. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Name */}
      <div className="space-y-2">
        <Label htmlFor="templateName">Template Name *</Label>
        <Input
          id="templateName"
          value={formData.templateName}
          onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
          placeholder="Enter template name"
          required
        />
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions for AI *</Label>
        <Textarea
          id="instructions"
          value={formData.instructions}
          onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
          placeholder="Describe the exact format and structure for the report..."
          rows={6}
          required
        />
        <p className="text-sm text-muted-foreground">
          Be specific about the format, sections, and any requirements for the report.
        </p>
      </div>

      {/* Report Types */}
      <div className="space-y-2">
        <Label>Report Types *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-lg">
          {reportTypeOptions.map((type) => (
            <div key={type} className="flex items-center">
              <input
                type="checkbox"
                id={`type-${type}`}
                checked={formData.reportTypes.includes(type)}
                onChange={() => handleReportTypeToggle(type)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`type-${type}`} className="ml-2 block text-sm text-gray-700 capitalize">
                {type.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </label>
            </div>
          ))}
        </div>
        {formData.reportTypes.length === 0 && (
          <p className="text-sm text-red-600">Please select at least one report type</p>
        )}
      </div>

      {/* Examples */}
      <div className="space-y-2">
        <Label htmlFor="examples">Examples (Optional)</Label>
        <Textarea
          id="examples"
          value={formData.examples}
          onChange={(e) => setFormData(prev => ({ ...prev, examples: e.target.value }))}
          placeholder="Provide example reports to show the desired format..."
          rows={4}
        />
        <p className="text-sm text-muted-foreground">
          Include complete, well-formatted reports to help the AI understand your preferred style.
        </p>
      </div>

      {/* Strict Mode */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="strictMode"
          checked={formData.strictMode}
          onChange={(e) => setFormData(prev => ({ ...prev, strictMode: e.target.checked }))}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <Label htmlFor="strictMode">Enable Strict Validation</Label>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">
        When enabled, the system will validate that reports follow the template structure more strictly.
      </p>

      {/* Submit Buttons */}
      <div className="flex gap-3 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formData.templateName.trim() || !formData.instructions.trim() || formData.reportTypes.length === 0}
        >
          {isSubmitting ? "Creating..." : "Create Template"}
        </Button>
      </div>
    </form>
  );
}