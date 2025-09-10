// components/reports/sub-components/GeneratedReport.tsx
import TextEditor from "@/components/new-editor";
import { cn } from "@/lib/utils";

interface GeneratedReportProps {
  message: string;
  reportType: string;
}

const ReportOutput = ({ message, reportType }: GeneratedReportProps) => {
  return (
    <div className={cn("p-6 w-full rounded-lg bg-white border shadow-sm")}>
      <TextEditor text={message} tag={reportType} />
    </div>
  );
};

export default ReportOutput;