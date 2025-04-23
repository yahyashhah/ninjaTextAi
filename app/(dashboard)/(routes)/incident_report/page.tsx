"use client";

import * as z from "zod";
import { useEffect, useState } from "react";
import { useVoiceToText } from "react-speakup";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema } from "./constant";

import { ArrowLeft, ArrowUp, Mic, MicOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import * as Select from '@radix-ui/react-select';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Loader } from "@/components/loader";
import { cn } from "@/lib/utils";
import TextEditor from "@/components/new-editor";
import { Empty } from "@/components/empty";
import { useToast } from "@/components/ui/use-toast";

type Template = {
  id: string;
  templateName: string;
  instructions: string;
  reportTypes: string[];
  createdAt: string;
};

const IncidentReport = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { startListening, stopListening, transcript } = useVoiceToText();
  const [prompt, setPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [message, setMessage] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  // Handle voice input
  useEffect(() => {
    if (isListening) {
      setPrompt(transcript);
    }
  }, [transcript, isListening]);

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.post('/api/filter_template', {
          reportTypes: ['incident report'], // Now accepts an array
        });
        setTemplates(response.data.templates);
        setFilteredTemplates(response.data.templates);
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

  // Filter templates based on search term
  useEffect(() => {
    const filtered = templates.filter(template =>
      template.templateName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTemplates(filtered);
  }, [searchTerm, templates]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const dataToSend = {
        ...values,
        prompt: prompt,
        selectedTemplate: selectedTemplate,
      };
  
      const response = await axios.post("/api/incident_report", dataToSend);
      setMessage(response.data.content);
      form.reset({ prompt: "" });
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast({
          title: "Free Trial Ended",
          description: "You've reached your free usage limit.",
          variant: "destructive",
          action: (
            <button
              onClick={() => router.push("/manage_subscription")}
              className="text-sm text-blue-500 underline"
            >
              Upgrade
            </button>
          ),
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate report",
          variant: "destructive",
        });
        console.error("Report generation error:", error);
      }
    } finally {
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-74px)] bg-gray-100">
      <div className="w-full flex justify-between items-center p-4 px-6 bg-white shadow-md rounded-b-lg">
        <ArrowLeft
          className="cursor-pointer hover:animate-pulse text-xl"
          onClick={() => router.back()}
        />
        <h1 className="text-lg font-semibold bg-gradient-to-t from-[#0A236D] to-[#5E85FE] bg-clip-text text-transparent">
          Incident Report
        </h1>
      </div>
      <div className="px-4 lg:px-8 flex-1 py-4">
        <div
          id="message"
          className="space-y-4 mt-4 overflow-y-auto max-h-[calc(100vh-180px)]"
        >
          {isLoading && (
            <div className="p-8 rounded-lg w-full flex items-center justify-center bg-white">
              <Loader />
            </div>
          )}
          {message.length === 0 && !isLoading && (
            <Empty 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm} 
              filteredTemplates={filteredTemplates} 
              selectedTemplate={selectedTemplate} 
              setSelectedTemplate={setSelectedTemplate} 
            />
          )}
          <div className="flex flex-col-reverse gap-y-4">
            {message.length > 0 && (
              <div className={cn("p-6 w-full flex items-start gap-x-8 rounded-lg bg-sky-200")}>
                <TextEditor text={message} tag="incident" />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white px-4 lg:px-8 py-2 bottom-0 left-0 w-full flex items-center border-t border-gray-200 shadow-lg">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full flex items-center gap-2 border-2 border-[#5E85FE] rounded-lg p-2 md:p-4"
          >
            {isListening === false ? (
              <Mic
                className="cursor-pointer text-[#3a68f1] text-xl md:text-2xl"
                onClick={() => {
                  startListening();
                  setIsListening(true);
                }}
              />
            ) : (
              <MicOff
                className="cursor-pointer text-[#3a68f1] text-xl md:text-2xl animate-ping"
                onClick={() => {
                  stopListening();
                  setIsListening(false);
                }}
              />
            )}

            <FormField
              name="prompt"
              render={() => (
                <FormItem className="w-full">
                  <FormControl className="m-0 p-0">
                    <textarea
                      className="p-2 border-0 w-full"
                      disabled={isLoading}
                      placeholder="Record something or type"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              className="bg-[#5E85FE] hover:bg-[#0A236D] text-white"
              type="submit"
              disabled={isLoading}
              size="icon"
            >
              <ArrowUp className="text-xl" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default IncidentReport;