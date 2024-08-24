"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React from "react";
import { dashboardConstants } from "./constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const Dashboard = () => {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="flex flex-col items-center mb-8 gap-4 px-4 md:px-8">
        <h1 className="bg-gradient-to-t from-[#0A236D] to-[#5E85FE] bg-clip-text text-transparent text-2xl sm:text-4xl md:text-5xl font-bold text-center mt-16">
          NinjaText-AI
        </h1>
        <p className="text-gray-600 font-normal text-base md:text-lg text-center">
          Streamline your police reporting with our advanced AI platform. <br />
          Easily dictate reports and receive accurate, comprehensive narratives
          instantly.
        </p>
        <p className="text-gray-500 font-normal text-sm md:text-base text-center">
          Select your report type and continue generating your report.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 md:px-8 lg:px-16">
        {dashboardConstants.map((tool, index) => (
          <TooltipProvider key={index}>
          <Tooltip>
            <TooltipTrigger asChild>
          <Card
            key={index}
            onClick={() => router.push(tool.href)}
            className="p-4 border rounded-lg shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className={cn(`p-4 w-fit rounded-md`, tool.bgColor)}>
                <tool.icon className={cn("w-6 h-6 md:w-8 md:h-8", tool.color)} />
              </div>
              <div className="font-semibold text-sm md:text-md">{tool.label}</div>
            </div>
          </Card>
          </TooltipTrigger>
        <TooltipContent>
          <p className="w-52">{tool.tip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
