"use client";

import HistoryTextEditor from "@/components/history-text-editor";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const ViewReport = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [id, setId] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    setName(localStorage.getItem("name") || "");
    setText(localStorage.getItem("text") || "");
    setId(localStorage.getItem("id") || "");
    setTag(localStorage.getItem("tag") || "");
    console.log(name, text, id);
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
        <HistoryTextEditor text={text} id={id} name={name} tag={tag} />
      </main>
    </div>
  );
};

export default ViewReport;
