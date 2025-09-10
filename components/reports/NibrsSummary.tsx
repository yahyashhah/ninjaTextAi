// components/reports/sub-components/NIBRSSummary.tsx
import { ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import downloadXML from "@/lib/nibrs/downloadXML";

interface NIBRSSummaryProps {
  nibrs: any;
  xmlData: string | null;
}

const NibrsSummary = ({ nibrs, xmlData }: NIBRSSummaryProps) => {
  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <ListChecks className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-gray-800">NIBRS Summary</h3>
        </div>
        <Button onClick={() => xmlData && nibrs && downloadXML(xmlData, nibrs)} className="bg-green-600 hover:bg-green-700">
          Download NIBRS XML
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
        <div><span className="font-medium">Incident #:</span> {nibrs.incidentNumber}</div>
        <div><span className="font-medium">Date:</span> {nibrs.incidentDate} {nibrs.incidentTime ? `@ ${nibrs.incidentTime}` : ""}</div>
        <div><span className="font-medium">Offense Code:</span> {nibrs.offenseCode}</div>
        <div><span className="font-medium">Location Code:</span> {nibrs.locationCode}</div>
        {nibrs.weaponCode && <div><span className="font-medium">Weapon Code:</span> {nibrs.weaponCode}</div>}
        <div><span className="font-medium">Cleared Exceptionally:</span> {nibrs.clearedExceptionally}</div>
        {nibrs.victim?.age !== undefined && <div><span className="font-medium">Victim Age:</span> {nibrs.victim.age}</div>}
        {nibrs.victim?.sex && <div><span className="font-medium">Victim Sex:</span> {nibrs.victim.sex}</div>}
        {nibrs.offender?.age !== undefined && <div><span className="font-medium">Offender Age:</span> {nibrs.offender.age}</div>}
        {nibrs.offender?.relationshipToVictim && <div><span className="font-medium">Relationship:</span> {nibrs.offender.relationshipToVictim}</div>}
        {nibrs.property?.descriptionCode && <div><span className="font-medium">Property:</span> {nibrs.property.descriptionCode} {typeof nibrs.property.value === "number" ? `($${nibrs.property.value})` : ""}</div>}
      </div>
    </div>
  );
};

export default NibrsSummary;