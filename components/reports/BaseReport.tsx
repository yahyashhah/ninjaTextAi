// components/reports/BaseReport.tsx
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
import TemplateSelectionUI from "./TemplateSelectorUI";
import HelpModal from "./HelpModal";
import Header from "./Header";
import TemplateSelector from "./TemplateSelector";
import NibrsSummary from "./NibrsSummary";
import ReportOutput from "./ReportOutput";
import RecordingControls from "./RecordingControls";
import PromptInput from "./PromptInput";
import CorrectionUI from "./CorrectionUI";
import DictationTemplate from "./DictationTemplate";
import WritingTemplate from "./WritingTemplate";
import ReviewModal from "./ReviewModal";

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
  suggestions: string[]; // Changed from optional to required array
  warnings: string[];
  nibrsData: any;
  confidence?: any;
  correctionContext?: any;
  type?: string;
  isComplete?: boolean;
  confidenceScore?: number;
  source?: "nibrs" | "template";
  errorCategory?: string;
  severity?: "REQUIRED" | "WARNING" | "OPTIONAL";
  guidance?: string;
  categorizedFields?: any;
  templateName?: string;
}

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
  const [prompt, setPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Separate states for both reports
  const [narrativeMessage, setNarrativeMessage] = useState("");
  const [nibrsData, setNibrsData] = useState<any | null>(null);
  const [xmlData, setXmlData] = useState<string | null>(null);
  const [accuracyScore, setAccuracyScore] = useState<number | null>(null);
  
  const [showTemplates, setShowTemplates] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showRecordingControls, setShowRecordingControls] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [correctionData, setCorrectionData] = useState<CorrectionData | null>(null);
  
  // Active tab for viewing results
  const [activeReportTab, setActiveReportTab] = useState<'narrative' | 'nibrs'>('narrative');
  
  // States for templates and modes
  const [showDictationTemplate, setShowDictationTemplate] = useState(false);
  const [inputMode, setInputMode] = useState<'typing' | 'recording' | 'ready-to-record'>('typing');
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTranscriptRef = useRef("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

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

  // Actually start recording when user clicks "Start Recording"
  const startRecording = () => {
    lastTranscriptRef.current = "";
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
    setInputMode('typing');
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

  // Simplified review detection
  useEffect(() => {
    if (isListening && transcript) {
      const currentText = transcript.toLowerCase();
      const lastText = lastTranscriptRef.current.toLowerCase();
      
      if (currentText.includes(' review') && !lastText.includes(' review')) {
        console.log('=== REVIEW DETECTED ===');
        
        setReviewModal({
          isOpen: true,
          fieldName: "segmentSelection",
          options: []
        });
        
        const cleanTranscript = transcript.replace(/\s*review\b\s*/gi, ' ').trim();
        if (cleanTranscript !== transcript) {
          setPrompt(prev => prev + ' ' + cleanTranscript);
          lastTranscriptRef.current = cleanTranscript;
          return;
        }
      }
      
      if (transcript !== lastTranscriptRef.current) {
        if (lastTranscriptRef.current && transcript.startsWith(lastTranscriptRef.current)) {
          const newContent = transcript.slice(lastTranscriptRef.current.length);
          setPrompt(prev => prev + newContent);
        } else {
          setPrompt(transcript);
        }
        lastTranscriptRef.current = transcript;
      }
    }
  }, [transcript, isListening]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.post('/api/filter_template', {
          reportTypes: ['accident report', 'accident_report'],
        });
        
        const sortedTemplates = response.data.templates.sort((a: Template, b: Template) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setTemplates(sortedTemplates);
        setFilteredTemplates(sortedTemplates);
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast({
          title: "Error",
          description: "Failed to load templates",
          variant: "destructive",
        });
      }
    };
    fetchTemplates();
  }, [reportType, toast]);

  // Filter templates based on search term
  useEffect(() => {
    const filtered = templates.filter(template =>
      template.templateName.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setFilteredTemplates(filtered);
  }, [searchTerm, templates]);

  // Handle correction submission
  const handleCorrectionSubmit = async (correctedData: any) => {
    try {
      setIsLoading(true);
      setCorrectionData(null);

      const response = await axios.post('/api/accident_report', {
        prompt: prompt.trim(),
        selectedTemplate: selectedTemplate || undefined,
        correctedData,
        generateBoth: true
      });

      // Handle dual report response
      if (response.data.narrative && response.data.nibrs) {
        setNarrativeMessage(response.data.narrative);
        setNibrsData(response.data.nibrs);
        setXmlData(response.data.xml || null);
        setAccuracyScore(response.data.accuracyScore || null);
        
        toast({
          title: "Success",
          description: "Both reports generated successfully with corrected data",
          variant: "default",
        });
      } else {
        throw new Error("Incomplete response from server");
      }

    } catch (error: any) {
      console.error("Correction error:", error);
      toast({
        title: "Error",
        description: "Failed to submit corrected data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding missing information from validation
  const handleAddMissingInfo = (field: string) => {
    const fieldPrompt = `Please provide information about ${field}: `;
    setPrompt(prev => prev + " " + fieldPrompt);
    setCorrectionData(null);
    
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Main form submission - GENERATES BOTH REPORTS
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
        selectedTemplate: selectedTemplate || undefined,
        generateBoth: true
      };

      console.log("Submitting for dual report generation...");

      const response = await axios.post('/api/accident_report', dataToSend, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle BOTH types of validation errors
      if (response.data.type === "validation_error" || response.data.type === "nibrs_validation_error") {
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
          templateName: response.data.templateName
        });

        const errorTitle = response.data.type === "validation_error" 
          ? "Template Requirements" 
          : "NIBRS Standards";
          
        toast({
          title: errorTitle,
          description: "Please provide the missing information",
          variant: "default",
          duration: 5000,
        });
        return;
      }

      // Handle dual report success
      if (response.data.narrative && response.data.nibrs) {
        setNarrativeMessage(response.data.narrative);
        setNibrsData(response.data.nibrs);
        setXmlData(response.data.xml || null);
        setAccuracyScore(response.data.accuracyScore || null);
        setPrompt("");
        form.reset();
        setSelectedTemplate(null);
        setInputMode('typing');
        setShowDictationTemplate(false);
        setShowRecordingControls(false);

        toast({
          title: "Success!",
          description: "Both narrative and NIBRS reports generated successfully",
          variant: "default",
        });
      } else {
        throw new Error("Unexpected API response format");
      }

    } catch (error: any) {
      console.error("Submission error:", error);
      
      if (error.response?.status === 400 && error.response.data) {
        // Handle NIBRS-specific validation errors from older format
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
          source: "nibrs",
          errorCategory: "NIBRS_STANDARDS",
          severity: "REQUIRED",
          guidance: "These fields are required by federal crime reporting standards (NIBRS)."
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

  // Check if we have both reports
  const hasBothReports = narrativeMessage && nibrsData;

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
          onAddMissingInfo={correctionData.type === "validation_error" ? handleAddMissingInfo : undefined}
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
      
      {/* Header Section */}
      <Header
        router={router}
        reportIcon={reportIcon}
        reportName={reportName}
        reportType={reportType}
        setShowHelpModal={setShowHelpModal}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {inputMode === 'typing' && !hasBothReports && !isLoading && (
          <WritingTemplate
            isVisible={true}
            onInsertSnippet={handleInsertSnippet}
            onFieldHelp={handleFieldReview}
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
          />
        )}

        {isLoading ? (
          <div className="max-w-4xl mx-auto h-64 flex flex-col items-center justify-center rounded-lg">
            <Loader />
            <p className="mt-4 text-sm text-gray-500 text-center max-w-md">
              Generating Both Reports...<br />
              Creating narrative report and NIBRS report simultaneously.<br />
              This may take a few seconds. Please don't close the tab.
            </p>
          </div>
        ) : hasBothReports ? (
          <div className="max-w-6xl mx-auto">
            {/* Report Type Tabs */}
            <div className="mb-6 bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex border-b border-gray-200">
                <button
                  className={`px-4 py-2 font-medium transition-colors duration-200 ${
                    activeReportTab === 'narrative'
                      ? 'border-b-2 border-blue-600 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveReportTab('narrative')}
                >
                  Narrative Report
                </button>
                <button
                  className={`px-4 py-2 font-medium transition-colors duration-200 ${
                    activeReportTab === 'nibrs'
                      ? 'border-b-2 border-green-600 text-green-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveReportTab('nibrs')}
                >
                  NIBRS Report
                </button>
              </div>
            </div>

            {/* Narrative Report Tab */}
            {activeReportTab === 'narrative' && (
              <div className="space-y-6">
                {selectedTemplate && (
                  <TemplateSelector
                    selectedTemplate={selectedTemplate}
                    setSelectedTemplate={setSelectedTemplate}
                    filteredTemplates={filteredTemplates}
                    router={router}
                    setSearchTerm={setSearchTerm}
                    setShowTemplates={setShowTemplates}
                  />
                )}
                
                <ReportOutput
                  message={narrativeMessage}
                  reportType={reportType}
                />
              </div>
            )}

            {/* NIBRS Report Tab */}
            {activeReportTab === 'nibrs' && (
              <div className="space-y-6">
                <NibrsSummary 
                  nibrs={nibrsData}
                  xmlData={xmlData}
                />
                
                {/* Also show the narrative in NIBRS tab for context */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 mb-2">Associated Narrative</h3>
                  <div className="bg-white p-4 rounded border">
                    <p className="text-sm whitespace-pre-wrap">{narrativeMessage}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : !selectedTemplate ? (
          <TemplateSelectionUI
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showTemplates={showTemplates}
            setShowTemplates={setShowTemplates}
            filteredTemplates={filteredTemplates}
            setSelectedTemplate={setSelectedTemplate}
            router={router}
            searchInputRef={searchInputRef}
          />
        ) : (
          <div className="max-w-4xl mx-auto">
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              filteredTemplates={filteredTemplates}
              router={router}
              setSearchTerm={setSearchTerm}
              setShowTemplates={setShowTemplates}
            />
          </div>
        )}
      </div>

      {/* Input Section with Recording Controls */}
      <div className="bg-white px-4 py-3 border-t relative">
        {/* Show RecordingControls when in 'ready-to-record' mode */}
        {inputMode === 'ready-to-record' && !hasBothReports && !isLoading && (
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

        {!hasBothReports && !isLoading && (
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
        )}
      </div>
    </div>
  );
};

export default BaseReport;