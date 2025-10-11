// components/reports/BaseReport.tsx - SIMPLIFIED WITHOUT TEMPLATE SELECTION
"use client";

import * as z from "zod";
import { useEffect, useState, useRef } from "react";
import { useVoiceToText } from "react-speakup";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "@/components/loader";
import { useToast } from "@/components/ui/use-toast";
import HelpModal from "./HelpModal";
import Header from "./Header";
import ReportOutput from "./ReportOutput";
import RecordingControls from "./RecordingControls";
import PromptInput from "./PromptInput";
import DictationTemplate from "./DictationTemplate";
import WritingTemplate from "./WritingTemplate";
import ReviewModal from "./ReviewModal";
import MultiOffenseSelector from "./OffenceSelector";
import { OffenseType } from "@/constants/offences";
import CorrectionUI from "./CorrectionUI";

export type Template = {
  id: string;
  templateName: string;
  instructions: string;
  reportTypes: string[];
  createdAt: string;
  requiredFields?: string[];
  fieldDefinitions?: any;
  strictMode?: boolean;
};

interface BaseReportProps {
  reportType: string;
  reportName: string;
  reportIcon: React.ReactNode;
  formSchema: z.ZodTypeAny;
  apiEndpoint: string;
  helpContent: React.ReactNode;
  defaultTip: string;
  recordingTip: string;
}

interface CorrectionData {
  error: string;
  missingFields: string[];
  requiredLevel?: string;
  suggestions: string[];
  warnings: string[];
  nibrsData: any;
  confidence?: any;
  correctionContext?: any;
  type?: string;
  isComplete?: boolean;
  confidenceScore?: number;
  source?: "nibrs" | "template" | "offense";
  errorCategory?: string;
  severity?: "REQUIRED" | "WARNING" | "OPTIONAL";
  guidance?: string;
  categorizedFields?: any;
  templateName?: string;
  offenseName?: string;
  offenseCode?: string;
  offenses?: OffenseType[];
  fieldExamples?: { [key: string]: string };
  validationDetails?: any;
  sessionKey?: string;
  originalNarrative?: string;
  offenseValidation?: {
    suggestedOffense: OffenseType | null;
    confidence: number;
    reason: string;
    matches: string[];
    mismatches: string[];
    alternativeOffenses: OffenseType[];
  };
  multiOffenseValidation?: {
    validatedOffenses: {
      offense: OffenseType;
      validation: any;
      offenseValidation?: any;
    }[];
    allComplete: boolean;
    combinedMissingFields: string[];
    combinedPresentFields: string[];
    primaryOffense?: OffenseType;
  };
}

// SIMPLIFIED: Only two steps now
type WorkflowStep = 'offense-selection' | 'report-creation' | 'report-complete';

