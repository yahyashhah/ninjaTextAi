"use client"
import { useState } from "react";
import * as Select from "@radix-ui/react-select";
import * as Label from "@radix-ui/react-label";
import { AirVent, Check, ChevronDown, ChevronLeft } from "lucide-react";
import axios from "axios";
import { useRouter } from 'next/navigation';
import * as Tooltip from "@radix-ui/react-tooltip";

const Create_template = () => {
    const [formValues, setFormValues] = useState({
        templateName: "",
        instructions: "",
        reportType: "",
        examples: "",
      });
    
      const router = useRouter();
      const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
      };
      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
      };
    
      const handleSelectChange = (name: string, value: string) => {
        setFormValues((prev) => ({ ...prev, [name]: value }));
      };


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  console.log(formValues.examples, formValues.instructions);
  
  try {
    const response = await axios.post('/api/create_template', {
      templateName: formValues.templateName,
      instructions: formValues.instructions,
      examples: formValues.examples,
      reportType: formValues.reportType,
    });
    router.push("/templates_page")
    console.log('Response:', response.data);
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      // Handle Axios error
      console.error('Error creating template:', error.response?.data?.message || error.message);
    } else {
      // Handle other types of errors
      console.error('Unexpected error:', error);
    }
  }
};
  return (
    <div className="flex flex-col h-[calc(100vh-74px)] bg-gray-100">
      <div className="w-full flex justify-between items-center p-4 px-6 bg-white border boredr-slate-300  rounded-b-lg">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
        <ChevronLeft />        
        </button>
      </div>
      <div className='w-full p-4 px-6 bg-white shadow-md rounded-b-lg'>
      <form onSubmit={handleSubmit} className="space-y-4 w-full mx-auto p-4 border rounded-lg">
      {/* Instructions Text Area */}
      <div className="flex flex-col gap-2">
        <Label.Root htmlFor="templatName" className="text-sm font-medium text-gray-700">
          Template Name
        </Label.Root>
        <input
          id="templatName"
          name="templateName"
          placeholder="Enter Template Name"
          value={formValues.templateName}
          onChange={handleInputChange}
          required
          className="p-2 border rounded-lg w-full resize-none focus:outline-none focus:ring focus:ring-indigo-500"
        />
      </div>

      <div className="flex flex-col gap-2">
  <div className="flex gap-1 items-center">
    <Label.Root htmlFor="instructions" className="text-sm font-medium text-gray-700">
      Instructions for AI
    </Label.Root>
    <div className="relative group inline-block">
  <svg
    className="text-slate-500"
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0.877075 7.49972C0.877075 3.84204 3.84222 0.876892 7.49991 0.876892C11.1576 0.876892 14.1227 3.84204 14.1227 7.49972C14.1227 11.1574 11.1576 14.1226 7.49991 14.1226C3.84222 14.1226 0.877075 11.1574 0.877075 7.49972ZM7.49991 1.82689C4.36689 1.82689 1.82708 4.36671 1.82708 7.49972C1.82708 10.6327 4.36689 13.1726 7.49991 13.1726C10.6329 13.1726 13.1727 10.6327 13.1727 7.49972C13.1727 4.36671 10.6329 1.82689 7.49991 1.82689ZM8.24993 10.5C8.24993 10.9142 7.91414 11.25 7.49993 11.25C7.08571 11.25 6.74993 10.9142 6.74993 10.5C6.74993 10.0858 7.08571 9.75 7.49993 9.75C7.91414 9.75 8.24993 10.0858 8.24993 10.5ZM6.05003 6.25C6.05003 5.57211 6.63511 4.925 7.50003 4.925C8.36496 4.925 8.95003 5.57211 8.95003 6.25C8.95003 6.74118 8.68002 6.99212 8.21447 7.27494C8.16251 7.30651 8.10258 7.34131 8.03847 7.37854L8.03841 7.37858C7.85521 7.48497 7.63788 7.61119 7.47449 7.73849C7.23214 7.92732 6.95003 8.23198 6.95003 8.7C6.95004 9.00376 7.19628 9.25 7.50004 9.25C7.8024 9.25 8.04778 9.00601 8.05002 8.70417L8.05056 8.7033C8.05924 8.6896 8.08493 8.65735 8.15058 8.6062C8.25207 8.52712 8.36508 8.46163 8.51567 8.37436L8.51571 8.37433C8.59422 8.32883 8.68296 8.27741 8.78559 8.21506C9.32004 7.89038 10.05 7.35382 10.05 6.25C10.05 4.92789 8.93511 3.825 7.50003 3.825C6.06496 3.825 4.95003 4.92789 4.95003 6.25C4.95003 6.55376 5.19628 6.8 5.50003 6.8C5.80379 6.8 6.05003 6.55376 6.05003 6.25Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
  <span className="absolute left-3 top-14 transform translate-x-2 -translate-y-full mt-1 px-3 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-40 sm:w-72">
    In your own words, describe what the AI should generate in the narrative. What format and information you want to see in the narrative.
  </span>
</div>
</div>

  <textarea
    id="instructions"
    name="instructions"
    placeholder="In your own words, describe what the AI should generate in your narrative e.g. 'In my burglary to Vehicle report narrative include these questions with the answers directly after the questions; 1. was the vehicle left unlocked? Were there valuables in plain sight? Did the vehicle have an alarm system? after completing these questions, in one paragraph summarize my narrative to include all information in my dictation.'"
    value={formValues.instructions}
    onChange={handleChange}
    required
    className="p-2 border rounded-lg w-full h-24 resize-none focus:outline-none focus:ring focus:ring-indigo-500"
  />
</div>


      {/* Report Type Select */}
      <div className="flex flex-col gap-2">
        <Label.Root htmlFor="reportType" className="text-sm font-medium text-gray-700">
          Report Type
        </Label.Root>
        <Select.Root
          onValueChange={(value) => handleSelectChange("reportType", value)}
          required
        >
          <Select.Trigger id="reportType" className="flex items-center justify-between p-2 border rounded-lg w-full">
            <Select.Value placeholder="Select report type" />
            <Select.Icon>
              <ChevronDown className="w-4 h-4" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Content className="z-10 bg-white rounded-lg shadow-lg w-full">
            <Select.Viewport>
              {["Incident report", "Arrest report", "Accident report", "Witness Statement", "Use of force report", "Domestic violence report", "Field interview report", "Supplemental report"].map((type) => (
                <Select.Item
                  key={type}
                  value={type.toLowerCase()}
                  className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                >
                  <Select.ItemText>{type}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check className="w-4 h-4 text-green-500 ml-2" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Root>
      </div>

      {/* Example area */}
      <div className="flex flex-col gap-2">
      <div className="flex gap-1 items-center">
    <Label.Root htmlFor="examples" className="text-sm font-medium text-gray-700">
      Examples (Optional)
    </Label.Root>
    <div className="relative group inline-block">
  <svg
    className="text-slate-500"
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0.877075 7.49972C0.877075 3.84204 3.84222 0.876892 7.49991 0.876892C11.1576 0.876892 14.1227 3.84204 14.1227 7.49972C14.1227 11.1574 11.1576 14.1226 7.49991 14.1226C3.84222 14.1226 0.877075 11.1574 0.877075 7.49972ZM7.49991 1.82689C4.36689 1.82689 1.82708 4.36671 1.82708 7.49972C1.82708 10.6327 4.36689 13.1726 7.49991 13.1726C10.6329 13.1726 13.1727 10.6327 13.1727 7.49972C13.1727 4.36671 10.6329 1.82689 7.49991 1.82689ZM8.24993 10.5C8.24993 10.9142 7.91414 11.25 7.49993 11.25C7.08571 11.25 6.74993 10.9142 6.74993 10.5C6.74993 10.0858 7.08571 9.75 7.49993 9.75C7.91414 9.75 8.24993 10.0858 8.24993 10.5ZM6.05003 6.25C6.05003 5.57211 6.63511 4.925 7.50003 4.925C8.36496 4.925 8.95003 5.57211 8.95003 6.25C8.95003 6.74118 8.68002 6.99212 8.21447 7.27494C8.16251 7.30651 8.10258 7.34131 8.03847 7.37854L8.03841 7.37858C7.85521 7.48497 7.63788 7.61119 7.47449 7.73849C7.23214 7.92732 6.95003 8.23198 6.95003 8.7C6.95004 9.00376 7.19628 9.25 7.50004 9.25C7.8024 9.25 8.04778 9.00601 8.05002 8.70417L8.05056 8.7033C8.05924 8.6896 8.08493 8.65735 8.15058 8.6062C8.25207 8.52712 8.36508 8.46163 8.51567 8.37436L8.51571 8.37433C8.59422 8.32883 8.68296 8.27741 8.78559 8.21506C9.32004 7.89038 10.05 7.35382 10.05 6.25C10.05 4.92789 8.93511 3.825 7.50003 3.825C6.06496 3.825 4.95003 4.92789 4.95003 6.25C4.95003 6.55376 5.19628 6.8 5.50003 6.8C5.80379 6.8 6.05003 6.55376 6.05003 6.25Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
  <span className="absolute left-3 top-14 transform translate-x-2 -translate-y-full mt-1 px-3 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-36 sm:w-72">
  Show AI examples of what you want to generate as the narrative. The better examples you give, the better result you will get. Good examples should be ones that are similar to the narrative you want to generate.
  </span>
</div>
</div>
        <textarea
          id="examples"
          name="examples"
          placeholder="Put Examples"
          value={formValues.examples}
          onChange={handleChange}
          className="p-2 border rounded-lg w-full h-20 resize-none focus:outline-none focus:ring focus:ring-indigo-500"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500"
      >
        Submit
      </button>
    </form>
      </div>
    </div>
  )
}

export default Create_template

