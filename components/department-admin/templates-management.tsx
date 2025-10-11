"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  FileText, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DepartmentTemplate {
  id: string;
  templateName: string;
  instructions: string;
  reportTypes: string[];
  examples?: string;
  requiredFields: string[];
  fieldDefinitions: any;
  strictMode: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface TemplatesManagementProps {
  organizationId: string;
}

interface CreateTemplateFormProps {
  organizationId: string;
  onSuccess: () => void;
  onCancel: () => void;
  editTemplate?: DepartmentTemplate | null;
}

// Create Template Form Component
function CreateTemplateForm({ organizationId, onSuccess, onCancel, editTemplate }: CreateTemplateFormProps) {
  const [formData, setFormData] = useState({
    templateName: editTemplate?.templateName || "",
    instructions: editTemplate?.instructions || "",
    examples: editTemplate?.examples || "",
    reportTypes: editTemplate?.reportTypes || [] as string[],
    strictMode: editTemplate?.strictMode ?? true
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
      const url = editTemplate 
        ? `/api/department/templates/${editTemplate.id}`
        : '/api/department/templates';
      
      const method = editTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organizationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editTemplate ? 'update' : 'create'} template`);
      }

      onSuccess();
    } catch (error) {
      console.error(`Error ${editTemplate ? 'updating' : 'creating'} template:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${editTemplate ? 'update' : 'create'} template. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="space-y-2">
        <Label>Report Types *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
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
          {isSubmitting 
            ? (editTemplate ? "Updating..." : "Creating...") 
            : (editTemplate ? "Update Template" : "Create Template")
          }
        </Button>
      </div>
    </form>
  );
}

// Template Preview Component
function TemplatePreview({ template, onClose }: { template: DepartmentTemplate; onClose: () => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="font-semibold">Template Name</Label>
          <p className="mt-1">{template.templateName}</p>
        </div>
        <div>
          <Label className="font-semibold">Status</Label>
          <div className="mt-1">
            <Badge variant={template.isActive ? "default" : "secondary"}>
              {template.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <div>
          <Label className="font-semibold">Strict Mode</Label>
          <div className="mt-1">
            <Badge variant={template.strictMode ? "destructive" : "outline"}>
              {template.strictMode ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </div>
        <div>
          <Label className="font-semibold">Created By</Label>
          <p className="mt-1">{template.creator.firstName} {template.creator.lastName}</p>
        </div>
      </div>

      <div>
        <Label className="font-semibold">Report Types</Label>
        <div className="flex flex-wrap gap-1 mt-2">
          {template.reportTypes.map(type => (
            <Badge key={type} variant="outline" className="capitalize">
              {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label className="font-semibold">Instructions</Label>
        <pre className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm max-h-60 overflow-y-auto">
          {template.instructions}
        </pre>
      </div>

      {template.examples && (
        <div>
          <Label className="font-semibold">Examples</Label>
          <pre className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm max-h-60 overflow-y-auto">
            {template.examples}
          </pre>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

// Main Templates Management Component
export function TemplatesManagement({ organizationId }: TemplatesManagementProps) {
  const [templates, setTemplates] = useState<DepartmentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  
  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DepartmentTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<DepartmentTemplate | null>(null);

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

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/department/templates?orgId=${organizationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchTemplates();
    }
  }, [organizationId]);

  const toggleTemplateStatus = async (templateId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/department/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update template');
      }

      fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Failed to update template status. Please try again.');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/department/templates/${templateId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete template');
      }

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template. Please try again.');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.instructions.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.creator.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.creator.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !selectedType || template.reportTypes.includes(selectedType);
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && template.isActive) ||
                         (statusFilter === "inactive" && !template.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const activeTemplates = templates.filter(t => t.isActive);
  const inactiveTemplates = templates.filter(t => !t.isActive);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    setEditingTemplate(null);
    fetchTemplates();
  };

  const handleEditTemplate = (template: DepartmentTemplate) => {
    setEditingTemplate(template);
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingTemplate(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Department Templates</CardTitle>
          <CardDescription>Loading templates...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded animate-pulse">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeTemplates.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-orange-600">{inactiveTemplates.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Report Types</p>
                <p className="text-2xl font-bold">{new Set(templates.flatMap(t => t.reportTypes)).size}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Department Templates</CardTitle>
              <CardDescription>
                Manage report templates for all officers in your department
              </CardDescription>
            </div>
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Edit Template' : 'Create Department Template'}
                  </DialogTitle>
                </DialogHeader>
                <CreateTemplateForm 
                  organizationId={organizationId}
                  onSuccess={handleCreateSuccess}
                  onCancel={handleCloseForm}
                  editTemplate={editingTemplate}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates by name, instructions, or creator..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="p-2 border rounded text-sm"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All Report Types</option>
                {reportTypeOptions.map(type => (
                  <option key={type} value={type}>
                    {type.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </option>
                ))}
              </select>
              <select
                className="p-2 border rounded text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className={`relative ${!template.isActive ? 'opacity-75' : ''}`}>
                  {!template.isActive && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">Inactive</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-start justify-between">
                      <span className="pr-2">{template.templateName}</span>
                      <Badge variant={template.strictMode ? "destructive" : "outline"} className="text-xs">
                        {template.strictMode ? "Strict" : "Flexible"}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">
                      {template.instructions.substring(0, 120)}...
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {template.reportTypes.slice(0, 3).map(type => (
                        <Badge key={type} variant="outline" className="text-xs capitalize">
                          {type.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </Badge>
                      ))}
                      {template.reportTypes.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.reportTypes.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Created by {template.creator.firstName} {template.creator.lastName}</div>
                      <div>Updated: {new Date(template.updatedAt).toLocaleDateString()}</div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={template.isActive ? "outline" : "default"}
                        onClick={() => toggleTemplateStatus(template.id, template.isActive)}
                      >
                        {template.isActive ? 
                          <XCircle className="h-3 w-3" /> : 
                          <CheckCircle className="h-3 w-3" />
                        }
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Templates Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedType || statusFilter !== "all"
                  ? "Try adjusting your search or filters to see more results." 
                  : "Get started by creating your first department template."}
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <TemplatePreview 
              template={previewTemplate} 
              onClose={() => setPreviewTemplate(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}