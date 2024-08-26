"use client";
import { UserProfile, useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import Heading from "@/components/heading";
import { User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  policeRank: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  badgeNumber: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
});

const page = () => {
  const { user } = useUser();
  const [full_name, set_full_name] = useState("");
  const [police_rank, set_police_rank] = useState("");
  const [badge_number, set_badge_number] = useState("");
  const { toast } = useToast();

  const emailAddress = user?.primaryEmailAddress?.emailAddress;
  const fullName = user?.publicMetadata.fullName as string;
  const rank = user?.publicMetadata.rank as string;
  const badgeNumber = user?.publicMetadata.badgeNumber as string;
  

  useEffect(() => {
    set_full_name(fullName);
    set_police_rank(rank);
    set_badge_number(badgeNumber);
    console.log(full_name, badge_number, police_rank);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: full_name,
      policeRank: police_rank,
      badgeNumber: badge_number,
    },
  });
  async function onSubmit(values: z.infer<typeof formSchema>) {
    const response = await axios.post("/api/user_metadata", {
      fullName: values.fullName ,
      rank: values.policeRank,
      badgeNumber: values.badgeNumber,
    })
    toast({
      variant: "default",
      title: "Success",
      description: "Profile updated successfully",
    });
    console.log(response.data);
  }

  return (
    <>
    <Heading title="Personal Details" icon={User} iconColor="text-gray-500" description="Your Police Deatils" />
    <div className="bg-white min-h-screen px-4">
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-lg 
                border 
                w-full 
                p-4 
                px-3 
                md:px-6 
                focus-within:shadow-sm
                grid
                grid-cols-12
                gap-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem className="col-span-12 lg:col-span-6">
                <FormLabel>Fullname</FormLabel>
                <FormControl>
                  <Input placeholder={fullName} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="policeRank"
            render={({ field }) => (
              <FormItem className="col-span-12 lg:col-span-6">
                <FormLabel>Police Rank</FormLabel>
                <FormControl>
                  <Input placeholder={rank} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="badgeNumber"
            render={({ field }) => (
              <FormItem className="col-span-12 lg:col-span-6">
                <FormLabel>Badge Number</FormLabel>
                <FormControl>
                  <Input placeholder={badgeNumber} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button className="mt-6 col-span-12 lg:col-span-12" type="submit">Update</Button>
        </form>
      </Form>
    </div>
    </>
  );
};

export default page;

// <UserProfile
//   appearance={{
//     elements: {
//       rootBox: "w-full",
//       cardBox: "w-full",
//     },
//   }}
// />
