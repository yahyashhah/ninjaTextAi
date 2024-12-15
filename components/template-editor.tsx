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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";

interface EditorProps {
  text: string;
  id: string;
  name: string;
  reportType: string;
}

const TemplateEditor = ({
  text = "",
  id = "",
  name = "",
  reportType = "",
}: EditorProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [templateName, setTemplateName] = useState(name); 
  const [documentText, setDocumentText] = useState(text); 
  const [confirmName, setConfirmName] = useState("");
  const [confirmCopy, setConfirmCopy] = useState("");
  const printRef = useRef<HTMLDivElement>(null);
  const router = useRouter()
  const { toast } = useToast();

  // Set initial values when the component mounts
  useEffect(() => {
    setTemplateName(name);
    setDocumentText(text);
  }, [name, text]);

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
    const blob = new Blob([content.innerText]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "untitled.txt";
    link.click();
  };

  const handleSave = async () => {
    try {
      const instructions = documentText.length === 0 ? text : documentText;

      const response = await axios.put('/api/update_template', {
        id: id,
        templateName: templateName,
        instructions: instructions,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
  
      if (response.status === 200) {
        console.log(response.data.message);
      }
      router.push('/templates_page');
      toast({
        variant: "default",
        title: "Success",
        description: "Template saved successfully",
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
      setConfirmCopy("");
      toast({
        variant: "default",
        title: "Copied",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      console.error("Unable to copy to clipboard:", error);
    }
  };

  const handleInput = () => {
    if (contentRef.current) {
      setDocumentText(contentRef.current.innerText);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-white rounded-lg shadow">
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-4">
        Template Name :<Input className="w-fit" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
        <br />
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 drop-shadow-md text-xs sm:text-base">
              Save Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] w-full">
            <DialogHeader>
              <DialogTitle>
                Are you sure you want to update the Template?
              </DialogTitle>
              <DialogDescription className="mt-2">
                <br />
                By clicking "Approve," you confirm that you have thoroughly
                reviewed the narrative and verify that it is accurate and
                complete. Any necessary edits should be made before proceeding.
                <br />
                <br />
                Write <span className="font-bold">{name}</span> in the textbox
                to update file.
                <Input
                  onChange={(e) => setConfirmName(e.target.value)}
                  className="mt-4"
                  placeholder="Please write here!"
                />
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <DialogClose>
                <Button className="bg-sky-500 drop-shadow-md w-full sm:w-auto">
                  Keep Editing
                </Button>
              </DialogClose>
              <Button
                className="bg-sky-500 drop-shadow-md w-full sm:w-auto"
                disabled={name === confirmName ? false : true}
                onClick={handleSave}
              >
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          className="bg-sky-500 drop-shadow-md text-xs sm:text-base"
          onClick={handleDownloadTxt}
        >
          Download File
        </Button>
        <Button
          className="bg-sky-500 drop-shadow-md text-xs sm:text-base"
          onClick={handlePrint}
        >
          Print
        </Button>
      </div>
      <div className="flex gap-1 sm:gap-2 mb-4">
        <Button
          onClick={() => applyStyle("font-weight: bold;")}
          className="border p-1 sm:p-2 rounded bg-sky-500 drop-shadow-md"
        >
          <BoldIcon />
        </Button>
        <Button
          onClick={() => applyStyle("font-style: italic;")}
          className="border p-1 sm:p-2 rounded bg-sky-500 drop-shadow-md"
        >
          <ItalicIcon />
        </Button>
        <Button
          onClick={() => applyStyle("text-decoration: underline;")}
          className="border p-1 sm:p-2 rounded bg-sky-500 drop-shadow-md"
        >
          <UnderlineIcon />
        </Button>
      </div>
      <div ref={printRef}>
        <div
          ref={contentRef}
          contentEditable
          className="border-4 p-4 rounded min-h-[200px] whitespace-pre-wrap"
          onInput={handleInput}
        >
          <pre className="whitespace-pre-wrap">{text}</pre>
        </div>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-x-2 mt-4 bg-sky-500 hover:bg-sky-600 text-white">
            <Copy className="h-5 w-5" /> Copy Template
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Are you sure you want to copy the template?</DialogTitle>
            <DialogDescription className="mt-2">
              By clicking "Approve," you confirm that you have thoroughly
              reviewed the narrative and verify that it is accurate and
              complete. Any necessary edits should be made before proceeding.
              <br />
              <br />
              Write <span className="font-bold">{name}</span> in textbox to copy
              text
              <Input
                onChange={(e) => setConfirmCopy(e.target.value)}
                className="mt-4"
                placeholder="Please write here!"
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>
              <Button className="bg-sky-500 drop-shadow-md w-full sm:w-auto">
                Keep Editing
              </Button>
            </DialogClose>
            <Button
              className="bg-sky-500 drop-shadow-md w-full sm:w-auto"
              disabled={name === confirmCopy ? false : true}
              onClick={handleCopy}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateEditor;