// components/reports/sub-components/DictationTemplate.tsx
import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, Mic, Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DictationTemplateProps {
  isVisible: boolean;
  onFieldReview: (fieldName: string, options: string[]) => void;
  completedSections: Set<string>;
  fieldOptions: { [key: string]: string[] };
  // New props for recording controls
  isRecording?: boolean;
  isPaused?: boolean;
  recordingTime?: number;
  formatTime?: (seconds: number) => string;
  onPauseRecording?: () => void;
  onResumeRecording?: () => void;
  onSubmitRecording?: () => void;
  onStopRecording?: () => void;
}

const DictationTemplate = ({ 
  isVisible, 
  onFieldReview, 
  completedSections, 
  fieldOptions,
  isRecording = false,
  isPaused = false,
  recordingTime = 0,
  formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
  onPauseRecording = () => {},
  onResumeRecording = () => {},
  onSubmitRecording = () => {},
  onStopRecording = () => {}
}: DictationTemplateProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["incident", "victim", "offense"]));
  const [currentDate] = useState(new Date().toLocaleDateString());
  const [currentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleReviewRequest = (fieldName: string) => {
    const options = fieldOptions[fieldName] || ["Unknown", "Not specified"];
    onFieldReview(fieldName, options);
  };

  const templateSections = [
    {
      id: "incident",
      title: "Incident Details",
      content: `Today is [${currentDate}] at approximately [${currentTime}]. I was dispatched to [address / business name] in reference to [type of incident].`,
      fields: ["location", "incidentType"]
    },
    {
      id: "victim",
      title: "Victim Information",
      content: `Upon arrival, I made contact with [victim name]. The victim is a [age]-year-old [male/female]. The victim's race is [race if known, otherwise unknown], and ethnicity [if known]. The relationship between the victim and offender is [relationship if known, otherwise unknown].`,
      fields: ["victimName", "victimAge", "victimGender", "race", "ethnicity", "relationship"]
    },
    {
      id: "offense",
      title: "Offense Description",
      content: `The victim reported that [describe what happened, including actions by offender(s)]. The offense involved is [statute number if known], which is classified as [offense description]. The offense was [attempted/completed].`,
      fields: ["statute", "offenseDescription", "offenseStatus"]
    },
    {
      id: "suspect",
      title: "Suspect Information",
      content: `The suspect is described as [sex, race, approximate age] wearing [clothing description]. Additional descriptors include [hair, height, distinguishing marks]. The number of offenders is [# or unknown].`,
      fields: ["suspectAge", "clothing", "physicalDescription", "offenderCount"]
    },
    {
      id: "details",
      title: "Incident Details",
      content: `The suspect used [method/weapon/force, or none]. The victim sustained [type of injury if any, otherwise none].`,
      fields: ["forceUsed", "injuryType"]
    },
    {
      id: "property",
      title: "Property Information",
      content: `The property involved includes [list items]. The property description is [type, e.g., vehicle, wallet, firearm, ID cards]. The approximate value is [value if known, or unknown]. The loss type is [stolen, damaged, recovered, seized].`,
      fields: ["propertyItems", "propertyDescription", "propertyValue", "propertyLoss"]
    },
    {
      id: "arrest",
      title: "Arrest Information",
      content: `The offender was [arrested / not arrested]. If arrested: The offender's name is [ ], age [ ], sex [ ], race [ ], and ethnicity [ ]. The arrest type was [taken into custody / summons / on view]. The charge was [statute and description].`,
      fields: ["arrestStatus", "arrestType", "charges"]
    },
    {
      id: "conclusion",
      title: "Report Conclusion",
      content: `A body cam [ was / was not] used. This concludes my report.`,
      fields: ["bodyCam"]
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="max-w-4xl mx-auto mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      {/* Recording Controls Header - Show when recording or paused */}
      {(isRecording || isPaused) && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-blue-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {isRecording && !isPaused && (
                  <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
                )}
                <Mic className={`h-6 w-6 relative ${
                  isPaused ? 'text-amber-500' : 'text-red-500'
                }`} />
              </div>
              <div>
                <span className="text-lg font-medium text-gray-700">
                  {isPaused ? "Recording Paused" : "Recording in Progress"}
                </span>
                <div className="text-2xl font-mono font-medium text-gray-800">
                  {formatTime(recordingTime)}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {isPaused ? (
                <>
                  <Button
                    onClick={onResumeRecording}
                    variant="outline"
                    className="border-green-500 text-green-500 hover:bg-green-50"
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                  <Button
                    onClick={onStopRecording}
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-50"
                    size="sm"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={onPauseRecording}
                    variant="outline"
                    className="border-amber-500 text-amber-500 hover:bg-amber-50"
                    size="sm"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button
                    onClick={onSubmitRecording}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    Submit Recording
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
          Dictation Template Guide
          <Badge variant="outline" className={
            isPaused ? "bg-amber-100 text-amber-700" : 
            isRecording ? "bg-red-100 text-red-700" : 
            "bg-blue-100 text-blue-700"
          }>
            {isPaused ? "Paused" : isRecording ? "Live Recording" : "Ready to Record"}
          </Badge>
        </h3>
        <div className="text-sm text-blue-600">
          {isRecording || isPaused ? "Say 'review' for any field to see options" : "Start recording to begin dictation"}
        </div>
      </div>

      {/* Template Sections */}
      <div className="space-y-3">
        {templateSections.map((section) => (
          <div key={section.id} className="bg-white rounded-lg border border-blue-100">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  completedSections.has(section.id) ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <span className="font-medium text-gray-800">{section.title}</span>
              </div>
              {expandedSections.has(section.id) ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.has(section.id) && (
              <div className="px-4 pb-3">
                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  {section.content}
                </p>
                <div className="flex flex-wrap gap-2">
                  {section.fields.map((field) => (
                    <TooltipProvider key={field}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => handleReviewRequest(field)}
                            disabled={!isRecording && !isPaused}
                          >
                            {field}
                            <HelpCircle className="h-3 w-3 ml-1" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{(isRecording || isPaused) ? "Say 'review' when dictating this field" : "Start recording to use this feature"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tips Section */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800 font-medium">
          {isPaused ? (
            <>⏸️ Recording paused. Click "Resume" to continue or "Stop" to end recording.</>
          ) : isRecording ? (
            <>💡 Tip: Speak clearly and naturally. For any field you're unsure about, simply say "review" and we'll help you complete it later.</>
          ) : (
            <>💡 Tip: Click "Start Recording" above to begin dictating your report using this template as a guide.</>
          )}
        </p>
      </div>
    </div>
  );
};

export default DictationTemplate;