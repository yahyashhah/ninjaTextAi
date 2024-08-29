"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FileIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type report = {
  id: string;
  userId: string;
  reportName: string;
  reportText: string;
  tag: string;
  createdAt: string;
  updatedAt: string;
}[];

const FilingCabinet = () => {
  const router = useRouter();
  const [reports, setReports] = useState<report>([]);
  const [byName, setByName] = useState("");

  const getAllReports = async () => {
    try {
      const response = await axios.get("/api/get_all_history");
      setReports(response.data.reports);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllReports();
  }, []);

  const handleChange = async (value: string) => {
    try {
      if (value === "all") {
        const response = await axios.get("/api/get_all_history");
        setReports(response.data.reports);
      } else {
        const response = await axios.post("/api/filter_history_report", { tag: value });
        setReports(response.data.reports);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="flex flex-col items-start mb-8 px-2 md:px-8 gap-2">
        <h1 className="my-2 bg-gradient-to-t from-[#0A236D] to-[#5E85FE] bg-clip-text text-transparent text-xl md:text-3xl font-bold text-center mt-6">
          History
        </h1>
        <p className="text-muted-foreground font-normal text-sm text-center">
          See all your history files here!
        </p>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center px-2 md:px-8 mb-4 gap-4">
        <select
          onChange={(e) => handleChange(e.target.value)}
          className="border p-2 rounded-lg w-full md:w-auto"
        >
          <option value="" disabled selected>
            Filter Reports
          </option>
          <option value="all">All</option>
          <option value="incident">Incident Report</option>
          <option value="arrest">Arrest Report</option>
          <option value="domestic_voilence">Domestic Violence Report</option>
          <option value="accident">Accident Report</option>
          <option value="supplemental">Supplemental Report</option>
          <option value="use_of_force">Use of Force Report</option>
          <option value="witness">Witness Statement Report</option>
          <option value="field_interview">Field Interview Report</option>
        </select>

      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 px-2 md:px-12 overflow-y-auto">
        {reports.length === 0 && (
          <h1 className="text-lg font-bold">No file saved yet</h1>
        )}

        {reports.map((report, index) => (
          <div key={index}>
            <Dialog>
              <DialogTrigger asChild>
                <Card
                  key={index}
                  className="p-4 border-black/2 bg-gray-100 flex flex-col justify-between drop-shadow-lg hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex items-center gap-x-4">
                    <div
                      className={cn(
                        `p-2 w-fit h-fit rounded-md bg-slate-100 border-gray-300 border-2`
                      )}
                    >
                      <FileIcon className={cn("w-12 h-12 text-[#5E85FE]")} />
                    </div>
                    <div className="flex flex-col gap-y-2">
                      <div className="text-md">
                        <span className="font-semibold">FileName: </span>
                        {report.reportName}
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold">Date: </span>
                        {report.createdAt.slice(0, 10)}
                      </div>
                      <div className="text-sm">
                        <span
                          className={cn(
                            "font-semibold text-white rounded-full p-1 px-2 text-xs drop-shadow-md",
                            report.tag === "incident" && "bg-yellow-400",
                            report.tag === "accident" && "bg-pink-500",
                            report.tag === "arrest" && "bg-red-500",
                            report.tag === "use_of_force" && "bg-purple-500",
                            report.tag === "domestic_voilence" && "bg-sky-500",
                            report.tag === "witness" && "bg-green-500",
                            report.tag === "supplemental" && "bg-cyan-800"
                          )}
                        >
                          {report.tag}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-screen-lg">
                <DialogHeader>
                  <DialogTitle>{report.reportName}</DialogTitle>
                </DialogHeader>
                <div className="w-full flex items-center space-x-2">
                  <div className="grid flex-1 gap-2">
                    <pre className="whitespace-pre-wrap overflow-y-scroll h-96">
                      {report.reportText}
                    </pre>
                  </div>
                </div>
                <DialogFooter className="sm:justify-start">
                  <Button
                    onClick={() => {
                      localStorage.setItem("id", report.id);
                      localStorage.setItem("text", report.reportText);
                      localStorage.setItem("name", report.reportName);
                      localStorage.setItem("tag", report.tag);
                      router.push("/history/view_report");
                    }}
                  >
                    Edit
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Close
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilingCabinet;