const BaseReport = ({
  reportType,
  reportName,
  reportIcon,
  formSchema,
  apiEndpoint,
  helpContent,
  defaultTip,
  recordingTip
}: BaseReportProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const { startListening, stopListening, transcript } = useVoiceToText();
  
  // SIMPLIFIED: Start with offense selection directly
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('offense-selection');
  const [selectedOffenses, setSelectedOffenses] = useState<OffenseType[]>([]);
  
  // Existing states (removed template-related states)
  const [prompt, setPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [narrativeMessage, setNarrativeMessage] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [showRecordingControls, setShowRecordingControls] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [correctionData, setCorrectionData] = useState<CorrectionData | null>(null);
  const [showDictationTemplate, setShowDictationTemplate] = useState(false);
  const [inputMode, setInputMode] = useState<'typing' | 'recording' | 'ready-to-record'>('ready-to-record');
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean; 
    fieldName: string; 
    options: string[];
    currentSegment?: string;
    currentField?: string;
  }>({
    isOpen: false,
    fieldName: "",
    options: []
  });
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const timerRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTranscriptRef = useRef("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  // SIMPLIFIED: Just set the offenses array and go to report creation
  const handleOffensesSelect = (offenses: OffenseType[]) => {
    setSelectedOffenses(offenses);
    setWorkflowStep('report-creation');
    
    toast({
      title: offenses.length === 1 ? "Offense Selected" : "Offenses Selected",
      description: `${offenses.length} offense${offenses.length === 1 ? '' : 's'} loaded. Please provide the incident details.`,
      variant: "default",
    });
  };

  // Handle back navigation in workflow
  const handleBack = () => {
    if (workflowStep === 'report-creation') {
      setWorkflowStep('offense-selection');
      setSelectedOffenses([]);
      setPrompt("");
      setNarrativeMessage("");
    }
  };

  // Field options for DictationTemplate buttons
  const fieldOptions = {
    incidentType: ["Burglary", "Assault", "Theft", "Robbery", "Vandalism", "Domestic Violence", "Drug Offense", "Traffic Incident", "Other"],
    victimGender: ["Male", "Female", "Unknown"],
    race: ["White", "Black", "Asian", "Native American", "Pacific Islander", "Unknown"],
    ethnicity: ["Hispanic/Latino", "Non-Hispanic", "Unknown"],
    relationship: ["Stranger", "Acquaintance", "Family Member", "Spouse/Partner", "Neighbor", "Coworker", "Unknown"],
    offenseStatus: ["Attempted", "Completed"],
    injuryType: ["None", "Minor", "Serious", "Fatal"],
    forceUsed: ["None", "Physical", "Weapon", "Threat", "Coercion"],
    propertyLoss: ["Stolen", "Damaged", "Recovered", "Seized"],
    arrestStatus: ["Arrested", "Not Arrested", "Summons", "Warrant"],
    bodyCam: ["Was used", "Was not used"],
    location: ["Residence", "Business", "Street", "Park", "School", "Vehicle", "Other"],
    victimName: ["Unknown", "Withheld"],
    victimAge: ["Unknown", "Adult", "Juvenile", "Elderly"],
    suspectAge: ["Unknown", "Teenager", "Adult", "Elderly"],
    statute: ["Unknown", "To be determined"],
    offenseDescription: ["Unknown", "To be specified"],
    clothing: ["Unknown", "Dark clothing", "Light clothing", "Uniform", "Casual"],
    physicalDescription: ["Unknown", "Average build", "Tall", "Short", "Muscular", "Slender"],
    offenderCount: ["Unknown", "One", "Two", "Three", "Multiple"],
    propertyItems: ["Unknown", "Electronics", "Jewelry", "Cash", "Documents", "Vehicle"],
    propertyDescription: ["Unknown", "Personal items", "Valuables", "Evidence"],
    propertyValue: ["Unknown", "Under $100", "$100-$500", "$500-$1000", "Over $1000"],
    arrestType: ["Taken into custody", "Summons", "On view", "Warrant"],
    charges: ["Unknown", "To be determined"],
    general: ["Please continue dictating and specify what you need help with"]
  };

  // Check if user has seen the help modal before
  useEffect(() => {
    const hasSeenHelp = localStorage.getItem(`${reportType}HelpSeen`);
    if (!hasSeenHelp) {
      setShowHelpModal(true);
      localStorage.setItem(`${reportType}HelpSeen`, 'true');
    }
  }, [reportType]);

  // Format time to 00:00:00
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // Start recording handler
  const prepareRecording = () => {
    setInputMode('ready-to-record');
    setShowRecordingControls(true);
    setShowDictationTemplate(false);
  };

  const startRecording = () => {
    lastTranscriptRef.current = "";
    setPrompt("");
    
    startListening();
    setIsListening(true);
    setIsPaused(false);
    setRecordingTime(0);
    setShowRecordingControls(false);
    setShowDictationTemplate(true);
    setInputMode('recording');
    
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    console.log("🎤 Recording started - ready for dictation");
  };

  // Pause recording handler
  const pauseRecording = () => {
    stopListening();
    setIsPaused(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Resume recording handler
  const resumeRecording = () => {
    lastTranscriptRef.current = transcript;
    startListening();
    setIsPaused(false);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  // Stop recording handler
  const stopRecording = () => {
    stopListening();
    setIsListening(false);
    setIsPaused(false);
    setShowRecordingControls(false);
    setShowDictationTemplate(false);
    setInputMode('ready-to-record');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm', 'audio/ogg'];
    const maxSize = 25 * 1024 * 1024;
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an audio file (MP3, WAV, MP4, WebM, or OGG)",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload an audio file smaller than 25MB",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setSelectedFile(file);
    
    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('reportType', reportType);
      
      const response = await axios.post('/api/transcribe-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
      });
      
      if (response.data.transcript) {
        setPrompt(prev => prev + " " + response.data.transcript);
        toast({
          title: "Upload Successful",
          description: "Audio has been transcribed and added to your report",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to transcribe audio",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const submitRecording = () => {
    stopRecording();
    form.handleSubmit(onSubmit)();
  };

  // Handle field review requests from DictationTemplate buttons
  const handleFieldReview = (fieldName: string, options: string[]) => {
    setReviewModal({
      isOpen: true,
      fieldName: "fieldSelection",
      options: options,
      currentField: fieldName
    });
  };

  // Handle review selection with hierarchical support
  const handleReviewSelect = (selectedOption: string, segment?: string, field?: string) => {
    let newText = selectedOption;
    
    if (segment && field) {
      newText = formatFieldInsertion(segment, field, selectedOption);
    } else if (field) {
      newText = formatFieldInsertion('direct', field, selectedOption);
    }
    
    const updatedPrompt = `${prompt} ${newText}`.trim();
    setPrompt(updatedPrompt);
    
    setReviewModal({ 
      isOpen: false, 
      fieldName: "", 
      options: [],
      currentSegment: undefined,
      currentField: undefined
    });
  };

  // Helper function to format field insertions appropriately
  const formatFieldInsertion = (segment: string, field: string, value: string): string => {
    const formattingRules: { [key: string]: string } = {
      'incidentType': `a ${value} incident`,
      'victimAge': `a ${value}`,
      'victimGender': `${value}`,
      'offenseStatus': `${value}`,
      'arrestStatus': `${value}`,
      'bodyCam': `${value}`,
      'location': `${value}`,
      'race': `${value}`,
      'ethnicity': `${value}`,
      'relationship': `${value}`,
      'injuryType': `${value} injury`,
      'forceUsed': `${value}`,
      'propertyLoss': `${value}`,
      'victimName': `${value}`,
      'suspectAge': `${value}`,
      'statute': `${value}`,
      'offenseDescription': `${value}`,
      'clothing': `${value} clothing`,
      'physicalDescription': `${value}`,
      'offenderCount': `${value} offender(s)`,
      'propertyItems': `${value}`,
      'propertyDescription': `${value}`,
      'propertyValue': `${value}`,
      'arrestType': `${value}`,
      'charges': `${value}`
    };
    
    return formattingRules[field] || value;
  };

  // Handle snippet insertion for writing mode
  const handleInsertSnippet = (snippet: string) => {
    setPrompt(prev => {
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        const newText = prev.substring(0, startPos) + snippet + prev.substring(endPos);
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(startPos + snippet.length, startPos + snippet.length);
        }, 0);
        
        return newText;
      }
      return prev + snippet;
    });
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isListening && transcript) {
      if (transcript !== lastTranscriptRef.current) {
        const newContent = getNewContent(lastTranscriptRef.current, transcript);
        
        if (newContent) {
          setPrompt(prev => {
            const cleanPrev = prev.trim();
            const cleanNew = newContent.trim();
            
            if (!cleanPrev || /[.!?]\s*$/.test(cleanPrev)) {
              return cleanPrev + ' ' + cleanNew;
            } else {
              return cleanPrev + ' ' + cleanNew;
            }
          });
        }
        
        lastTranscriptRef.current = transcript;
      }
    }
  }, [transcript, isListening]);

  // Helper function to extract only new content from transcript
  const getNewContent = (previous: string, current: string): string => {
    if (!previous) return current;
    
    if (current.startsWith(previous)) {
      return current.slice(previous.length).trim();
    }
    
    return current;
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // SIMPLIFIED: Handle correction submission with arrays only
  const handleCorrectionSubmit = async (correctedData: { 
    enhancedPrompt: string; 
    sessionKey?: string;
    newOffenses?: OffenseType[];
  }) => {
    try {
      setIsLoading(true);
      setCorrectionData(null);

      console.log("🔄 SUBMITTING ENHANCED PROMPT WITH SESSION KEY:", correctedData.sessionKey);
      console.log("Enhanced prompt length:", correctedData.enhancedPrompt.length);
      
      if (correctedData.newOffenses) {
        console.log("🔄 OFFENSES CHANGED TO:", correctedData.newOffenses.map(o => o.name).join(', '));
      }

      const requestData: any = {
        prompt: correctedData.enhancedPrompt,
        selectedOffenses: selectedOffenses, // Always send array
        correctedData: true,
        sessionKey: correctedData.sessionKey,
        generateBoth: false
      };

      // Update local state if offenses changed
      if (correctedData.newOffenses) {
        requestData.newOffenses = correctedData.newOffenses;
        setSelectedOffenses(correctedData.newOffenses);
      }

      const response = await axios.post('/api/accident_report', requestData);

      console.log("📨 API Response:", response.data);

      if (response.data.narrative) {
        setNarrativeMessage(response.data.narrative);
        setPrompt("");
        
        toast({
          title: "Success",
          description: "Report generated successfully with all corrections",
          variant: "default",
        });
        
        setWorkflowStep('report-complete');
      } else if (response.data.type === "offense_validation_error" || response.data.type === "offense_type_validation_error") {
        console.log("⚠️ Still missing fields after corrections:", response.data.missingFields);
        setCorrectionData({
          ...response.data,
          originalNarrative: response.data.originalNarrative || correctionData?.originalNarrative
        });

        toast({
          title: "Additional Information Needed",
          description: "Some fields are still missing after your corrections",
          variant: "default",
          duration: 5000,
        });
      } else {
        console.error("❌ Unexpected API response format:", response.data);
        throw new Error("Incomplete response from server");
      }

    } catch (error: any) {
      console.error("❌ Correction error:", error);
      console.error("Error response:", error.response?.data);
      
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to generate report with corrections",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // SIMPLIFIED: Main form submission with arrays only
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      
      if (!prompt.trim()) {
        toast({
          title: "Empty Content",
          description: "Please provide some details",
          variant: "destructive",
        });
        return;
      }

      const dataToSend = {
        ...values,
        prompt: prompt.trim(),
        selectedOffenses: selectedOffenses, // Always send array
        generateBoth: false
      };

      console.log("Submitting for narrative report generation...");
      console.log("Selected offenses:", selectedOffenses.map(o => o.name));

      const response = await axios.post('/api/accident_report', dataToSend, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle validation errors
      if (response.data.type === "offense_validation_error" || response.data.type === "offense_type_validation_error") {
        console.log("🔄 VALIDATION ERROR DETECTED:", response.data.type);
        console.log("Missing fields:", response.data.missingFields);
        
        setCorrectionData({
          type: response.data.type,
          error: response.data.error,
          missingFields: response.data.missingFields || [],
          suggestions: response.data.suggestions || [],
          warnings: response.data.warnings || [],
          nibrsData: response.data.nibrsData || {},
          isComplete: response.data.isComplete,
          confidenceScore: response.data.confidenceScore,
          source: response.data.source,
          errorCategory: response.data.errorCategory,
          severity: response.data.severity,
          guidance: response.data.guidance,
          categorizedFields: response.data.categorizedFields,
          offenses: response.data.offenses,
          fieldExamples: response.data.fieldExamples,
          validationDetails: response.data.validationDetails,
          sessionKey: response.data.sessionKey,
          originalNarrative: response.data.originalNarrative,
          offenseValidation: response.data.offenseValidation,
          multiOffenseValidation: response.data.multiOffenseValidation
        });

        let toastMessage = "Please provide the missing information";
        if (response.data.type === "offense_type_validation_error") {
          toastMessage = "Review offense classification and provide missing information";
        }

        toast({
          title: response.data.type === "offense_type_validation_error" ? "Offense Classification Review" : "Offense Requirements",
          description: toastMessage,
          variant: "default",
          duration: 5000,
        });
        return;
      }

      // Handle narrative report success
      if (response.data.narrative) {
        setNarrativeMessage(response.data.narrative);
        setPrompt("");
        form.reset();
        setSelectedOffenses([]);
        setInputMode('ready-to-record');
        setShowDictationTemplate(false);
        setShowRecordingControls(false);
        setWorkflowStep('report-complete');

        toast({
          title: "Success!",
          description: "Narrative report generated successfully",
          variant: "default",
        });
      } else {
        throw new Error("Unexpected API response format");
      }

    } catch (error: any) {
      console.error("Submission error:", error);
      
      if (error.response?.status === 400 && error.response.data) {
        const {
          error: apiError,
          nibrs: nibrsData,
          mappingConfidence,
          correctionContext,
          warnings,
          missingFields,
          requiredLevel,
          suggestions
        } = error.response.data;

        setCorrectionData({
          error: apiError,
          nibrsData: nibrsData || {},
          confidence: mappingConfidence || {},
          correctionContext: correctionContext || {},
          warnings: warnings || [],
          missingFields: missingFields || [],
          requiredLevel: requiredLevel || "",
          suggestions: suggestions || [],
          source: "offense",
          errorCategory: "OFFENSE_REQUIREMENTS",
          severity: "REQUIRED",
          guidance: "These fields are required for the selected offense type."
        });

        toast({
          title: "Correction Needed",
          description: "Please review the report details",
          variant: "default",
          duration: 5000,
        });
      } else {
        toast({
          title: "Submission Error",
          description: error.response?.data?.message || error.message || "Failed to submit report",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we have narrative report
  const hasNarrativeReport = narrativeMessage;

  // Helper to get display name for offenses
  const getOffenseDisplayName = () => {
    if (selectedOffenses.length === 0) return 'No offense selected';
    if (selectedOffenses.length === 1) return selectedOffenses[0].name;
    return `${selectedOffenses.length} offenses`;
  };

  // Helper to get combined required fields count
  const getCombinedRequiredFieldsCount = () => {
    if (selectedOffenses.length === 0) return 0;
    const allFields = new Set<string>();
    selectedOffenses.forEach(offense => {
      offense.requiredFields.forEach(field => allFields.add(field));
    });
    return Array.from(allFields).length;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50">
      {/* Help Modal */}
      <HelpModal 
        showHelpModal={showHelpModal}
        setShowHelpModal={setShowHelpModal}
        reportName={reportName}
        helpContent={helpContent}
      />
      
      {/* Unified Correction Modal */}
      {correctionData && (
        <CorrectionUI
          correctionData={correctionData}
          onCorrect={handleCorrectionSubmit}
          onCancel={() => setCorrectionData(null)}
          currentInput={prompt}
          offenses={selectedOffenses}
        />
      )}
      
      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        fieldName={reviewModal.fieldName}
        options={reviewModal.options}
        currentSegment={reviewModal.currentSegment}
        currentField={reviewModal.currentField}
        onSelect={handleReviewSelect}
        onClose={() => setReviewModal({ isOpen: false, fieldName: "", options: [] })}
      />
      
      {/* Header Section - SIMPLIFIED */}
      <Header
        router={router}
        reportIcon={reportIcon}
        reportName={reportName}
        reportType={reportType}
        setShowHelpModal={setShowHelpModal}
        showBackButton={workflowStep !== 'offense-selection'}
        onBack={handleBack}
        currentStep={workflowStep}
        selectedOffenses={selectedOffenses}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {workflowStep === 'offense-selection' && (
          <MultiOffenseSelector
            onOffensesSelect={handleOffensesSelect}
            onBack={handleBack}
            initialSelectedOffenses={selectedOffenses}
          />
        )}

        {workflowStep === 'report-creation' && (
          <>
            {/* Show selected offenses info */}
            {selectedOffenses.length > 0 && !isLoading &&  (
              <div className="max-w-6xl mx-auto mb-6">
                <div className="bg-white border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getOffenseDisplayName()}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedOffenses.length === 1 ? 
                          `${selectedOffenses[0].description} • NIBRS: ${selectedOffenses[0].nibrsCode}` :
                          `Multiple offenses: ${selectedOffenses.map(o => o.name).join(', ')}`
                        }
                      </p>
                      {selectedOffenses.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedOffenses.map(offense => (
                            <span key={offense.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {offense.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        Required Fields:
                      </div>
                      <div className="text-sm font-medium text-blue-600">
                        {getCombinedRequiredFieldsCount()} fields
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Existing report creation UI */}
            {inputMode === 'typing' && !hasNarrativeReport && !isLoading && (
              <WritingTemplate
                isVisible={true}
                onInsertSnippet={handleInsertSnippet}
                onFieldHelp={handleFieldReview}
                offenseTypes={selectedOffenses}
              />
            )}

            {/* Show DictationTemplate only when actively recording */}
            {inputMode === 'recording' && (
              <DictationTemplate
                isVisible={showDictationTemplate}
                onFieldReview={handleFieldReview}
                completedSections={completedSections}
                fieldOptions={fieldOptions}
                isRecording={isListening && !isPaused}
                isPaused={isPaused}
                recordingTime={recordingTime}
                formatTime={formatTime}
                onPauseRecording={pauseRecording}
                onResumeRecording={resumeRecording}
                onSubmitRecording={submitRecording}
                onStopRecording={stopRecording}
                offenseTypes={selectedOffenses}
              />
            )}

            {isLoading ? (
              <div className="max-w-4xl mx-auto h-64 flex flex-col items-center justify-center rounded-lg">
                <Loader />
                <p className="mt-4 text-sm text-gray-500 text-center max-w-md">
                  Generating {getOffenseDisplayName()} Report...<br />
                  Creating professional police narrative report.<br />
                  This may take a few seconds. Please don't close the tab.
                </p>
              </div>
            ) : hasNarrativeReport ? (
              <div className="max-w-6xl mx-auto">
                <ReportOutput
                  message={narrativeMessage}
                  reportType={reportType}
                  offenseTypes={selectedOffenses}
                />
              </div>
            ) : null}
          </>
        )}

        {workflowStep === 'report-complete' && hasNarrativeReport && (
          <div className="max-w-6xl mx-auto">
            <ReportOutput
              message={narrativeMessage}
              reportType={reportType}
              offenseTypes={selectedOffenses}
            />
          </div>
        )}
      </div>

      {/* Input Section with Recording Controls - Only show in report creation step */}
      {workflowStep === 'report-creation' && !hasNarrativeReport && !isLoading && (
        <div className="bg-white px-4 py-3 border-t relative">
          {/* Show RecordingControls when in 'ready-to-record' mode */}
          {inputMode === 'ready-to-record' && (
            <RecordingControls
              showRecordingControls={showRecordingControls}
              isPaused={isPaused}
              recordingTime={recordingTime}
              formatTime={formatTime}
              resumeRecording={resumeRecording}
              pauseRecording={pauseRecording}
              submitRecording={submitRecording}
              startRecording={startRecording}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              handleFileSelect={handleFileSelect}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
            />
          )}

          <PromptInput
            form={form}
            onSubmit={onSubmit}
            prompt={prompt}
            setPrompt={setPrompt}
            isLoading={isLoading}
            defaultTip={defaultTip}
            recordingTip={recordingTip}
            showRecordingControls={showRecordingControls}
            textareaRef={textareaRef}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            handleFileSelect={handleFileSelect}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            inputMode={inputMode}
            onSwitchMode={(mode) => {
              if (mode === 'recording') {
                prepareRecording();
              } else {
                setInputMode('typing');
                setShowRecordingControls(false);
              }
            }}
            onWritingStart={() => {
              setInputMode('typing');
              setShowRecordingControls(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default BaseReport;