import * as z from "zod";

export const formSchema = z.object({
    prompt: z.string().min(1, {
        message: "Prompt is required"
    }),
})

export const selectTool = [
    {
      name: "Incident Report",
      value: "incident_report"
    },
    
    {
      name: "Arrest Report",
      value: "arrest_report"
    },
    {
        name: "Accident Report",
        value: "accident_report"
      },
      {
        name: "Witness Statements",
        value: "witness_statement"
      },
      {
        name: "Use of Force Report",
        value: "use_of_force_report"
      },
      {
        name: "Domestic Voilence's Report",
        value: "domestic_voilence"
      },
      {
        name: "Field Interview Reports",
        value: "field_interview"
      },
      {
        name: "Supplemental Reports",
        value: "supplemental_report"
      },
  ];
  