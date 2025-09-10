// components/reports/sub-components/TemplateSelectionUI.tsx
import { LayoutTemplate, FileText, Plus, Search, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Template } from "./BaseReport";

interface TemplateSelectionUIProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showTemplates: boolean;
  setShowTemplates: (show: boolean) => void;
  filteredTemplates: Template[];
  setSelectedTemplate: (template: Template) => void;
  router: any;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

const TemplateSelectionUI = ({
  searchTerm,
  setSearchTerm,
  showTemplates,
  setShowTemplates,
  filteredTemplates,
  setSelectedTemplate,
  router,
  searchInputRef
}: TemplateSelectionUIProps) => {
  return (
    <div className="max-w-3xl mx-auto rounded-lg p-6">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="flex items-center space-x-2">
          <LayoutTemplate className="h-6 w-6 text-blue-500" />
          <h2 className="text-[15px] md:text-xl font-semibold text-gray-800">
            Choose a Template to Start Your Report
          </h2>
        </div>
        
        <div className="w-full max-w-md">
          <div className="flex items-center flex-col md:flex-row space-y-2 md:space-y-0 space-x-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowTemplates(true);
                }}
                onFocus={() => setShowTemplates(true)}
                onBlur={() => setTimeout(() => setShowTemplates(false), 200)}
                className="flex-1 pl-9"
              />
              <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Button
              onClick={() => router.push("/create_template")}
              variant="outline"
              className="space-x-2 w-full md:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Create New</span>
            </Button>
          </div>

          {showTemplates && (
            <div className="mt-4 relative space-y-2 max-h-60 bg-white z-20 overflow-y-auto">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowTemplates(false);
                    }}
                    className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 border flex justify-between items-center space-x-3"
                  >
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-gray-800">{template.templateName}</h3>
                        <p className="text-xs text-gray-400">
                          {template.reportTypes.join(", ")}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">No templates found</p>
                  <Button
                    onClick={() => router.push("/create_template")}
                    variant="link"
                    className="mt-2 text-blue-600"
                  >
                    Create your first template
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelectionUI;