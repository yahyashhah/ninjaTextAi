"use client";

import * as z from "zod";
import { ArrowLeft, ArrowUp, Mic } from "lucide-react";
import { useForm } from "react-hook-form";
import { formSchema, selectTool } from "./constant";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import axios from "axios";
// import { Empty } from "@/components/empty";
import { Loader } from "@/components/loader";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WitnessStatement = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatCompletionMessageParam[]>([
    {
      role: "system",
      content:
        "Hello I am a powerful assiatnt and I will make a report for you",
    },
  ]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const userMessage: ChatCompletionMessageParam = {
        role: "user",
        content: values.prompt,
      };
      console.log(userMessage);
      const newMessages = [userMessage, ...messages];
      const response = await axios.post("/api/easylearning", {
        messages: newMessages,
      });
      setMessages((current) => [...current, userMessage, response.data]);
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
      <div className="w-full flex justify-between items-center p-4 px-10 bg-white drop-shadow-sm rounded-lg">
        <ArrowLeft
          className="cursor-pointer hover:animate-pulse"
          onClick={() => router.back()}
        />
        <h1 className="text-lg font-semibold bg-gradient-to-t from-[#0A236D] to-[#5E85FE] bg-clip-text text-transparent">
        Witness Statement Report
        </h1>
      </div>
      <div className="px-4 lg:px-8 flex-1">
        <div className="space-y-4 mt-4">
          {isLoading && (
            <div className="p-8 rounded-lg w-full flex items-center justify-center bg-muted">
              <Loader />
            </div>
          )}
          {/* {messages.length === 0 && !isLoading && (
            <Empty label="No Conversation Started." />
          )} */}
          <div className="flex flex-col-reverse gap-y-4 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "p-6 w-full flex items-start gap-x-8 rounded-lg ",
                  message.role === "user"
                    ? "bg-white border border-black/10"
                    : "bg-muted"
                )}
              >
                {/* {message.role === "user" ? <UserAvatar /> : <BotAvatar />} */}
                <p id="content" className="text-sm">
                  {String(message.content)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div id="chat-system" className="mt-auto px-4 lg:px-8">
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
            <Mic className="cursor-pointer text-gray-700" />
            <FormField
              name="prompt"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl className="m-0 p-0">
                    <Input
                      className="p-2 border-0"
                      disabled={isLoading}
                      placeholder="Record something or type"
                      {...field}
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

export default WitnessStatement;
