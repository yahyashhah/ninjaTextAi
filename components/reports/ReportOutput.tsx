// components/reports/ReportOutput.tsx
import TextEditor from "@/components/new-editor";
import { cn } from "@/lib/utils";
import { OffenseType } from "@/constants/offences"; // Import if needed

interface GeneratedReportProps {
  message: string;
  reportType: string;
  offenseTypes?: OffenseType[] | null; // Added
}

const ReportOutput = ({ message, reportType, offenseTypes }: GeneratedReportProps) => {
  return (
    <div className={cn("p-6 w-full rounded-lg bg-white border shadow-sm")}>
      <TextEditor text={message} tag={reportType} />
    </div>
  );
};

export default ReportOutput;