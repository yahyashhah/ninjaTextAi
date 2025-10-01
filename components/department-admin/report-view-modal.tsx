// components/department-admin/report-view-modal.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  FileText, 
  User, 
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Shield
} from "lucide-react";

interface Report {
  id: string;
  title: string;
  reportType: string;
  status: string;
  submittedAt: string;
  accuracyScore?: number;
  content: string;
  rawText?: string;
  finalNarrative?: string;
  nibrsData?: string;
  flagged?: boolean;
  flagReason?: string;
  missingFields?: string[];
  warnings?: string[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewQueueItems: any[];
}

interface ReportViewModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportViewModal({ report, isOpen, onClose }: ReportViewModalProps) {
  const [activeTab, setActiveTab] = useState("content");

  if (!report) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending_review':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending_review':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${filename.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const parseNibrsData = (nibrsData: string) => {
    try {
      return JSON.parse(nibrsData);
    } catch (error) {
      return null;
    }
  };

  const nibrsData = report.nibrsData ? parseNibrsData(report.nibrsData) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {report.title}
          </DialogTitle>
        </DialogHeader>

        {/* Report Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Officer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{report.user.firstName} {report.user.lastName}</p>
              <p className="text-xs text-muted-foreground">{report.user.email}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Submitted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{new Date(report.submittedAt).toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(report.submittedAt).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Status & Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(report.status)}
                <Badge variant={getStatusVariant(report.status)}>
                  {report.status.replace('_', ' ')}
                </Badge>
              </div>
              <Badge variant="outline" className="text-xs">
                {report.reportType}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.accuracyScore ? (
                <div className="flex items-center gap-2">
                  <Badge variant={report.accuracyScore < 85 ? 'destructive' : 'default'}>
                    {report.accuracyScore}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {report.accuracyScore >= 85 ? 'High' : 'Needs Review'}
                  </span>
                </div>
              ) : (
                <Badge variant="outline">Not Scored</Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different content views */}
        <div className="border-b mb-4">
          <div className="flex space-x-4">
            <Button
              variant={activeTab === "content" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("content")}
            >
              Report Content
            </Button>
            {nibrsData && (
              <Button
                variant={activeTab === "nibrs" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("nibrs")}
              >
                NIBRS Data
              </Button>
            )}
            {report.rawText && (
              <Button
                variant={activeTab === "raw" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("raw")}
              >
                Raw Text
              </Button>
            )}
            {report.finalNarrative && (
              <Button
                variant={activeTab === "narrative" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("narrative")}
              >
                Final Narrative
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          {/* Warnings and Flags */}
          {report.flagged && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  Flagged Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700">{report.flagReason}</p>
              </CardContent>
            </Card>
          )}

          {report.warnings && report.warnings.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-4 w-4" />
                  Warnings ({report.warnings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-orange-700 list-disc list-inside space-y-1">
                  {report.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {report.missingFields && report.missingFields.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="h-4 w-4" />
                  Missing Fields ({report.missingFields.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                  {report.missingFields.map((field, index) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Report Content */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg">
                {activeTab === "content" && "Report Content"}
                {activeTab === "raw" && "Raw Text"}
                {activeTab === "narrative" && "Final Narrative"}
                {activeTab === "nibrs" && "NIBRS Data"}
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const content = activeTab === "content" ? report.content :
                                activeTab === "raw" ? report.rawText || "" :
                                activeTab === "narrative" ? report.finalNarrative || "" :
                                activeTab === "nibrs" ? report.nibrsData || "" : "";
                  handleDownload(content, `${report.title}-${activeTab}`);
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                {activeTab === "content" && (
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {report.content}
                  </pre>
                )}
                
                {activeTab === "raw" && report.rawText && (
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {report.rawText}
                  </pre>
                )}
                
                {activeTab === "narrative" && report.finalNarrative && (
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {report.finalNarrative}
                  </pre>
                )}
                
                {activeTab === "nibrs" && nibrsData && (
                  <div className="space-y-4">
                    {/* Administrative Section */}
                    <div>
                      <h4 className="font-semibold mb-2">Administrative Information</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Incident Number:</strong> {nibrsData.administrative?.incidentNumber}</div>
                        <div><strong>Date:</strong> {nibrsData.administrative?.incidentDate}</div>
                        <div><strong>Time:</strong> {nibrsData.administrative?.incidentTime}</div>
                        <div><strong>Location:</strong> {nibrsData.locationCode}</div>
                      </div>
                    </div>

                    {/* Offenses Section */}
                    {nibrsData.offenses && nibrsData.offenses.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Offenses</h4>
                        <div className="space-y-2">
                          {nibrsData.offenses.map((offense: any, index: number) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-3">
                              <div className="flex justify-between">
                                <strong>{offense.code}: {offense.description}</strong>
                                <Badge variant="outline">{offense.attemptedCompleted}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Properties Section */}
                    {nibrsData.properties && nibrsData.properties.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Properties</h4>
                        <div className="space-y-2">
                          {nibrsData.properties.map((property: any, index: number) => (
                            <div key={index} className="border-l-4 border-green-500 pl-3">
                              <div className="flex justify-between">
                                <span>{property.description}</span>
                                {property.value && <span>Value: ${property.value}</span>}
                              </div>
                              {property.seized && <Badge variant="secondary">Seized</Badge>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Offenders Section */}
                    {nibrsData.offenders && nibrsData.offenders.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Offenders</h4>
                        <div className="space-y-2">
                          {nibrsData.offenders.map((offender: any, index: number) => (
                            <div key={index} className="border-l-4 border-red-500 pl-3">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><strong>Age:</strong> {offender.age}</div>
                                <div><strong>Sex:</strong> {offender.sex}</div>
                                <div><strong>Race:</strong> {offender.race}</div>
                                <div><strong>Ethnicity:</strong> {offender.ethnicity}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Narrative Section */}
                    {nibrsData.narrative && (
                      <div>
                        <h4 className="font-semibold mb-2">Narrative</h4>
                        <p className="text-sm bg-white p-3 rounded border">
                          {nibrsData.narrative}
                        </p>
                      </div>
                    )}

                    {/* Raw JSON View */}
                    <details>
                      <summary className="cursor-pointer font-semibold text-sm">Raw JSON Data</summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(nibrsData, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Reviews */}
          {report.reviewQueueItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Reviews ({report.reviewQueueItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.reviewQueueItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Review #{index + 1}</p>
                        <p className="text-sm text-muted-foreground">
                          Accuracy: {item.accuracyScore}% • Priority: {item.priority}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(item.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}