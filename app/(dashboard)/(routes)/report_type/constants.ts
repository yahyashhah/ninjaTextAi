import {
    AlertCircleIcon,
    PanelTopInactive,
    Braces,
    CarFront,
    PersonStanding,
    PowerCircle,
    MagnetIcon,
    Fingerprint,
    Activity,
    House,
    Handshake,
    BookOpen,
    BookLock,
  } from "lucide-react";

export const dashboardConstants = [
    {
      label: "Incident Report",
      icon: AlertCircleIcon,
      href: "/incident_report",
      color: "text-violet-500",
      bgColor: "bg-[#EDD3FF]",
      description: "Detailed accounts of specific incidents, including the sequence of events, actions taken, and statements from involved parties."
    },
    
    {
      label: "Arrest Report",
      icon: BookLock,
      href: "/arrest_report",
      color: "text-[#1BC18F]",
      bgColor: "bg-[#E2F7FA]",
      description: "Descriptions of the circumstances leading to an arrest, including the suspect's behavior, evidence collected, and any use of force."
    },
    {
        label: "Accident Report",
        icon: CarFront,
        href: "/accident_report",
        color: "text-[#E88686]",
        bgColor: "bg-[#FEE5E1]",
        description: "Narratives detailing the events leading up to, during, and after a vehicular accident, including witness statements and officer observations."
      },
      {
        label: "Witness Statements",
        icon: Fingerprint,
        href: "/witness_report",
        color: "text-[#4260D3]",
        bgColor: "bg-[#E2E8FF]",
        description: "Recorded narratives of what witnesses observed, which can be included as part of larger reports."
      },
      {
        label: "Use of Force Report",
        icon: Activity,
        href: "/use_of_force",
        color: "text-[#E88686]",
        bgColor: "bg-[#FEE5E1]",
        description: "Detailed accounts of situations where officers used force, including the justification and the outcome."
      },
      {
        label: "Domestic Voilence's Report",
        icon: House,
        href: "/domestic_voilence",
        color: "text-[#4260D3]",
        bgColor: "bg-[#E2E8FF]",
        description: "Summary of domestic violence incidents, detailing relationships, abuse evidence, and protective measures."
      },
      {
        label: "Field Interview Reports",
        icon: Handshake,
        href: "/field_interview",
        color: "text-[#8F42C5]",
        bgColor: "bg-[#EDD3FF]",
        description: "Narratives based on interactions with individuals during patrols, including the reasons for the interview and any relevant observations."
      },
      {
        label: "Supplemental Reports",
        icon: BookOpen,
        href: "/supplemental_report",
        color: "text-[#1BC18F]",
        bgColor: "bg-[#E2F7FA]",
        description: "Additional narratives added to original reports to provide more information or updates as an investigation progresses."
      },
  ];
  