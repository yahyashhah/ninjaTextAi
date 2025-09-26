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
import ReviewModal from "./ReviewModal";

export type Template = {
  id: string;
  templateName: string;
  instructions: string;
  reportTypes: string[];
  createdAt: string;
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
  nibrsData: any;
  suggestions?: string[];
  confidence?: any;
  correctionContext?: any;
  warnings?: string[];
  missingFields?: string[];
  requiredLevel?: string;
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
  const [message, setMessage] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showRecordingControls, setShowRecordingControls] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nibrs, setNibrs] = useState<any | null>(null);
  const [xmlData, setXmlData] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [correctionData, setCorrectionData] = useState<CorrectionData | null>(null);
  
  // New states for dictation template
  const [showDictationTemplate, setShowDictationTemplate] = useState(false);
  const [reviewModal, setReviewModal] = useState<{isOpen: boolean; fieldName: string; options: string[]}>({
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

  // Complete field options for when officer says "review"
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

  // Improved function to identify current field being dictated
  // Replace the identifyCurrentField function in BaseReport with this:
const identifyCurrentField = (currentText: string, transcriptWithReview: string) => {
  if (!currentText || currentText.length < 5) return null;
  
  console.log('Identifying field for text:', currentText);
  console.log('Full transcript:', transcriptWithReview);
  
  const text = currentText.toLowerCase();
  const fullText = transcriptWithReview.toLowerCase();
  
  // Extract the last sentence or phrase before "review"
  const sentences = fullText.split(/[.!?]+/);
  const lastSentence = sentences[sentences.length - 2] || sentences[sentences.length - 1] || ''; // Sentence before review
  const words = lastSentence.trim().split(/\s+/);
  
  console.log('Last sentence before review:', lastSentence);
  console.log('Words in last sentence:', words);
  
  // Field detection with context patterns - ordered by specificity
  const fieldPatterns = [
    // High specificity patterns (exact phrases)
    {
      field: "incidentType",
      patterns: [
        { trigger: "in reference to", context: 5 },
        { trigger: "type of incident", context: 3 },
        { trigger: "regarding", context: 3 }
      ],
      test: (sentence: string) => sentence.includes("reference to") || sentence.includes("type of incident")
    },
    {
      field: "victimGender",
      patterns: [
        { trigger: "year-old", context: 2 },
        { trigger: "male", context: 1 },
        { trigger: "female", context: 1 }
      ],
      test: (sentence: string) => sentence.includes("year-old") || sentence.includes("male") || sentence.includes("female")
    },
    {
      field: "race",
      patterns: [
        { trigger: "race is", context: 2 },
        { trigger: "race", context: 3 }
      ],
      test: (sentence: string) => sentence.includes("race")
    },
    {
      field: "ethnicity",
      patterns: [
        { trigger: "ethnicity", context: 3 }
      ],
      test: (sentence: string) => sentence.includes("ethnicity")
    },
    {
      field: "relationship",
      patterns: [
        { trigger: "relationship", context: 5 },
        { trigger: "between victim", context: 3 }
      ],
      test: (sentence: string) => sentence.includes("relationship") || sentence.includes("victim and offender")
    },
    {
      field: "offenseStatus",
      patterns: [
        { trigger: "offense was", context: 2 },
        { trigger: "attempted", context: 1 },
        { trigger: "completed", context: 1 }
      ],
      test: (sentence: string) => sentence.includes("offense was") || sentence.includes("attempted") || sentence.includes("completed")
    },
    {
      field: "injuryType",
      patterns: [
        { trigger: "sustained", context: 3 },
        { trigger: "injury", context: 2 }
      ],
      test: (sentence: string) => sentence.includes("sustained") || sentence.includes("injury")
    },
    {
      field: "forceUsed",
      patterns: [
        { trigger: "used", context: 3 },
        { trigger: "weapon", context: 2 },
        { trigger: "force", context: 2 }
      ],
      test: (sentence: string) => sentence.includes("used") || sentence.includes("weapon") || sentence.includes("force")
    },
    {
      field: "propertyLoss",
      patterns: [
        { trigger: "loss type", context: 3 },
        { trigger: "stolen", context: 1 },
        { trigger: "damaged", context: 1 }
      ],
      test: (sentence: string) => sentence.includes("loss type") || sentence.includes("stolen") || sentence.includes("damaged")
    },
    {
      field: "arrestStatus",
      patterns: [
        { trigger: "arrested", context: 2 },
        { trigger: "not arrested", context: 2 }
      ],
      test: (sentence: string) => sentence.includes("arrested")
    },
    {
      field: "bodyCam",
      patterns: [
        { trigger: "body cam", context: 3 },
        { trigger: "camera", context: 2 }
      ],
      test: (sentence: string) => sentence.includes("body cam") || sentence.includes("camera")
    },
    
    // Medium specificity - field mentions
    {
      field: "location",
      patterns: [
        { trigger: "dispatched to", context: 4 },
        { trigger: "arrived at", context: 3 }
      ],
      test: (sentence: string) => sentence.includes("dispatched") || sentence.includes("arrived")
    },
    {
      field: "victimName",
      patterns: [
        { trigger: "contact with", context: 3 },
        { trigger: "victim name", context: 2 }
      ],
      test: (sentence: string) => sentence.includes("contact with") || sentence.includes("victim name")
    },
    {
      field: "victimAge",
      patterns: [
        { trigger: "year-old", context: 2 },
        { trigger: "age", context: 3 }
      ],
      test: (sentence: string) => sentence.includes("year-old") || sentence.includes("age")
    }
  ];

  // First, try to match based on the last sentence context
  for (const fieldData of fieldPatterns) {
    if (fieldData.test(lastSentence)) {
      console.log('Matched field by sentence context:', fieldData.field);
      return {
        field: fieldData.field,
        options: fieldOptions[fieldData.field as keyof typeof fieldOptions] || ["Unknown", "Not specified"]
      };
    }
  }

  // If no sentence context match, try word-based matching
  for (const fieldData of fieldPatterns) {
    for (const pattern of fieldData.patterns) {
      if (lastSentence.includes(pattern.trigger)) {
        console.log('Matched field by word pattern:', fieldData.field, 'with trigger:', pattern.trigger);
        return {
          field: fieldData.field,
          options: fieldOptions[fieldData.field as keyof typeof fieldOptions] || ["Unknown", "Not specified"]
        };
      }
    }
  }

  // Final fallback - check for keywords in recent words
  const recentWords = words.slice(-5); // Last 5 words of the sentence
  const keywordMap: { [key: string]: string } = {
    'male': 'victimGender', 'female': 'victimGender',
    'attempted': 'offenseStatus', 'completed': 'offenseStatus',
    'stolen': 'propertyLoss', 'damaged': 'propertyLoss', 'recovered': 'propertyLoss',
    'arrested': 'arrestStatus', 'weapon': 'forceUsed', 'injury': 'injuryType',
    'race': 'race', 'ethnicity': 'ethnicity', 'relationship': 'relationship',
    'camera': 'bodyCam', 'dispatched': 'location', 'arrived': 'location'
  };

  for (const word of recentWords) {
    if (keywordMap[word]) {
      console.log('Matched field by keyword:', keywordMap[word], 'from word:', word);
      return {
        field: keywordMap[word],
        options: fieldOptions[keywordMap[word] as keyof typeof fieldOptions] || ["Unknown", "Not specified"]
      };
    }
  }

  console.log('No field detected for text:', lastSentence);
  return null;
};

  // Start recording handler
  const startRecording = () => {
  lastTranscriptRef.current = "";
  startListening();
  setIsListening(true);
  setIsPaused(false);
  setRecordingTime(0);
  setShowRecordingControls(false); // Hide the start button
  setShowDictationTemplate(true); // Show template with integrated controls
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
  // In BaseReport, update the stopRecording function:
const stopRecording = () => {
  stopListening();
  setIsListening(false);
  setIsPaused(false);
  setShowRecordingControls(false);
  setShowDictationTemplate(false); // Hide template when stopped
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

  // Handle field review requests
  const handleFieldReview = (fieldName: string, options: string[]) => {
    setReviewModal({
      isOpen: true,
      fieldName,
      options: Array.isArray(options) ? options : ["Unknown", "Not specified"]
    });
  };

  // Handle review selection
  const handleReviewSelect = (selectedOption: string) => {
    const newText = `${prompt} ${selectedOption}`;
    setPrompt(newText);
    setReviewModal({ isOpen: false, fieldName: "", options: [] });
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Replace the transcript useEffect in BaseReport with this:
useEffect(() => {
  if (isListening && transcript) {
    const currentText = transcript.toLowerCase();
    const lastText = lastTranscriptRef.current.toLowerCase();
    
    // Improved "review" detection - check if "review" was just spoken
    if (currentText.includes(' review') && !lastText.includes(' review')) {
      console.log('=== REVIEW DETECTED ===');
      console.log('Current transcript:', transcript);
      console.log('Previous transcript:', lastTranscriptRef.current);
      
      // Use a timeout to ensure the speech is fully processed
      setTimeout(() => {
        // Get the text that was spoken before "review"
        const textBeforeReview = transcript.replace(/\s*review.*$/i, '').trim();
        console.log('Text before review:', textBeforeReview);
        
        if (textBeforeReview) {
          const currentField = identifyCurrentField(textBeforeReview, transcript);
          
          if (currentField) {
            console.log('🎯 Detected field for review:', currentField.field);
            console.log('📋 Available options:', currentField.options);
            
            handleFieldReview(currentField.field, currentField.options);
            
            // Clean the transcript by removing "review" to avoid duplication
            const cleanTranscript = transcript.replace(/\s*review\b\s*/gi, ' ').trim();
            if (cleanTranscript !== transcript) {
              setPrompt(prev => {
                const newPrompt = prev + ' ' + cleanTranscript;
                console.log('Updated prompt:', newPrompt);
                return newPrompt;
              });
              lastTranscriptRef.current = cleanTranscript;
              return;
            }
          } else {
            console.log('❌ No specific field detected for review');
            // Show generic options if no specific field detected
            handleFieldReview('general', fieldOptions.general);
          }
        } else {
          console.log('⚠️ No text before review found');
          handleFieldReview('general', fieldOptions.general);
        }
      }, 300); // Slightly longer delay for better detection
    }
    
    // Normal transcript processing
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
          reportTypes: [reportType],
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

      const response = await axios.post(apiEndpoint, {
        prompt: prompt.trim(),
        selectedTemplate: selectedTemplate || undefined,
        correctedData
      });

      setMessage(response.data.narrative);
      setNibrs(response.data.nibrs);
      setXmlData(response.data.xml);

      toast({
        title: "Success",
        description: "Report generated with corrected data",
        variant: "default",
      });

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

  // Main form submission
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
      };

      const response = await axios.post(apiEndpoint, dataToSend, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.data?.narrative || !response.data?.nibrs || !response.data?.xml) {
        throw new Error("Unexpected API response format");
      }

      setMessage(response.data.narrative);
      setNibrs(response.data.nibrs);
      setXmlData(response.data.xml);
      setPrompt("");
      form.reset();
      setSelectedTemplate(null);

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
          suggestions: suggestions || []
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

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50">
      {/* Help Modal */}
      <HelpModal 
        showHelpModal={showHelpModal}
        setShowHelpModal={setShowHelpModal}
        reportName={reportName}
        helpContent={helpContent}
      />
      
      {/* Correction Modal */}
      {correctionData && (
        <CorrectionUI
          error={correctionData.error}
          missingFields={correctionData.missingFields || []}
          requiredLevel={correctionData.requiredLevel || ""}
          suggestions={correctionData.suggestions || []}
          warnings={correctionData.warnings || []}
          nibrsData={correctionData.nibrsData}
          confidence={correctionData.confidence}
          correctionContext={correctionData.correctionContext}
          onCorrect={handleCorrectionSubmit}
          onCancel={() => setCorrectionData(null)}
        />
      )}
      
      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        fieldName={reviewModal.fieldName}
        options={reviewModal.options}
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
        {/* Dictation Template */}
        <DictationTemplate
  isVisible={showDictationTemplate}
  onFieldReview={handleFieldReview}
  completedSections={completedSections}
  fieldOptions={fieldOptions}
  // New recording control props
  isRecording={isListening && !isPaused}
  isPaused={isPaused}
  recordingTime={recordingTime}
  formatTime={formatTime}
  onPauseRecording={pauseRecording}
  onResumeRecording={resumeRecording}
  onSubmitRecording={submitRecording}
  onStopRecording={stopRecording} // Add this new prop
/>

        {isLoading ? (
          <div className="max-w-4xl mx-auto h-64 flex flex-col items-center justify-center rounded-lg">
            <Loader />
            <p className="mt-4 text-sm text-gray-500 text-center max-w-md">
              Generating Your Report...<br />
              This may take a few seconds. Please don't close the tab.
            </p>
          </div>
        ) : message ? (
          <div className="max-w-4xl mx-auto">
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
            
            {nibrs && (
              <NibrsSummary 
                nibrs={nibrs}
                xmlData={xmlData}
              />
            )}
            
            <ReportOutput
              message={message}
              reportType={reportType}
            />
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
        {!showDictationTemplate && !message && !isLoading && (
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

        {!message && !isLoading && (
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
          />
        )}
      </div>
    </div>
  );
};

export default BaseReport;