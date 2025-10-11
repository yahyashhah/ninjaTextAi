// components/reports/BaseReport.tsx - FIXED VERSION
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
import ReviewModal from "./ReviewModal";
import { OffenseType, GROUP_A_OFFENSES } from "@/constants/offences";
import CorrectionUI from "./CorrectionUI";
import { ChevronDown, Search, X } from "lucide-react";

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

// SIMPLIFIED: Single page workflow
type WorkflowStep = 'input' | 'report-complete';

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
  
  // SIMPLIFIED: Single page approach
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('input');
  const [selectedOffenses, setSelectedOffenses] = useState<OffenseType[]>([]);
  const [showOffenseDropdown, setShowOffenseDropdown] = useState(false);
  const [offenseSearch, setOffenseSearch] = useState("");
  
  // Existing states
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
  const [inputMode, setInputMode] = useState<'typing' | 'recording' | 'ready-to-record'>('ready-to-record');

  const timerRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTranscriptRef = useRef("");
  const offenseDropdownRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  // Filter offenses based on search
  const filteredOffenses = GROUP_A_OFFENSES.filter(offense => {
    const matchesSearch = offense.name.toLowerCase().includes(offenseSearch.toLowerCase()) ||
                         offense.code.includes(offenseSearch);
    return matchesSearch;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (offenseDropdownRef.current && !offenseDropdownRef.current.contains(event.target as Node)) {
        setShowOffenseDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle offense selection
  const handleOffenseSelect = (offense: OffenseType) => {
    const isSelected = selectedOffenses.find(o => o.id === offense.id);
    
    if (isSelected) {
      setSelectedOffenses(prev => prev.filter(o => o.id !== offense.id));
    } else {
      setSelectedOffenses(prev => [...prev, offense]);
    }
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
  };

  const startRecording = () => {
    lastTranscriptRef.current = "";
    setPrompt("");
    
    startListening();
    setIsListening(true);
    setIsPaused(false);
    setRecordingTime(0);
    setShowRecordingControls(false);
    setInputMode('recording');
    prepareRecording();
    
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

  // SIMPLIFIED: Handle correction submission
  const handleCorrectionSubmit = async (correctedData: { 
    enhancedPrompt: string; 
    sessionKey?: string;
    newOffenses?: OffenseType[];
  }) => {
    try {
      setIsLoading(true);
      setCorrectionData(null);

      const requestData: any = {
        prompt: correctedData.enhancedPrompt,
        selectedOffenses: selectedOffenses,
        correctedData: true,
        sessionKey: correctedData.sessionKey,
        generateBoth: false
      };

      if (correctedData.newOffenses) {
        requestData.newOffenses = correctedData.newOffenses;
        setSelectedOffenses(correctedData.newOffenses);
      }

      const response = await axios.post('/api/accident_report', requestData);

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
        throw new Error("Incomplete response from server");
      }

    } catch (error: any) {
      console.error("❌ Correction error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to generate report with corrections",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // SIMPLIFIED: Main form submission
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

      if (selectedOffenses.length === 0) {
        toast({
          title: "No Offense Selected",
          description: "Please select at least one offense type",
          variant: "destructive",
        });
        return;
      }

      const dataToSend = {
        ...values,
        prompt: prompt.trim(),
        selectedOffenses: selectedOffenses,
        generateBoth: false
      };

      const response = await axios.post('/api/accident_report', dataToSend, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle validation errors
      if (response.data.type === "offense_validation_error" || response.data.type === "offense_type_validation_error") {
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
        setInputMode('ready-to-record');
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

  // Helper to get display name for offenses
  const getOffenseDisplayName = () => {
    if (selectedOffenses.length === 0) return 'Select offense type';
    if (selectedOffenses.length === 1) return selectedOffenses[0].name;
    return `${selectedOffenses.length} offenses selected`;
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
      
      {/* Header Section - SIMPLIFIED */}
      <Header
        router={router}
        reportIcon={reportIcon}
        reportName={reportName}
        reportType={reportType}
        setShowHelpModal={setShowHelpModal}
        showBackButton={false}
        onBack={() => {}}
        currentStep={workflowStep}
        selectedOffenses={selectedOffenses}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {workflowStep === 'input' && !isLoading && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Offense Selector - SIMPLIFIED DROPDOWN */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Offense Type</h3>
                {selectedOffenses.length > 0 && (
                  <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {selectedOffenses.length} selected
                  </span>
                )}
              </div>
              
              <div className="relative" ref={offenseDropdownRef}>
                <button
                  onClick={() => setShowOffenseDropdown(!showOffenseDropdown)}
                  className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className={selectedOffenses.length === 0 ? "text-gray-500" : "text-gray-900"}>
                    {getOffenseDisplayName()}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showOffenseDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showOffenseDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {/* Search */}
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search offenses..."
                          value={offenseSearch}
                          onChange={(e) => setOffenseSearch(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Offense List */}
                    <div className="p-2">
                      {filteredOffenses.map(offense => {
                        const isSelected = selectedOffenses.find(o => o.id === offense.id);
                        return (
                          <div
                            key={offense.id}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => handleOffenseSelect(offense)}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${
                              isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <span className="text-white text-xs">✓</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{offense.name}</span>
                                <code className="text-xs bg-gray-100 px-1 rounded text-gray-600">{offense.code}</code>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{offense.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Offenses Chips */}
              {selectedOffenses.length > 0 && !isLoading && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedOffenses.map(offense => (
                    <div key={offense.id} className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm">
                      {offense.name}
                      <button
                        onClick={() => handleOffenseSelect(offense)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Output or Loading */}
            {isLoading ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <Loader />
                <p className="mt-4 text-sm text-gray-500 text-center max-w-md">
                  Generating {getOffenseDisplayName()} Report...<br />
                  Creating professional police narrative report.<br />
                  This may take a few seconds. Please don't close the tab.
                </p>
              </div>
            ) : narrativeMessage ? (
              <ReportOutput
                message={narrativeMessage}
                reportType={reportType}
                offenseTypes={selectedOffenses}
              />
            ) : (
              /* Quick Tips */
              <div>
                
              </div>
            )}
      </div>

      {/* Input Section - Always visible in input step */}
      {workflowStep === 'input' && !narrativeMessage && !isLoading && (
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
            selectedOffenses={selectedOffenses}
          />
        </div>
      )}
    </div>
  );
};

export default BaseReport;