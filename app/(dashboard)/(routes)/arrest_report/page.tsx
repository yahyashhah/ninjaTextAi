"use client";

import * as z from "zod";
import { useEffect, useState, useRef } from "react";
import { useVoiceToText } from "react-speakup";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema } from "./constant";
import {
  ArrowLeft,
  ArrowUp,
  Mic,
  MicOff,
  Plus,
  ChevronDown,
  FileText,
  Search,
  LayoutTemplate,
  ListChecks,
  Calendar,
  Clock,
  MapPin,
  User,
  ClipboardList,
  Pause,
  Play,
  ChevronsUpDown,
  BookText,
  X,
  Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Loader } from "@/components/loader";
import { cn } from "@/lib/utils";
import TextEditor from "@/components/new-editor";
import { Empty } from "@/components/empty";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Template = {
  id: string;
  templateName: string;
  instructions: string;
  reportTypes: string[];
  createdAt: string;
};

const ArrestReport = () => {
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
  const [showHelpModal, setShowHelpModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  // Check if user has seen the help modal before
  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('arrestReportHelpSeen');
    if (!hasSeenHelp) {
      setShowHelpModal(true);
      localStorage.setItem('arrestReportHelpSeen', 'true');
    }
  }, []);

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

  useEffect(() => {
    if (isListening) {
      setPrompt(transcript);
    }
  }, [transcript, isListening]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.post('/api/filter_template', {
          reportTypes: ['arrest report'],
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
  }, []);

  useEffect(() => {
    const filtered = templates.filter(template =>
      template.templateName.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setFilteredTemplates(filtered);
  }, [searchTerm, templates]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      
      if (!prompt.trim()) {
        toast({
          title: "Empty Content",
          description: "Please provide some details about the arrest",
          variant: "destructive",
        });
        return;
      }

      const dataToSend = {
        ...values,
        prompt: prompt.trim(),
        selectedTemplate: selectedTemplate || undefined,
      };

      console.log("Sending data to API:", dataToSend);
      
      const response = await axios.post("/api/arrest_report", dataToSend, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.data?.content) {
        throw new Error("No content in response");
      }

      setMessage(response.data.content);
      setPrompt("");
      form.reset();
      setSelectedTemplate(null);

    } catch (error: any) {
      console.error("Submission error:", error);
      
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }

      toast({
        title: "Submission Error",
        description: error.response?.data?.message || error.message || "Failed to submit report",
        variant: "destructive",
      });
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
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Arrest Report Guide
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6 text-gray-700 space-y-3">
              <p>
                <span className="font-semibold">1. Templates:</span> Select or create templates for standardized reporting formats.
              </p>
              <p>
                <span className="font-semibold">2. Input Methods:</span> Use voice dictation (click mic icon) or type manually.
              </p>
              <p>
                <span className="font-semibold">3. Auto-Formatting:</span> System generates complete reports from your input.
              </p>
            </div>            
            <Button 
              onClick={() => setShowHelpModal(false)} 
              className="w-full"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="w-full flex justify-between items-center p-4 px-6 bg-white shadow-sm border-b">
        <div className="flex items-center space-x-4">
          <ArrowLeft
            className="cursor-pointer text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => router.back()}
            size={20}
          />
          <div className="flex items-center space-x-2">
            <BookText className="h-5 w-5 text-blue-500" />
            <h1 className="text-lg font-semibold text-gray-800">
              Arrest Report
            </h1>
          </div>
        </div>
        
        {/* Help Button */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowHelpModal(true)}
          className="text-blue-600 hover:text-blue-800"
        >
          <Info className="h-4 w-4 mr-2" />
          Help
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Show loading state regardless of template selection */}
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
            {/* Show template selection bar if template is selected */}
            {selectedTemplate && (
              <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-lg shadow-sm border">
                <div className="flex items-center space-x-2">
                  <LayoutTemplate className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Template:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span>{selectedTemplate.templateName}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      {filteredTemplates.map((template) => (
                        <DropdownMenuItem
                          key={template.id}
                          onClick={() => setSelectedTemplate(template)}
                          className="cursor-pointer flex items-center space-x-2"
                        >
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span>{template.templateName}</span>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem 
                        onClick={() => router.push("/create-template")}
                        className="cursor-pointer flex items-center text-blue-600"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Create New Template</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setSearchTerm("");
                    setShowTemplates(false);
                  }}
                  className="text-red-500 hover:text-red-700 flex items-center space-x-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Change Template</span>
                </Button>
              </div>
            )}
            
            {/* Show the generated content */}
            <div className={cn("p-6 w-full rounded-lg bg-white border shadow-sm")}>
              <TextEditor text={message} tag="arrest" />
            </div>
          </div>
        ) : !selectedTemplate ? (
          <div className="max-w-3xl mx-auto rounded-lg p-6">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="flex items-center space-x-2">
                <LayoutTemplate className="h-6 w-6 text-blue-500" />
                <h2 className="text-[15px] md:text-xl font-semibold text-gray-800">
                  Choose a Template to Start Your Report
                </h2>
              </div>
              
              <div className="w-full max-w-md">
                <div className="flex items-center flex-col md:flex-row space-y-2 md:space-y-0 space-x-2">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowTemplates(true);
                      }}
                      onFocus={() => setShowTemplates(true)}
                      onBlur={() => setTimeout(() => setShowTemplates(false), 200)}
                      className="flex-1 pl-9"
                    />
                    <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <Button
                    onClick={() => router.push("/create_template")}
                    variant="outline"
                    className="space-x-2 w-full md:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create New</span>
                  </Button>
                </div>

                {showTemplates && (
                  <div className="mt-4 relative space-y-2 max-h-60 bg-white z-20 overflow-y-auto">
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((template) => (
                        <div
                          key={template.id}
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowTemplates(false);
                          }}
                          className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 border flex justify-between items-center space-x-3"
                        >
                          <div className="flex items-start space-x-3">
                            <FileText className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <h3 className="font-medium text-gray-800">{template.templateName}</h3>
                              <p className="text-xs text-gray-400">
                                {template.reportTypes.join(", ")}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">
                              {new Date(template.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-500">No templates found</p>
                        <Button
                          onClick={() => router.push("/create_template")}
                          variant="link"
                          className="mt-2 text-blue-600"
                        >
                          Create your first template
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Template Selection Bar */}
            <div className="flex items-center text-xs md:text-base justify-between mb-6 bg-white p-3 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2">
                <LayoutTemplate className="h-4 w-4 text-gray-500" />
                <span className="text-xs md:text-sm text-gray-500">Template:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span>{selectedTemplate.templateName}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    {filteredTemplates.map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className="cursor-pointer flex items-center space-x-2"
                      >
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span>{template.templateName}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem 
                      onClick={() => router.push("/create-template")}
                      className="cursor-pointer flex items-center text-blue-600"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Create New Template</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedTemplate(null);
                  setSearchTerm("");
                  setShowTemplates(false);
                }}
                className="text-red-500 hover:text-red-700 flex items-center space-x-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Change <span className="hidden md:inline">Template</span></span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Input Section with Recording Controls */}
      <div className="bg-white px-4 py-3 border-t relative">
        {/* Recording Controls - shown on top of input when recording */}
        {!message && !isLoading && (
          <div>
            {showRecordingControls ? (
              <div className="absolute bottom-full lg:bottom-40 xl:bottom-44 2xl:bottom-60 left-0 right-0 pt-4 rounded-t-lg">
                <div className="max-w-4xl mx-auto">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="relative">
                        {!isPaused && (
                          <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
                        )}
                        <Mic className="h-6 w-6 text-red-500 relative" />
                      </div>
                      <span className="text-lg font-medium text-gray-700">
                        {isPaused ? "Recording Paused" : "Recording"}
                      </span>
                    </div>
                    <div className="text-2xl font-mono font-medium text-gray-800 mb-4 text-center">
                      {formatTime(recordingTime)}
                    </div>
                    <div className="flex justify-center space-x-4 mb-4">
                      {isPaused ? (
                        <Button
                          onClick={resumeRecording}
                          variant="outline"
                          className="border-green-500 text-green-500 hover:bg-green-50"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </Button>
                      ) : (
                        <Button
                          onClick={pauseRecording}
                          variant="outline"
                          className="border-amber-500 text-amber-500 hover:bg-amber-50"
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      )}
                      <Button
                        onClick={submitRecording}
                        className="bg-blue-600 hover:bg-blue-700 mb-2"
                      >
                        Submit Recording
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={cn(
                "absolute",
                "bottom-40", // Default position
                "md:bottom-44", // Slightly higher on medium screens
                "lg:bottom-48", // Higher on large screens
                "xl:bottom-[13rem]", // Even higher on extra large screens
                "2xl:bottom-60", // Highest on 2xl screens
                "left-0 right-0 pt-4 rounded-t-lg"
              )}>
                <div className={cn(
                  "mx-auto",
                  "w-full max-w-md", // Default size
                  "lg:max-w-lg",     // Larger on lg screens
                  "xl:max-w-xl",     // Even larger on xl screens
                  "2xl:max-w-2xl",    // Largest size
                  "px-2"
                )}>
                  <div className="flex w-full flex-col items-center">
                    <p className="text-sm mb-1 text-slate-500 font-medium">
                      <span className="text-blue-500">Ready to speak?</span> Tap 'Start Recording'
                    </p>
                    <Button
                      onClick={startRecording}
                      variant="outline"
                      className="border-blue-500 text-lg text-blue-500 w-full py-3 hover:bg-blue-50 mb-4"
                    >
                      <Mic className="h-5 w-5 mr-4" />
                      Start Recording
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!message && !isLoading && (
        <> 
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full max-w-4xl mx-auto flex items-center gap-2 border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all"
          >
            <FormField
              name="prompt"
              render={() => (
                <FormItem className="flex-1">
                  <FormControl className="m-0 p-0">
                    <textarea
                      ref={textareaRef}
                      className="w-full border-0 focus:ring-0 resize-y min-h-[80px] max-h-[200px] py-2 px-3 text-base transition-all duration-200 ease-in-out"
                      disabled={isLoading}
                      placeholder="You can type here or use the mic to dictate"
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value);
                        // Auto-expand the textarea
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      rows={3}
                      style={{minHeight: '80px', maxHeight: '300px'}}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
              type="submit"
              disabled={isLoading || !prompt.trim()}
              size="icon"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </form>
        </Form>
        <div className="max-w-6xl mx-auto mt-2">
          <div className="flex items-center justify-center space-x-2">
            <ClipboardList className="h-4 w-4 text-gray-400" />
            <p className="text-xs xl:text-base text-gray-500 text-center">
              {showRecordingControls 
                ? "Speak clearly to record details about the arrest" 
                : "Tip: Include location, time, suspect details, charges, and circumstances for best results"}
            </p>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default ArrestReport;