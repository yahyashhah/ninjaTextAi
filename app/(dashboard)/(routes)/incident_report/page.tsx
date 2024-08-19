"use client";

import * as z from "zod";
import { useEffect, useState } from "react";
import { useVoiceToText } from "react-speakup";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

import { formSchema } from "./constant";

import { ArrowLeft, ArrowUp, Mic, MicOff } from "lucide-react";
// import { Empty } from "@/components/empty";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Loader } from "@/components/loader";
import { cn } from "@/lib/utils";
import Editor from "@/components/editor";
import TextEditor from "@/components/new-editor";
import { Empty } from "@/components/empty";

const IncidentReport = () => {
  const router = useRouter();
  const { startListening, stopListening, transcript } = useVoiceToText();
  const [prompt, setPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (isListening) {
      setPrompt(transcript);
    }
  }, [transcript, isListening, prompt]);

  const [message, setMessage] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      values.prompt = prompt;
      console.log(values.prompt);
      const response = await axios.post("/api/incident_report", values);
      console.log(response.data);
      setMessage(response.data.content);
      form.reset({ prompt: "" });
    } catch (error: any) {
      // todo: Open Pro Modal
      console.log(error);
    } finally {
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col " style={{ minHeight: "calc(100vh - 90px)" }}>
      <div className="w-full flex justify-between items-center p-4 px-10 bg-white drop-shadow-md rounded-lg">
        <ArrowLeft
          className="cursor-pointer hover:animate-pulse"
          onClick={() => router.back()}
        />
        <h1 className="text-lg font-semibold bg-gradient-to-t from-[#0A236D] to-[#5E85FE] bg-clip-text text-transparent">
          Incident Report
        </h1>
      </div>
      <div className="px-4 lg:px-8 flex-1 py-4">
        <div className="space-y-4 mt-4">
          {isLoading && (
            <div className="p-8 rounded-lg w-full flex items-center justify-center bg-muted">
              <Loader />
            </div>
          )}
          {message.length === 0 && !isLoading && (
            <Empty label="Let's Generate Incident Report!" />
          )}
          <div className="flex flex-col-reverse gap-y-4 ">
            {message.length > 0 && (
              <div
                className={cn(
                  "p-6 w-full flex items-start gap-x-8 rounded-lg bg-sky-200"
                )}
              >
                <TextEditor text={message} tag="incident" />
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        id="chat-system"
        className="mt-auto bg-white px-4 lg:px-8 relative bottom-4"
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="
              rounded-lg 
              w-full 
              p-3 
              md:px-6 
              flex
              items-center
              gap-x-2
              border-[#5E85FE]
              border-2
              dropshadow-lg
            "
          >
            {isListening === false ? (
              <Mic
                className="cursor-pointer text-[#3a68f1] text-xl font-extrabold"
                onClick={() => {
                  startListening();
                  setIsListening(true);
                }}
              />
            ) : (
              <MicOff
                className="cursor-pointer text-[#3a68f1] animate-ping text-md"
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
                    <Input
                      className="p-2 border-0"
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
              className="bg-[#5E85FE] hover:bg-[#0A236D]"
              type="submit"
              disabled={isLoading}
              size="icon"
            >
              <ArrowUp className="cursor-pointer" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default IncidentReport;
