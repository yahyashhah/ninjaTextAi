"use client";

import TextEditor from "@/components/editor";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const ViewReport = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [id, setId] = useState("");

  useEffect(() => {
    setName(localStorage.getItem("name") || "");
    setText(localStorage.getItem("text") || "");
    setId(localStorage.getItem("id") || "");
    console.log(name, text, id);
  }, []);

  return (
    <div>
      <div className="w-full flex justify-between items-center p-4 px-10 bg-white drop-shadow-md rounded-lg">
        <ArrowLeft
          className="cursor-pointer hover:animate-pulse"
          onClick={() => router.back()}
        />
      </div>
      <TextEditor text={text} id={id} name={name} />
    </div>
  );
};

export default ViewReport;
