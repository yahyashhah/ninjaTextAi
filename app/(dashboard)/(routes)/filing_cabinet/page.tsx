"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRouter } from "next/navigation";
import { filingCabinetFiles } from "./constants";

const FilingCabinet = () => {
  const router = useRouter();
  return (
    <div>
      <div className="flex flex-col items-start mb-8 px-8 gap-2">
        <h1 className="my-4 bg-gradient-to-t from-[#0A236D] to-[#5E85FE] bg-clip-text text-transparent text-xl md:text-3xl font-bold text-center mt-6">
          Filing Cabinet
        </h1>
        <p className="text-muted-foreground font-normal text-sm text-center">
          Select your report type and continue generating your report.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4 px-2 md:px-12 overflow-scroll lg:overflow-hidden">
        <Accordion type="single" collapsible className="w-full">
          {filingCabinetFiles.map((file, index) => (
            <AccordionItem key={index} value={file.cabinetName}>
              <AccordionTrigger className="text-lg font-bold">{file.cabinetName}</AccordionTrigger>
              {file.files.map((f, index) => (
                <AccordionContent key={index}>{f}</AccordionContent>
              ))}
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FilingCabinet;
