// components/reports/UnifiedReport.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Save, 
  Download, 
  Printer, 
  Edit, 
  Copy, 
  ListChecks, 
  FileText, 
  ShieldAlert, 
  Package, 
  User, 
  MapPin, 
  AlertTriangle,
  Users,
} from "lucide-react";
import downloadXML from "@/lib/nibrs/downloadXML";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";

interface UnifiedReportProps {
  narrative: string;
  nibrsData: any;
  xmlData: string | null;
  reportType: string;
  onSave?: (savedData: any) => void;
}

export const UnifiedReport = ({ 
  narrative, 
  nibrsData, 
  xmlData, 
  reportType,
  onSave 
}: UnifiedReportProps) => {
  const [reportName, setReportName] = useState(`NIBRS Report - ${new Date().toLocaleDateString()}`);
  const [editedNarrative, setEditedNarrative] = useState(narrative);
  const [editedNibrs, setEditedNibrs] = useState(nibrsData);
  const [isEditingNibrs, setIsEditingNibrs] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const printableRef = useRef<HTMLDivElement>(null);

  // Calculate total property value
  const totalPropertyValue = editedNibrs.properties?.reduce((total: number, property: any) => {
    return total + (property.value || 0);
  }, 0) || 0;

  // Helper functions
  const formatArrestType = (type: string) => {
    const typeMap: Record<string, string> = {
      "O": "On-view Arrest", 
      "S": "Summoned/Cited", 
      "T": "Taken into Custody", 
      "A": "Arrested"
    };
    return typeMap[type] || type;
  };

  const formatVictimType = (type: string) => {
    const typeMap: Record<string, string> = {
      "I": "Individual", 
      "B": "Business", 
      "S": "Society/Public", 
      "R": "Resident", 
      "O": "Other",
      "U": "Unknown"
    };
    return typeMap[type] || type;
  };

  const formatLossType = (type: string) => {
    const typeMap: Record<string, string> = {
      "1": "None",
      "2": "Burned",
      "3": "Counterfeited",
      "4": "Destroyed",
      "5": "Recovered", 
      "6": "Seized",
      "7": "Stolen",
      "8": "Unknown"
    };
    return typeMap[type] || type;
  };

  // Save the complete report
  const handleSaveReport = async () => {
    if (!reportName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a report name",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await axios.post("/api/save_report", {
        reportName: reportName.trim(),
        reportText: editedNarrative,
        tag: reportType,
        nibrsData: editedNibrs,
        generateXml: true
      });

      toast({
        title: "Success",
        description: "Report saved successfully to filing cabinet",
        variant: "default",
      });

      if (onSave) {
        onSave({
          narrative: editedNarrative,
          nibrsData: editedNibrs,
          reportName: reportName
        });
      }

      setConfirmName("");

    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save report",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Download as text file
  const handleDownloadTxt = () => {
    const content = `
NIBRS REPORT - ${reportName}
Generated: ${new Date().toLocaleDateString()}

NARRATIVE:
${editedNarrative}

NIBRS SUMMARY:
Incident Number: ${editedNibrs.administrative?.incidentNumber}
Date: ${editedNibrs.administrative?.incidentDate}
Time: ${editedNibrs.administrative?.incidentTime || 'Unknown'}

OFFENSES:
${editedNibrs.offenses?.map((offense: any) => 
  `- ${offense.code}: ${offense.description} (${offense.attemptedCompleted === 'A' ? 'Attempted' : 'Completed'})`
).join('\n') || 'None'}

VICTIMS:
${editedNibrs.victims?.map((victim: any) => 
  `- ${victim.type}: ${victim.name || 'Unknown'}`
).join('\n') || 'None'}

PROPERTIES:
${editedNibrs.properties?.map((property: any) => 
  `- ${property.description}: $${property.value || 0}`
).join('\n') || 'None'}

Total Property Value: $${totalPropertyValue}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportName.replace(/[^a-z0-9]/gi, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Print function
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && printableRef.current) {
      const printContent = printableRef.current.innerHTML;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${reportName}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                line-height: 1.4;
                color: #333;
              }
              .print-header { 
                border-bottom: 3px solid #000; 
                padding-bottom: 10px; 
                margin-bottom: 30px;
              }
              .print-section { 
                margin-bottom: 25px; 
                page-break-inside: avoid;
              }
              .print-card { 
                border: 1px solid #ddd; 
                padding: 15px; 
                margin: 10px 0; 
                border-radius: 5px;
                background: #f9f9f9;
              }
              .print-badge { 
                background: #e0e0e0; 
                padding: 2px 8px; 
                border-radius: 3px; 
                font-size: 12px;
                font-weight: bold;
                margin-right: 5px;
              }
              .print-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 10px;
                margin: 10px 0;
              }
              @media print {
                body { margin: 0.5in; }
                .print-section { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>NIBRS Report - ${reportName}</h1>
              <p>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            </div>
            ${printContent}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    const content = `NIBRS REPORT: ${reportName}\n\nNARRATIVE:\n${editedNarrative}\n\nNIBRS DATA:\n${JSON.stringify(editedNibrs, null, 2)}`;
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied",
        description: "Report content copied to clipboard",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // NIBRS Field Editor Component
  const NIBRSEditor = () => {
    const updateNibrsField = (path: string, value: any) => {
      const keys = path.split('.');
      const newNibrs = { ...editedNibrs };
      let current: any = newNibrs;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      setEditedNibrs(newNibrs);
    };

    const updateArrayField = (arrayPath: string, index: number, field: string, value: any) => {
      const keys = arrayPath.split('.');
      const newNibrs = { ...editedNibrs };
      let current: any = newNibrs;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      const array = current[keys[keys.length - 1]];
      if (array && array[index]) {
        array[index] = { ...array[index], [field]: value };
        setEditedNibrs(newNibrs);
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center">
              <Edit className="h-5 w-5 mr-2" />
              Edit NIBRS Report Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Administrative Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Administrative Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Incident Number *</Label>
                  <Input
                    value={editedNibrs.administrative?.incidentNumber || ""}
                    onChange={(e) => updateNibrsField('administrative.incidentNumber', e.target.value)}
                    placeholder="INC-2025-001"
                  />
                </div>
                <div>
                  <Label>Incident Date *</Label>
                  <Input
                    type="date"
                    value={editedNibrs.administrative?.incidentDate || ""}
                    onChange={(e) => updateNibrsField('administrative.incidentDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Incident Time</Label>
                  <Input
                    type="time"
                    value={editedNibrs.administrative?.incidentTime || ""}
                    onChange={(e) => updateNibrsField('administrative.incidentTime', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Cleared Exceptionally</Label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={editedNibrs.administrative?.clearedExceptionally || "N"}
                    onChange={(e) => updateNibrsField('administrative.clearedExceptionally', e.target.value)}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Offenses Editor */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Offenses</h3>
              {editedNibrs.offenses?.map((offense: any, index: number) => (
                <Card key={index} className="border-2">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-lg">Offense #{index + 1}</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newOffenses = editedNibrs.offenses.filter((_: any, i: number) => i !== index);
                          updateNibrsField('offenses', newOffenses);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Offense Code *</Label>
                        <Input
                          value={offense.code}
                          onChange={(e) => updateArrayField('offenses', index, 'code', e.target.value)}
                          placeholder="13A"
                        />
                      </div>
                      <div>
                        <Label>Description *</Label>
                        <Input
                          value={offense.description}
                          onChange={(e) => updateArrayField('offenses', index, 'description', e.target.value)}
                          placeholder="Aggravated Assault"
                        />
                      </div>
                      <div>
                        <Label>Attempted/Completed</Label>
                        <select 
                          className="w-full p-2 border rounded"
                          value={offense.attemptedCompleted || "C"}
                          onChange={(e) => updateArrayField('offenses', index, 'attemptedCompleted', e.target.value)}
                        >
                          <option value="A">Attempted</option>
                          <option value="C">Completed</option>
                        </select>
                      </div>
                      <div>
                        <Label>Location Description</Label>
                        <Input
                          value={offense.locationDescription || ""}
                          onChange={(e) => updateArrayField('offenses', index, 'locationDescription', e.target.value)}
                          placeholder="Pine Street Residence"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  const newOffenses = [...(editedNibrs.offenses || []), {
                    code: "",
                    description: "",
                    attemptedCompleted: "C",
                    sequenceNumber: (editedNibrs.offenses?.length || 0) + 1
                  }];
                  updateNibrsField('offenses', newOffenses);
                }}
              >
                Add Offense
              </Button>
            </div>

            {/* Properties Editor */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Properties</h3>
              {editedNibrs.properties?.map((property: any, index: number) => (
                <Card key={index} className="border-2">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-lg">Property #{index + 1}</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newProperties = editedNibrs.properties.filter((_: any, i: number) => i !== index);
                          updateNibrsField('properties', newProperties);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Description *</Label>
                        <Input
                          value={property.description}
                          onChange={(e) => updateArrayField('properties', index, 'description', e.target.value)}
                          placeholder="Laptop"
                        />
                      </div>
                      <div>
                        <Label>Value ($)</Label>
                        <Input
                          type="number"
                          value={property.value || 0}
                          onChange={(e) => updateArrayField('properties', index, 'value', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Loss Type</Label>
                        <select 
                          className="w-full p-2 border rounded"
                          value={property.lossType || "7"}
                          onChange={(e) => updateArrayField('properties', index, 'lossType', e.target.value)}
                        >
                          <option value="1">None</option>
                          <option value="2">Burned</option>
                          <option value="3">Counterfeited</option>
                          <option value="4">Destroyed</option>
                          <option value="5">Recovered</option>
                          <option value="6">Seized</option>
                          <option value="7">Stolen</option>
                          <option value="8">Unknown</option>
                        </select>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`seized-${index}`}
                          checked={property.seized || false}
                          onChange={(e) => updateArrayField('properties', index, 'seized', e.target.checked)}
                          className="mr-2"
                        />
                        <Label htmlFor={`seized-${index}`}>Seized as Evidence</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  const newProperties = [...(editedNibrs.properties || []), {
                    description: "",
                    value: 0,
                    lossType: "7",
                    seized: false,
                    sequenceNumber: (editedNibrs.properties?.length || 0) + 1
                  }];
                  updateNibrsField('properties', newProperties);
                }}
              >
                Add Property
              </Button>
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <Button 
                onClick={() => setIsEditingNibrs(false)}
                className="bg-green-600 hover:bg-green-700"
              >
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditedNibrs(nibrsData);
                  setIsEditingNibrs(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // NIBRS Summary Display Component
  const NIBRSSummary = () => (
    <div ref={printableRef}>
      {/* Administrative Summary */}
      <Card className="mb-6">
        <CardHeader className="bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ListChecks className="h-5 w-5 text-green-600" />
              <CardTitle>NIBRS Report Summary</CardTitle>
            </div>
            {editedNibrs.metadata?.source === "rag" && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                RAG Enhanced
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-6 p-4 bg-blue-50 rounded-lg">
            <div><span className="font-medium">Incident #:</span> {editedNibrs.administrative?.incidentNumber}</div>
            <div><span className="font-medium">Date:</span> {editedNibrs.administrative?.incidentDate}</div>
            <div><span className="font-medium">Time:</span> {editedNibrs.administrative?.incidentTime || "Unknown"}</div>
            <div><span className="font-medium">Cleared:</span> {editedNibrs.administrative?.clearedExceptionally === "Y" ? "Yes" : "No"}</div>
          </div>

          {/* Offenses Section */}
          {editedNibrs.offenses && editedNibrs.offenses.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3 flex items-center">
                <ShieldAlert className="h-5 w-5 mr-2 text-blue-600" />
                Offenses ({editedNibrs.offenses.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {editedNibrs.offenses.map((offense: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        {offense.code}
                      </Badge>
                      <Badge variant={offense.attemptedCompleted === "C" ? "default" : "secondary"} 
                            className={offense.attemptedCompleted === "C" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                        {offense.attemptedCompleted === "A" ? "Attempted" : "Completed"}
                      </Badge>
                    </div>
                    <div className="font-medium text-sm mb-1">{offense.description}</div>
                    {offense.locationDescription && (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {offense.locationDescription}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Properties Section */}
          {editedNibrs.properties && editedNibrs.properties.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3 flex items-center">
                <Package className="h-5 w-5 mr-2 text-purple-600" />
                Property Evidence ({editedNibrs.properties.length})
              </h4>
              <div className="mb-3 p-3 bg-white rounded border shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Property Value:</span>
                  <span className="text-lg font-bold text-purple-600">${totalPropertyValue.toLocaleString()}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {editedNibrs.properties.map((property: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={property.seized ? "default" : "secondary"} 
                            className={property.seized ? "bg-purple-100 text-purple-800" : "bg-gray-100"}>
                        {property.seized ? "Seized" : "Not Seized"}
                      </Badge>
                      {property.value > 0 && (
                        <span className="font-medium text-green-600">${property.value.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="font-medium">{property.description}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Loss Type: {formatLossType(property.lossType)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Victims Section */}
          {editedNibrs.victims && editedNibrs.victims.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3 flex items-center">
                <User className="h-5 w-5 mr-2 text-green-600" />
                Victims ({editedNibrs.victims.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {editedNibrs.victims.map((victim: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        {formatVictimType(victim.type)}
                      </Badge>
                      {victim.victimId && (
                        <span className="text-xs text-gray-500">ID: {victim.victimId}</span>
                      )}
                    </div>
                    {victim.name && victim.name !== "Unknown" && (
                      <div className="font-medium">{victim.name}</div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      {victim.age && <div><span className="font-medium">Age:</span> {victim.age}</div>}
                      {victim.sex && victim.sex !== "U" && <div><span className="font-medium">Sex:</span> {victim.sex}</div>}
                      {victim.injury && <div><span className="font-medium">Injury:</span> {victim.injury}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Arrestees Section */}
          {editedNibrs.arrestees && editedNibrs.arrestees.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                Arrest Information ({editedNibrs.arrestees.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editedNibrs.arrestees.map((arrestee: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        Arrest #{arrestee.sequenceNumber}
                      </Badge>
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        {formatArrestType(arrestee.arrestType)}
                      </Badge>
                    </div>
                    {arrestee.name && arrestee.name !== "Unknown" && (
                      <div className="font-medium text-lg mb-2">{arrestee.name}</div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="font-medium">Date:</span> {arrestee.arrestDate}</div>
                      {arrestee.age && <div><span className="font-medium">Age:</span> {arrestee.age}</div>}
                      {arrestee.sex && <div><span className="font-medium">Sex:</span> {arrestee.sex}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Narrative Section */}
      <Card>
        <CardHeader className="bg-gray-50">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle>Narrative Report</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Textarea
            value={editedNarrative}
            onChange={(e) => setEditedNarrative(e.target.value)}
            className="min-h-[300px] w-full p-4 border rounded-lg font-mono text-sm leading-relaxed"
            placeholder="Edit the narrative report..."
          />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-4 bg-white rounded-lg shadow-lg">
      {/* Unified Toolbar */}
      <div className="toolbar mb-6 flex flex-wrap gap-3 items-center bg-gray-50 p-4 rounded-lg">
        <div className="flex-1 min-w-[300px]">
          <Label htmlFor="report-name" className="block text-sm font-medium mb-1">
            Report Name
          </Label>
          <Input
            id="report-name"
            type="text"
            placeholder="Enter report name..."
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Save className="h-4 w-4 mr-2" />
                Save Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Report Save</DialogTitle>
                <DialogDescription className="mt-2">
                  This will save the report to your filing cabinet. 
                  Please type the report name to confirm.
                  <Input
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    className="mt-3"
                    placeholder="Type the report name here"
                  />
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={handleSaveReport}
                  disabled={!confirmName || confirmName !== reportName || isSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? "Saving..." : "Confirm Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={handleDownloadTxt} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            TXT
          </Button>

          <Button 
            onClick={() => xmlData && downloadXML(xmlData, editedNibrs)} 
            variant="outline"
            disabled={!xmlData}
          >
            <Download className="h-4 w-4 mr-2" />
            XML
          </Button>

          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>

          <Button onClick={handleCopy} variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>

          <Button 
            onClick={() => setIsEditingNibrs(!isEditingNibrs)} 
            variant={isEditingNibrs ? "default" : "outline"}
            className={isEditingNibrs ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditingNibrs ? "View Report" : "Edit NIBRS"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {isEditingNibrs ? <NIBRSEditor /> : <NIBRSSummary />}

      {/* Summary Footer */}
      <Alert className="mt-6 bg-blue-50 border-blue-200">
        <AlertDescription>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="font-medium">Offenses:</span> {editedNibrs.offenses?.length || 0}</div>
            <div><span className="font-medium">Victims:</span> {editedNibrs.victims?.length || 0}</div>
            <div><span className="font-medium">Properties:</span> {editedNibrs.properties?.length || 0}</div>
            <div><span className="font-medium">Arrestees:</span> {editedNibrs.arrestees?.length || 0}</div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};