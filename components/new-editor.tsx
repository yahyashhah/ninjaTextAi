"use client";

import {
  BoldIcon,
  Copy,
  ItalicIcon,
  TriangleAlertIcon,
  UnderlineIcon,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EditorProps {
  text: string;
  tag: string;
}

const TextEditor = ({ text = "", tag = "" }: EditorProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [reportName, setReportName] = useState("");
  const [documentText, setDocumentText] = useState("");
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const applyStyle = (style: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    const span = document.createElement("span");
    span.style.cssText = style;

    span.appendChild(range.extractContents());
    range.insertNode(span);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);
  };

  const addLink = () => {
    const url = prompt("Insert URL");
    if (url) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);

      const link = document.createElement("a");
      link.href = url;
      link.style.color = "blue";
      link.style.textDecoration = "underline";

      link.appendChild(range.extractContents());
      range.insertNode(link);

      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(link);
      selection.addRange(newRange);
    }
  };

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;

    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print</title>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleDownloadTxt = () => {
    const content = contentRef.current;
    if (!content) return;
    const blob = new Blob([content.innerText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "untitled.txt";
    link.click();
    URL.revokeObjectURL(url); // Clean up after download
  };

  const handleSave = async () => {
    try {
      let reportText = "";
      if (documentText.length === 0) {
        reportText = text;
      } else {
        reportText = documentText;
      }
      const response = await axios.post("/api/save_report", {
        reportName: reportName,
        reportText: reportText,
        tag: tag,
      });
      console.log(response.data);
      toast({
        variant: "default",
        title: "Success",
        description: "Report saved Successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failure",
        description: String(error),
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        variant: "default",
        title: "Copied",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      console.error("Unable to copy to clipboard:", error);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy text",
      });
    }
  };

  const handleInput = () => {
    if (contentRef.current) {
      setDocumentText(contentRef.current.innerText);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-white rounded-lg shadow-lg">
      <div className="toolbar mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Filename"
          className="border p-2 rounded w-full md:w-1/2 lg:w-1/3"
          onChange={(e) => setReportName(e.target.value)}
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600 text-white">Save File</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Report</DialogTitle>
              <DialogDescription className="mt-2">
                This is an AI-generated report. Ensure the report is correct before saving. If you have made changes and the report is accurate, please click save.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                className="bg-sky-500 hover:bg-sky-600 text-white"
                onClick={handleSave}
              >
                Save File
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          className="bg-sky-500 hover:bg-sky-600 text-white"
          onClick={handleDownloadTxt}
        >
          Download File
        </Button>
        <Button className="bg-sky-500 hover:bg-sky-600 text-white" onClick={handlePrint}>
          Print
        </Button>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          onClick={() => applyStyle("font-weight: bold;")}
          className="border p-2 rounded bg-sky-500 hover:bg-sky-600 text-white"
        >
          <BoldIcon />
        </Button>
        <Button
          onClick={() => applyStyle("font-style: italic;")}
          className="border p-2 rounded bg-sky-500 hover:bg-sky-600 text-white"
        >
          <ItalicIcon />
        </Button>
        <Button
          onClick={() => applyStyle("text-decoration: underline;")}
          className="border p-2 rounded bg-sky-500 hover:bg-sky-600 text-white"
        >
          <UnderlineIcon />
        </Button>
      </div>
      <div ref={printRef}>
        <div
          ref={contentRef}
          contentEditable
          className="border-2 p-4 rounded min-h-[200px] whitespace-pre-wrap"
          onInput={handleInput}
        >
          <pre className="whitespace-pre-wrap">{text}</pre>
        </div>
      </div>
      <Button
        className="flex items-center gap-x-2 mt-4 bg-sky-500 hover:bg-sky-600 text-white"
        onClick={handleCopy}
      >
        <Copy className="h-5 w-5" /> Copy Text
      </Button>
      <Alert className="mt-4 items-center">
        <TriangleAlertIcon className="h-5 w-5" />
        <AlertTitle>Be Careful!</AlertTitle>
        <AlertDescription>
          Verify the AI-generated report before saving it!
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TextEditor;
