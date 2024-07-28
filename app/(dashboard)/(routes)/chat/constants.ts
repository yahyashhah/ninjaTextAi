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
      
    },
    
    {
      label: "Arrest Report",
      icon: BookLock,
      href: "/arrest_report",
      color: "text-[#1BC18F]",
      bgColor: "bg-[#E2F7FA]",
    },
    {
        label: "Accident Report",
        icon: CarFront,
        href: "/accident_report",
        color: "text-[#E88686]",
        bgColor: "bg-[#FEE5E1]",

      },
      {
        label: "Witness Statements",
        icon: Fingerprint,
        href: "/witness_report",
        color: "text-[#4260D3]",
        bgColor: "bg-[#E2E8FF]",

      },
      {
        label: "Use of Force Report",
        icon: Activity,
        href: "/use_of_force",
        color: "text-[#E88686]",
        bgColor: "bg-[#FEE5E1]",

      },
      {
        label: "Domestic Voilence's Report",
        icon: House,
        href: "/domestic_voilence",
        color: "text-[#4260D3]",
        bgColor: "bg-[#E2E8FF]",

      },
      {
        label: "Field Interview Reports",
        icon: Handshake,
        href: "/field_interview",
        color: "text-[#8F42C5]",
        bgColor: "bg-[#EDD3FF]",

      },
      {
        label: "Supplemental Reports",
        icon: BookOpen,
        href: "/supplemental_report",
        color: "text-[#1BC18F]",
        bgColor: "bg-[#E2F7FA]",

      },
  ];
  