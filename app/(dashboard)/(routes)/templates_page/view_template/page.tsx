'use client';
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import TemplateEditor from "@/components/template-editor";
import React, { useEffect, useState } from "react";

const ViewTemplate = () => {
    const router = useRouter();
    const [name, setName] = useState("");
    const [text, setText] = useState("");
    const [id, setId] = useState("");
    const [reportType, setReportType] = useState("");
    const [examples, setExamples] = useState("");
  
    useEffect(() => {
      setName(localStorage.getItem("template_name") || "");
      setText(localStorage.getItem("template_text") || "");
      setId(localStorage.getItem("template_id") || "");
      setReportType(localStorage.getItem("template_report") || "");
      setExamples(localStorage.getItem("template_examples") || "");
      console.log(name, text, id, examples);
    }, [name, text, id]); // Update dependency array to include state variables
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="w-full flex justify-between items-center p-4 px-6 bg-white shadow-md rounded-b-lg">
        <ArrowLeft
          className="cursor-pointer text-xl hover:text-blue-600 transition-colors"
          onClick={() => router.back()}
        />
        <h1 className="text-lg font-semibold text-gray-900">View Report</h1>
      </header>
      <main className="flex-1 p-4 lg:p-8">
        <TemplateEditor text={text} id={id} name={name} reportType={reportType} />
      </main>
    </div>
  )
}

export default ViewTemplate