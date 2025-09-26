// components/department-admin/review-queue.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Edit, 
  Send, 
  FileText,
  User,
  MapPin,
  Calendar,
  Shield
} from "lucide-react";

interface ReviewQueueProps {
  items: any[];
  onRefresh: () => void;
  loading?: boolean;
}

export function ReviewQueue({ items, onRefresh, loading }: ReviewQueueProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [activeView, setActiveView] = useState<'queue' | 'details'>('queue');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "normal": return "outline";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "in_review": return <Edit className="h-4 w-4" />;
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const parseNibrsData = (nibrsData: string) => {
    try {
      return JSON.parse(nibrsData);
    } catch {
      return {};
    }
  };

  const handleStartReview = async (item: any) => {
    setIsReviewing(true);
    setSelectedItem(item);
    setActiveView('details');
    
    // Mark as in review
    try {
      await fetch(`/api/department/review-queue/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "in_review",
        }),
      });
      onRefresh();
    } catch (error) {
      console.error("Error updating review status:", error);
    }
    setIsReviewing(false);
  };

  const handleResolve = async (action: string, notes?: string) => {
    if (!selectedItem) return;
    
    try {
      await fetch(`/api/department/review-queue/${selectedItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          notes,
          resolvedAt: new Date().toISOString(),
        }),
      });
      
      setSelectedItem(null);
      setActiveView('queue');
      onRefresh();
    } catch (error) {
      console.error("Error resolving review item:", error);
    }
  };

  const renderNibrsDetails = (nibrsData: any) => {
    if (!nibrsData) return null;

    return (
      <div className="space-y-4">
        {/* Administrative Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground">Incident Number</h4>
            <p>{nibrsData.administrative?.incidentNumber || 'N/A'}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground">Date & Time</h4>
            <p>{nibrsData.administrative?.incidentDate} {nibrsData.administrative?.incidentTime}</p>
          </div>
        </div>

        {/* Offenses */}
        {nibrsData.offenses && nibrsData.offenses.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Offenses</h4>
            <div className="space-y-2">
              {nibrsData.offenses.map((offense: any, index: number) => (
                <div key={index} className="p-2 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{offense.description} ({offense.code})</p>
                      <p className="text-sm text-muted-foreground">
                        {offense.attemptedCompleted === 'A' ? 'Attempted' : 'Completed'}
                      </p>
                    </div>
                    <Badge variant="outline">
                      Confidence: {offense.mappingConfidence ? Math.round(offense.mappingConfidence * 100) : 'N/A'}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Victims */}
        {nibrsData.victims && nibrsData.victims.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Victims</h4>
            <div className="space-y-2">
              {nibrsData.victims.map((victim: any, index: number) => (
                <div key={index} className="p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Type: {victim.type}</p>
                      {victim.injury && <p className="text-sm">Injury: {victim.injury}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Properties */}
        {nibrsData.properties && nibrsData.properties.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Properties</h4>
            <div className="space-y-2">
              {nibrsData.properties.map((property: any, index: number) => (
                <div key={index} className="p-2 border rounded">
                  <p className="font-medium">{property.description}</p>
                  {property.value && <p className="text-sm">Value: ${property.value}</p>}
                  {property.seized && <Badge variant="outline" className="mt-1">Seized</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (activeView === 'details' && selectedItem) {
    const nibrsData = parseNibrsData(selectedItem.report?.nibrsData);
    
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setActiveView('queue')}>
          ← Back to Queue
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Review Report</CardTitle>
            <CardDescription>
              Accuracy Score: {Math.round(selectedItem.accuracyScore)}% • 
              Submitted: {new Date(selectedItem.report?.createdAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* NIBRS Data */}
              <div>
                <h3 className="font-medium mb-4">NIBRS Data</h3>
                {renderNibrsDetails(nibrsData)}
              </div>

              {/* Narrative */}
              <div>
                <h3 className="font-medium mb-4">Officer Narrative</h3>
                <div className="p-4 border rounded bg-muted/50">
                  <p className="whitespace-pre-wrap">{selectedItem.report?.content}</p>
                </div>
              </div>
            </div>

            {/* Review Actions */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-4">Review Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  onClick={() => handleResolve('approve')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Report
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => handleResolve('edit')}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit & Approve
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => handleResolve('return')}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Return to Officer
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => handleResolve('escalate')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Escalate to Supervisor
                </Button>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <h4 className="font-medium mb-2">Review Notes</h4>
                <textarea 
                  className="w-full p-3 border rounded"
                  rows={4}
                  placeholder="Add detailed notes about this review..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Review Queue</CardTitle>
            <CardDescription>
              Reports flagged for low accuracy that need review (Accuracy &lt; 80%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-medium text-lg">No items in review queue</h3>
                <p className="text-muted-foreground">All reports meet accuracy standards</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const nibrsData = parseNibrsData(item.report?.nibrsData);
                  const primaryOffense = nibrsData.offenses?.[0];
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                        selectedItem?.id === item.id ? "bg-muted border-primary" : ""
                      }`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getStatusIcon(item.status)}
                              {item.status.replace("_", " ")}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {Math.round(item.accuracyScore)}% accuracy
                            </Badge>
                          </div>
                          
                          <h4 className="font-medium">{item.report?.title || "Untitled Report"}</h4>
                          
                          {primaryOffense && (
                            <p className="text-sm text-muted-foreground">
                              Offense: {primaryOffense.description} ({primaryOffense.code})
                            </p>
                          )}
                          
                          <p className="text-sm text-muted-foreground">
                            Officer: {item.report?.user?.firstName} {item.report?.user?.lastName} • 
                            Submitted: {new Date(item.report?.createdAt).toLocaleDateString()}
                          </p>
                          
                          {item.dueDate && (
                            <div className="flex items-center gap-1 mt-2 text-sm">
                              <Clock className="h-3 w-3" />
                              Due: {new Date(item.dueDate).toLocaleDateString()}
                              {new Date(item.dueDate) < new Date() && (
                                <Badge variant="destructive" className="ml-2">Overdue</Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartReview(item);
                          }}
                          disabled={item.status === "in_review" && selectedItem?.id !== item.id}
                        >
                          {item.status === "pending" ? "Start Review" : "Continue Review"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Queue Statistics</CardTitle>
            <CardDescription>
              Overview of review queue performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Items</span>
                <span className="font-medium">{items.length}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Review</span>
                <span className="font-medium">
                  {items.filter(i => i.status === "pending").length}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">In Progress</span>
                <span className="font-medium">
                  {items.filter(i => i.status === "in_review").length}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Overdue Items</span>
                <span className="font-medium text-destructive">
                  {items.filter(i => new Date(i.dueDate) < new Date() && i.status !== "resolved").length}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg. Resolution Time</span>
                <span className="font-medium">
                  {Math.round(items.reduce((acc, item) => acc + (item.processingTime || 0), 0) / 
                   Math.max(1, items.filter(i => i.processingTime).length) / 3600000)}h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {selectedItem && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Actions for the selected report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full mb-2" 
                onClick={() => handleStartReview(selectedItem)}
              >
                Start Detailed Review
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleResolve("approve", "Quick approval")}
              >
                Quick Approve
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}