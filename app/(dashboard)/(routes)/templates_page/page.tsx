'use client';
import Link from 'next/link';
import { Slot } from '@radix-ui/react-slot';
import { Button } from "@/components/ui/button";
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { log } from 'console';

interface Template {
  id: string;
  templateName: string;
  instructions: string;
  reportTypes: string[];
  examples: string;
}

const Page = () => {
  const [templates, setTemplates] = useState<Template[]>([]);  // Define Template type here

  const router = useRouter();

  const getAllTemplates = async () => {
    try {
      const response = await axios.get("/api/get_all_templates");
      console.log(response);
      setTemplates(response.data.templates);  // Make sure the response data matches the Template structure
    } catch (error) {
      console.log(error);
    }
  };
  const deleteTemplate = async (templateId: string): Promise<void> => {
    try {
      console.log(templateId);
      
      const response = await axios.delete('/api/delete_template', {
        data: { id: templateId },  // Pass data for the DELETE request body
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(response.data.message);  // Show success message or update the UI if the delete was successful
      getAllTemplates();
    } catch (error) {      
      if (axios.isAxiosError(error) && error.response) {
        console.error('Delete failed:', error.response.data.error);
      } else {
        console.error('Error deleting template:', error);
      }
    }
  };
  
  
   console.log(templates);
   
  useEffect(() => {
    getAllTemplates();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-74px)] bg-gray-100 overflow-hidden">
  <div className="w-full flex justify-end items-center p-4 px-6 bg-white border-b border-slate-300 shadow-md rounded-b-lg">
    <Link href="/create_template" passHref>
      <Button className="bg-blue-600">
        Create Template
      </Button>
    </Link>
  </div>
  <div className="w-full h-full p-4 bg-white overflow-y-auto">
    <div className="w-full grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {templates.map((template) => (
        <Dialog key={template.id}>
          <DialogTrigger asChild>
            <div className="max-w-[20rem] h-fit mx-auto w-full bg-white rounded-lg shadow-md p-6 space-y-4">
              <div className="text-xl font-semibold text-gray-800">{template.templateName}</div>
              <div className="space-y-2">
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex justify-end">
                <Button className="bg-blue-600 w-full">Preview Template</Button>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-screen-lg">
            <DialogHeader>
              <DialogTitle>{template.templateName}</DialogTitle>
            </DialogHeader>
            <div className="w-full flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <p className="font-semibold">Instructions for AI:</p>
                <pre className="whitespace-pre-wrap overflow-y-scroll h-96">
                  {template.instructions}
                </pre>
                <div className="flex items-center gap-2">
                  <label>Report Type:</label>
                  <p className="font-semibold">{template.reportTypes.join(', ')}</p>
                </div>
              </div>
            </div>
            <DialogFooter className="sm:justify-start">
              <Button
                className="mb-2"
                onClick={() => {
                  localStorage.setItem("template_id", template.id);
                  localStorage.setItem("template_text", template.instructions);
                  localStorage.setItem("template_name", template.templateName);
                  localStorage.setItem("template_report", JSON.stringify(template.reportTypes));
                  localStorage.setItem("template_example", template.examples);
                  router.push("/templates_page/view_template");
                }}
              >
                Edit
              </Button>
              <Button
                className="mb-2"
                onClick={() => deleteTemplate(template.id)}
                type="button"
                variant="destructive"
              >
                Delete
              </Button>
              <DialogClose asChild>
                <Button className="mb-2" type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  </div>
</div>

  );
};

export default Page;