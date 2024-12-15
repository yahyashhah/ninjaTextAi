"use client";

import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

export const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  email: z
    .string()
    .email({
      message: "Invalid email address",
    })
    .min(1, {
      message: "Email is required",
    }),
  phone: z
    .string()
    .min(10, {
      message: "Phone number must be at least 10 digits",
    })
    .optional(),
  message: z.string().min(1, {
    message: "Message is required",
  }),
});

export default function ContactUsGeneralForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSuccessMessage("Your message has been sent successfully!");
        form.reset();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Something went wrong.");
      }
    } catch (error) {
      setErrorMessage("Failed to send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-12 mx-6 lg:mx-32 border-2 p-4 rounded-xl bg-white py-2 mb-6">
      <div className="p-4">
        <h2 className="text-3xl font-bold">General Contact Form</h2>
        <p className="text-muted-foreground mt-2">
          Have a question or need support? Fill out the form below, and a member
          of our team will <br /> get back to you as soon as possible.
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="rounded-lg w-full p-4 grid grid-cols-12 gap-4"
        >
          <FormField
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-12">
                <FormControl>
                  <Input
                    placeholder="Name*"
                    className="border rounded-full outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="email"
            render={({ field }) => (
              <FormItem className="col-span-12 md:col-span-6">
                <FormControl>
                  <Input
                    placeholder="Email*"
                    className="border rounded-full outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="phone"
            render={({ field }) => (
              <FormItem className="col-span-12 md:col-span-6">
                <FormControl>
                  <Input
                    placeholder="Phone (Optional)"
                    className="border rounded-full outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="message"
            render={({ field }) => (
              <FormItem className="col-span-12">
                <FormControl>
                  <Textarea
                    placeholder="Message*"
                    className="border rounded-lg h-32 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="col-span-12 w-full bg-cyan-600 text-white rounded-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
          {successMessage && (
            <p className="col-span-12 text-green-600">{successMessage}</p>
          )}
          {errorMessage && (
            <p className="col-span-12 text-[#CC302F]">{errorMessage}</p>
          )}
        </form>
      </Form>
    </div>
  );
}
