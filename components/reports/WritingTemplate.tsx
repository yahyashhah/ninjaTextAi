// components/reports/sub-components/WritingTemplate.tsx
import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { OffenseType } from "@/constants/offences";

interface WritingTemplateProps {
  isVisible: boolean;
  onInsertSnippet: (snippet: string) => void;
  onFieldHelp: (fieldName: string, options: string[]) => void;
  offenseTypes?: OffenseType[] | null; // Added
}

const WritingTemplate = ({ isVisible, onInsertSnippet, onFieldHelp,  }: WritingTemplateProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["incident", "victim", "offense"]));
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
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

  const handleCopySnippet = (snippet: string) => {
    onInsertSnippet(snippet);
    setCopiedSnippet(snippet);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleFieldHelp = (fieldName: string) => {
    const fieldOptions = {
      incidentType: ["Burglary", "Assault", "Theft", "Robbery", "Vandalism", "Domestic Violence", "Drug Offense", "Traffic Incident", "Other"],
      victimGender: ["Male", "Female", "Unknown"],
      race: ["White", "Black", "Asian", "Native American", "Pacific Islander", "Unknown"],
      ethnicity: ["Hispanic/Latino", "Non-Hispanic", "Unknown"],
      relationship: ["Stranger", "Acquaintance", "Family Member", "Spouse/Partner", "Neighbor", "Coworker", "Unknown"],
      offenseStatus: ["Attempted", "Completed"],
      injuryType: ["None", "Minor", "Serious", "Fatal"],
      forceUsed: ["None", "Physical", "Weapon", "Threat", "Coercion"],
      propertyLoss: ["Stolen", "Damaged", "Recovered", "Seized"],
      arrestStatus: ["Arrested", "Not Arrested", "Summons", "Warrant"],
      bodyCam: ["Was used", "Was not used"],
      location: ["Residence", "Business", "Street", "Park", "School", "Vehicle", "Other"],
      victimName: ["Unknown", "Withheld"],
      victimAge: ["Unknown", "Adult", "Juvenile", "Elderly"],
      suspectAge: ["Unknown", "Teenager", "Adult", "Elderly"],
      statute: ["Unknown", "To be determined"],
      offenseDescription: ["Unknown", "To be specified"],
      clothing: ["Unknown", "Dark clothing", "Light clothing", "Uniform", "Casual"],
      physicalDescription: ["Unknown", "Average build", "Tall", "Short", "Muscular", "Slender"],
      offenderCount: ["Unknown", "One", "Two", "Three", "Multiple"],
      propertyItems: ["Unknown", "Electronics", "Jewelry", "Cash", "Documents", "Vehicle"],
      propertyDescription: ["Unknown", "Personal items", "Valuables", "Evidence"],
      propertyValue: ["Unknown", "Under $100", "$100-$500", "$500-$1000", "Over $1000"],
      arrestType: ["Taken into custody", "Summons", "On view", "Warrant"],
      charges: ["Unknown", "To be determined"]
    };
    onFieldHelp(fieldName, fieldOptions[fieldName as keyof typeof fieldOptions] || ["Unknown", "Not specified"]);
  };

  const templateSections = [
    {
      id: "incident",
      title: "Incident Details",
      content: `Today is [${currentDate}] at approximately [${currentTime}]. I was dispatched to [address / business name] in reference to [type of incident].`,
      fields: ["location", "incidentType"],
      snippets: [
        `Today is ${currentDate} at approximately ${currentTime}. I was dispatched to `,
        ` in reference to `,
        `. Upon arrival, I observed `
      ]
    },
    {
      id: "victim",
      title: "Victim Information",
      content: `Upon arrival, I made contact with [victim name]. The victim is a [age]-year-old [male/female]. The victim's race is [race if known, otherwise unknown], and ethnicity [if known]. The relationship between the victim and offender is [relationship if known, otherwise unknown].`,
      fields: ["victimName", "victimAge", "victimGender", "race", "ethnicity", "relationship"],
      snippets: [
        `Upon arrival, I made contact with `,
        `The victim is a `,
        `-year-old `,
        `. The victim stated that `
      ]
    },
    {
      id: "offense",
      title: "Offense Description",
      content: `The victim reported that [describe what happened, including actions by offender(s)]. The offense involved is [statute number if known], which is classified as [offense description]. The offense was [attempted/completed].`,
      fields: ["statute", "offenseDescription", "offenseStatus"],
      snippets: [
        `The victim reported that the suspect `,
        `The offense involved is `,
        `, which is classified as `,
        `. The offense was `
      ]
    },
    {
      id: "suspect",
      title: "Suspect Information",
      content: `The suspect is described as [sex, race, approximate age] wearing [clothing description]. Additional descriptors include [hair, height, distinguishing marks]. The number of offenders is [# or unknown].`,
      fields: ["suspectAge", "clothing", "physicalDescription", "offenderCount"],
      snippets: [
        `The suspect is described as `,
        ` wearing `,
        `. Additional descriptors include `,
        `The number of offenders is `
      ]
    },
    {
      id: "details",
      title: "Incident Details",
      content: `The suspect used [method/weapon/force, or none]. The victim sustained [type of injury if any, otherwise none].`,
      fields: ["forceUsed", "injuryType"],
      snippets: [
        `The suspect used `,
        `The victim sustained `,
        ` during the incident.`
      ]
    },
    {
      id: "property",
      title: "Property Information",
      content: `The property involved includes [list items]. The property description is [type, e.g., vehicle, wallet, firearm, ID cards]. The approximate value is [value if known, or unknown]. The loss type is [stolen, damaged, recovered, seized].`,
      fields: ["propertyItems", "propertyDescription", "propertyValue", "propertyLoss"],
      snippets: [
        `The property involved includes `,
        `The property description is `,
        ` with an approximate value of `,
        `. The loss type is `
      ]
    },
    {
      id: "arrest",
      title: "Arrest Information",
      content: `The offender was [arrested / not arrested]. If arrested: The offender's name is [ ], age [ ], sex [ ], race [ ], and ethnicity [ ]. The arrest type was [taken into custody / summons / on view]. The charge was [statute and description].`,
      fields: ["arrestStatus", "arrestType", "charges"],
      snippets: [
        `The offender was `,
        `The arrest type was `,
        `. The charge was `,
        `This concludes my report.`
      ]
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="max-w-4xl mx-auto mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
      {/* Template Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
          Writing Template Guide
          <Badge variant="outline" className="bg-green-100 text-green-700">
            Text Input Mode
          </Badge>
        </h3>
        <div className="text-sm text-green-600">
          Click snippets to insert or get help with fields
        </div>
      </div>

      {/* Template Sections */}
      <div className="space-y-3">
        {templateSections.map((section) => (
          <div key={section.id} className="bg-white rounded-lg border border-green-100">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-green-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
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
                {/* Section Content */}
                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  {section.content}
                </p>
                
                {/* Quick Snippets */}
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">QUICK INSERT:</h4>
                  <div className="flex flex-wrap gap-2">
                    {section.snippets.map((snippet, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 bg-green-50 border-green-200 hover:bg-green-100"
                        onClick={() => handleCopySnippet(snippet)}
                      >
                        {copiedSnippet === snippet ? (
                          <Check className="h-3 w-3 mr-1 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3 mr-1" />
                        )}
                        {snippet.length > 20 ? snippet.substring(0, 20) + '...' : snippet}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Field Help */}
                <div className="flex flex-wrap gap-2">
                  {section.fields.map((field) => (
                    <TooltipProvider key={field}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => handleFieldHelp(field)}
                          >
                            {field}
                            <HelpCircle className="h-3 w-3 ml-1" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Get help with {field} options</p>
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

      {/* Writing Tips */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800 font-medium">
          💡 Tip: Click on snippets to quickly insert common phrases. Use field buttons to get help with specific options.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mt-3 flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => handleCopySnippet(`On ${currentDate} at approximately ${currentTime}, I was dispatched to the above location.`)}
        >
          <Copy className="h-3 w-3 mr-1" />
          Insert Date/Time
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => handleCopySnippet('Upon arrival, I made contact with the victim who stated the following: ')}
        >
          <Copy className="h-3 w-3 mr-1" />
          Victim Statement
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => handleCopySnippet('This report is based on my observations and information provided by the victim.')}
        >
          <Copy className="h-3 w-3 mr-1" />
          Conclusion
        </Button>
      </div>
    </div>
  );
};

export default WritingTemplate;