// app/(dashboard)/(routes)/accident_report/page.tsx
"use client";

import BaseReport from "@/components/reports/BaseReport";
import { accidentReportConfig, formSchema } from "./constant";

const AccidentReport = () => {
  return (
    <BaseReport
      {...accidentReportConfig}
      formSchema={formSchema}
    />
  );
};

export default AccidentReport;