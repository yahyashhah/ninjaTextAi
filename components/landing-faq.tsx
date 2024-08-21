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
    <div id="faqs" className="bg-white py-12 sm:py-24">
      <div className="flex flex-col items-center justify-center px-4 sm:px-8 md:px-16 lg:px-32 gap-y-6">
        <p className="font-semibold text-gray-500 text-sm sm:text-base">
          FAQ's
        </p>
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-black text-center px-4 sm:px-8 md:px-16 lg:px-32">
          Everything you need to know about the product and usage.
        </h1>
        <Accordion type="single" collapsible className="w-full mt-6 flex  flex-col items-center">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={"question" + index}>
              <AccordionTrigger className="text-lg font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>
                {faq.answer ===
                "We offer support with a 24-hour turnaround when you email us at ninjatextAI@gmail.com." ? (
                  <a
                    href="mailto:ninjatextAI@gmail.com"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    We offer support with a 24-hour turnaround when you email us at ninjatextAI@gmail.com.
                  </a>
                ) : (
                  faq.answer
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default LandingFAQs;
