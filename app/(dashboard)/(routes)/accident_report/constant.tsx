// app/(dashboard)/(routes)/accident_report/constant.ts
import { AlertTriangle } from "lucide-react";
import * as z from "zod";

export const formSchema = z.object({
    prompt: z.string()
})

// Report configuration - without JSX elements
export const accidentReportConfig = {
  reportType: "accident report",
  reportName: "Accident Report",
  reportIcon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  iconClassName: "h-5 w-5 text-orange-500", // Store className separately
  apiEndpoint: "/api/accident_report",
  defaultTip: "Tip: Include location, time, vehicles involved, injuries, and circumstances for best results",
  recordingTip: "Speak clearly to record details about the accident",
  helpContent: ( // Change from helpItems to helpContent and make it a function
    <div className="space-y-3">
      <p>
        <span className="font-semibold">1. Templates:</span> Select or create templates for standardized reporting formats.
      </p>
      <p>
        <span className="font-semibold">2. Input Methods:</span> Use voice dictation (click mic icon) or type manually.
      </p>
      <p>
        <span className="font-semibold">3. Auto-Formatting:</span> System generates complete reports from your input.
      </p>
      <p>
        <span className="font-semibold">4. Key Information:</span> Include location, time, vehicles involved, injuries, and contributing factors.
      </p>
    </div>
  )
};