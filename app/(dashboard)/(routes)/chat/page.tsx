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
      <div className="flex flex-col items-center mb-8 px-8 gap-2">
        <h1 className="my-4 bg-gradient-to-t from-[#0A236D] to-[#5E85FE] bg-clip-text text-transparent text-xl md:text-5xl font-bold text-center mt-16">
          CopNarrative
        </h1>
        <p className="text-muted-foreground font-normal text-md text-center">
          Streamline your police reporting with our advanced AI platform. <br />{" "}
          Easily dictate reports and receive accurate, comprehensive narratives
          instantly.
        </p>
        <p className="text-muted-foreground font-normal text-sm text-center">
          Select your report type and continue generating your report.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4 px-2 md:px-32 overflow-scroll lg:overflow-hidden">
        {dashboardConstants.map((tool, index) => (
          <div key={index}>
            <Card
              onClick={() => router.push(tool.href)}
              key={tool.href}
              className="p-4 border-black/4 items-center flex justify-between drop-shadow-lg hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center gap-x-4">
                <div className={cn(`p-4 w-fit rounded-md`, tool.bgColor)}>
                  <tool.icon className={cn("w-8 h-8", tool.color)} />
                </div>
                <div className="font-semibold text-md">{tool.label}</div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
