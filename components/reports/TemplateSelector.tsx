// components/reports/sub-components/TemplateSelection.tsx
import { LayoutTemplate, FileText, Plus, ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Template } from "./BaseReport";

interface TemplateSelectionProps {
  selectedTemplate: Template;
  setSelectedTemplate: (template: Template | null) => void;
  filteredTemplates: Template[];
  router: any;
  setSearchTerm: (term: string) => void;
  setShowTemplates: (show: boolean) => void;
}

const TemplateSelec = ({
  selectedTemplate,
  setSelectedTemplate,
  filteredTemplates,
  router,
  setSearchTerm,
  setShowTemplates
}: TemplateSelectionProps) => {
  return (
    <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-2">
        <LayoutTemplate className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-500">Template:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span>{selectedTemplate.templateName}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {filteredTemplates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className="cursor-pointer flex items-center space-x-2"
              >
                <FileText className="h-4 w-4 text-blue-500" />
                <span>{template.templateName}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem 
              onClick={() => router.push("/create-template")}
              className="cursor-pointer flex items-center text-blue-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Create New Template</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Button
        variant="ghost"
        onClick={() => {
          setSelectedTemplate(null);
          setSearchTerm("");
          setShowTemplates(false);
        }}
        className="text-red-500 hover:text-red-700 flex items-center space-x-1"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Change Template</span>
      </Button>
    </div>
  );
};

export default TemplateSelec;