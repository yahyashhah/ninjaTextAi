import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/constants/landingpage";

const LandingFAQs = () => {
  return (
    <div id="faqs" className="bg-white pt-24">
      <div className="flex flex-col items-center justify-center px-32 gap-y-6">
        <p className="font-semibold text-gray-500">FAQ's</p>
        <h1 className="text-3xl font-bold text-black px-60 text-center">
          Everything you need to know about the product and usage.
        </h1>
        <Accordion type="single" collapsible className="w-full px-32 mt-6">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={"question"+index}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default LandingFAQs;
