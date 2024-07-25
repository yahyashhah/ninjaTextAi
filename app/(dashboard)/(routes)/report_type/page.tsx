"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React from "react";
import { dashboardConstants } from "./constants";
import { ArrowRight } from "lucide-react";

const Dashboard = () => {
  const router = useRouter();
  return (
    <div>
      <div className="flex flex-col items-start mb-8 px-8">
        <h2 className="my-4 text-xl md:text-2xl font-bold text-center">
          Report Type
        </h2>
        <p className="text-muted-foreground font-normal text-sm text-center">
          Select Your Report Type Here
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-4 gap-4 px-2 md:px-8 overflow-scroll lg:overflow-hidden">
        {dashboardConstants.map((tool, index) => (
          <div key={index}>
            <Card
              onClick={() => router.push(tool.href)}
              key={tool.href}
              className="p-4 border-black/4 items-center flex justify-between drop-shadow-lg hover:shadow-md transition cursor-pointer"
            >
              <div className="flex flex-col gap-y-4">
                <div className={cn(`p-4 w-fit rounded-md`, tool.bgColor)}>
                  <tool.icon className={cn("w-8 h-8", tool.color)} />
                </div>
                <div className="font-semibold text-xl">{tool.label}</div>
                <div className="text-sm">{tool.description}</div>
                <div className="right-0 text-blue-500 w-full flex items-end"><ArrowRight /></div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
