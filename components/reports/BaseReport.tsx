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
  errors: string[];
  nibrsData: any;
  suggestions?: any;
  confidence?: any;
  correctionContext?: any;
  warnings?: string[];
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
  const [correctionData, setCorrectionData] = useState<CorrectionData | null>(null);
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
  const startRecording = () => {
    lastTranscriptRef.current = "";
    startListening();
    setIsListening(true);
    setIsPaused(false);
    setRecordingTime(0);
    setShowRecordingControls(true);
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Submit recording handler
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

  // Update the transcript effect
  useEffect(() => {
    if (isListening) {
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

  useEffect(() => {
    const filtered = templates.filter(template =>
      template.templateName.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setFilteredTemplates(filtered);
  }, [searchTerm, templates]);

  const handleCorrectionSubmit = async (correctedData: any) => {
    try {
      setIsLoading(true);
      setCorrectionData(null);

      const response = await axios.post(apiEndpoint, {
        prompt: prompt.trim(),
        selectedTemplate: selectedTemplate || undefined,
        correctedData // Send corrected data to a special endpoint
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
      
      if (error.response?.status === 400 && error.response.data?.errors) {
        // Handle validation errors with mapping issues
        const { errors, nibrs: nibrsData, mappingConfidence, correctionContext, warnings } = error.response.data;
        
        setCorrectionData({
          errors,
          nibrsData,
          confidence: mappingConfidence,
          correctionContext,
          warnings
        });
        
        toast({
          title: "Mapping Assistance Needed",
          description: "Please review the auto-mapped codes",
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

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
          errors={correctionData.errors}
          warnings={correctionData.warnings || []}
          nibrsData={correctionData.nibrsData}
          confidence={correctionData.confidence}
          correctionContext={correctionData.correctionContext}
          onCorrect={handleCorrectionSubmit}
          onCancel={() => setCorrectionData(null)}
        />
      )}
      
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
        {!message && !isLoading && (
          <RecordingControls
            showRecordingControls={showRecordingControls}
            isPaused={isPaused}
            recordingTime={recordingTime}
            formatTime={formatTime}
            resumeRecording={resumeRecording}
            pauseRecording={pauseRecording}
            submitRecording={submitRecording}
            startRecording={startRecording}
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
          />
        )}
      </div>
    </div>
  );
};

export default BaseReport;