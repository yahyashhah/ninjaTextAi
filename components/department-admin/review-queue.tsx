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
  Shield,
  RefreshCw
} from "lucide-react";

interface ReviewQueueProps {
  items: any[];
  onRefresh: () => void;
  loading?: boolean;
}

// Use the same threshold as backend (85)
const REVIEW_THRESHOLD = 85;

export function ReviewQueue({ items, onRefresh, loading }: ReviewQueueProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [activeView, setActiveView] = useState<'queue' | 'details'>('queue');
  const [reviewNotes, setReviewNotes] = useState("");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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
      return null;
    }
  };

  const handleStartReview = async (item: any) => {
    setIsReviewing(true);
    setSelectedItem(item);
    setActiveView('details');
    
    try {
      const response = await fetch(`/api/department/review-queue`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: item.id,
          action: 'assign'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update review status');
      }
      
      onRefresh();
    } catch (error) {
      console.error("Error updating review status:", error);
      alert('Failed to start review. Please try again.');
    }
    setIsReviewing(false);
  };

  const handleResolve = async (action: string) => {
    if (!selectedItem) return;
    
    setIsReviewing(true);
    try {
      const response = await fetch(`/api/department/review-queue`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: selectedItem.id,
          action,
          notes: reviewNotes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resolve review');
      }
      
      setSelectedItem(null);
      setActiveView('queue');
      setReviewNotes("");
      onRefresh();
      alert(`Review item ${action}d successfully!`);
    } catch (error) {
      console.error("Error resolving review item:", error);
      alert(error instanceof Error ? error.message : 'Failed to resolve review');
    } finally {
      setIsReviewing(false);
    }
  };

  const renderNibrsDetails = (nibrsData: any) => {
    if (!nibrsData) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          No NIBRS data available for this report
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Basic Report Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground">Report Type</h4>
            <p>{selectedItem?.report?.reportType || 'N/A'}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground">Accuracy Score</h4>
            <p className={selectedItem?.accuracyScore < REVIEW_THRESHOLD ? "text-red-500 font-bold" : ""}>
              {Math.round(selectedItem?.accuracyScore || 0)}%
            </p>
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
                      <p className="font-medium">{offense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {offense.attemptedCompleted === 'A' ? 'Attempted' : 'Completed'}
                      </p>
                    </div>
                    {offense.mappingConfidence && (
                      <Badge variant="outline">
                        Confidence: {Math.round(offense.mappingConfidence * 100)}%
                      </Badge>
                    )}
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
                      {victim.injury && victim.injury !== 'N' && (
                        <p className="text-sm">Injury: {victim.injury}</p>
                      )}
                    </div>
                  </div>
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
        <Button variant="outline" onClick={() => {
          setActiveView('queue');
          setSelectedItem(null);
          setReviewNotes("");
        }}>
          ← Back to Queue
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Review Report</CardTitle>
            <CardDescription>
              Officer: {selectedItem.report?.user?.firstName} {selectedItem.report?.user?.lastName} • 
              Submitted: {new Date(selectedItem.report?.submittedAt).toLocaleDateString()} • 
              Accuracy: <span className={selectedItem.accuracyScore < REVIEW_THRESHOLD ? "text-red-500 font-bold" : ""}>
                {Math.round(selectedItem.accuracyScore)}%
              </span>
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
                <div className="p-4 border rounded bg-muted/50 max-h-96 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-sm">{selectedItem.report?.content}</p>
                </div>
              </div>
            </div>

            {/* Review Actions */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-4">Review Actions</h3>
              
              {/* Review Notes */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Review Notes</h4>
                <textarea 
                  className="w-full p-3 border rounded"
                  rows={3}
                  placeholder="Add detailed notes about this review..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  onClick={() => handleResolve('approve')}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isReviewing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isReviewing ? "Processing..." : "Approve Report"}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => handleResolve('edit')}
                  disabled={isReviewing}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isReviewing ? "Processing..." : "Edit & Approve"}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => handleResolve('return')}
                  disabled={isReviewing}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isReviewing ? "Processing..." : "Return to Officer"}
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => handleResolve('escalate')}
                  disabled={isReviewing}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {isReviewing ? "Processing..." : "Escalate"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        Loading review queue...
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
              Reports flagged for low accuracy that need review (Accuracy &lt; {REVIEW_THRESHOLD}%)
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
                  const primaryOffense = nibrsData?.offenses?.[0];
                  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== "resolved";
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 border rounded-lg ${
                        selectedItem?.id === item.id ? "bg-muted border-primary" : ""
                      } ${isOverdue ? "border-red-200 bg-red-50" : ""}`}
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
                            {isOverdue && (
                              <Badge variant="destructive">Overdue</Badge>
                            )}
                          </div>
                          
                          <h4 className="font-medium">{item.report?.title || "Untitled Report"}</h4>
                          
                          {primaryOffense && (
                            <p className="text-sm text-muted-foreground">
                              Offense: {primaryOffense.description}
                            </p>
                          )}
                          
                          <p className="text-sm text-muted-foreground">
                            Officer: {item.report?.user?.firstName} {item.report?.user?.lastName} • 
                            Submitted: {new Date(item.report?.submittedAt).toLocaleDateString()}
                          </p>
                          
                          {item.dueDate && (
                            <div className="flex items-center gap-1 mt-2 text-sm">
                              <Clock className="h-3 w-3" />
                              Due: {new Date(item.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          size="sm" 
                          onClick={() => handleStartReview(item)}
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
      
      <div className="space-y-6">
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
                  {items.filter(i => i.dueDate && new Date(i.dueDate) < new Date() && i.status !== "resolved").length}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg. Accuracy</span>
                <span className="font-medium">
                  {items.length > 0 
                    ? Math.round(items.reduce((acc, item) => acc + item.accuracyScore, 0) / items.length)
                    : 0
                  }%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage the review queue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Queue
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                // Implement bulk actions if needed
                alert("Bulk actions feature coming soon");
              }}
            >
              Bulk Actions
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}