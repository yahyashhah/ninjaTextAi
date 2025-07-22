"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { dashboardConstants } from "./constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react";

const Dashboard = () => {
  const router = useRouter();
  const [isTipExpanded, setIsTipExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col items-center mb-8 gap-4 px-4 md:px-8 relative">
        {/* Smooth Expanding Tip Badge */}
        <div className="absolute top-0 right-0 group">
          <div className="relative">
            <div className="
              w-8 h-8 
              group-hover:w-auto group-hover:max-w-xs
              transition-all duration-700 ease-out
              overflow-hidden
              bg-blue-50 border border-blue-200 
              rounded-lg
              flex items-center
            ">
              <div className="flex items-center gap-2 p-1.5">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="
                  text-xs text-blue-800 whitespace-nowrap
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200 delay-75
                ">
                  <span className="font-medium">Tip:</span> Hover over any report type for details
                </span>
              </div>
            </div>
          </div>
        </div>

        <h1 className="bg-gradient-to-t from-[#0A236D] to-[#5E85FE] bg-clip-text text-transparent text-2xl sm:text-4xl md:text-5xl font-bold text-center mt-16">
          NinjaText-AI
        </h1>
        <p className="text-gray-600 font-normal text-base md:text-lg text-center">
          Streamline your police reporting with our advanced AI platform. <br />
          Easily dictate reports and receive accurate, comprehensive narratives instantly.
        </p>
      </div>

      {/* Report Type Cards */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 px-4 md:px-8">
          Select Report Type
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-8">
          {dashboardConstants.map((tool, index) => (
            <TooltipProvider delayDuration={300} key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card
                    onClick={() => router.push(tool.href)}
                    className="p-5 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between hover:border-blue-300 group"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className={cn(
                        `p-3 w-fit rounded-lg transition-all group-hover:scale-110`,
                        tool.bgColor,
                        "group-hover:bg-blue-100"
                      )}>
                        <tool.icon className={cn(
                          "w-6 h-6 md:w-7 md:h-7 transition-colors",
                          tool.color,
                          "group-hover:text-blue-600"
                        )} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-base">{tool.label}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          "Create professional police reports"
                        </p>
                      </div>
                    </div>
                  </Card>
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  sideOffset={10}
                  className="bg-white border border-gray-200 shadow-xl rounded-lg p-4 max-w-xs"
                >
                  <h4 className="font-bold text-blue-600 mb-2 flex items-center gap-2">
                    <div className={cn(`p-1.5 rounded-md`, tool.bgColor)}>
                      <tool.icon className={cn("w-4 h-4", tool.color)} />
                    </div>
                    {tool.label}
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">{tool.tip}</p>
                  <p className="text-xs text-blue-600 font-medium mt-2">
                    Click to select this report type
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      {/* Footer Guidance */}
      <div className="max-w-3xl mx-auto mt-12 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-medium text-lg text-gray-800 mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          Quick Reporting Tips
        </h3>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex items-start gap-3">
            <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">1</span>
            <span>Speak clearly and include all relevant details when dictating</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">2</span>
            <span>Use templates for frequently created reports to save time</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">3</span>
            <span>Review all AI-generated content for accuracy before finalizing</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;