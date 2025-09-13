// components/reports/sub-components/NIBRSSummary.tsx - ENHANCED
import { ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import downloadXML from "@/lib/nibrs/downloadXML";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NIBRSSummaryProps {
  nibrs: any;
  xmlData: string | null;
}

const NibrsSummary = ({ nibrs, xmlData }: NIBRSSummaryProps) => {
  // Calculate total property value
  const totalPropertyValue = nibrs.properties?.reduce((total: number, property: any) => {
    return total + (property.value || 0);
  }, 0) || 0;

  console.log("Enhanced NIBRS Data:", nibrs);

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

      {/* Basic Incident Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 mb-4">
        <div><span className="font-medium">Incident #:</span> {nibrs.incidentNumber}</div>
        <div><span className="font-medium">Date:</span> {nibrs.incidentDate} {nibrs.incidentTime ? `@ ${nibrs.incidentTime}` : ""}</div>
        <div><span className="font-medium">Location Code:</span> {nibrs.locationCode}</div>
        <div><span className="font-medium">Cleared Exceptionally:</span> {nibrs.clearedExceptionally}</div>
        {nibrs.clearedBy && <div><span className="font-medium">Cleared By:</span> {nibrs.clearedBy}</div>}
      </div>

      {/* Multiple Offenses Section */}
      {nibrs.offenses && nibrs.offenses.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Offenses ({nibrs.offenses.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {nibrs.offenses.map((offense: any, index: number) => (
              <div key={index} className="text-sm bg-white p-2 rounded border">
                <div><span className="font-medium">Code:</span> {offense.code}</div>
                <div><span className="font-medium">Description:</span> {offense.description}</div>
                <div><span className="font-medium">Status:</span> {offense.attemptedCompleted === "A" ? "Attempted" : "Completed"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multiple Victims Section */}
      {nibrs.victims && nibrs.victims.length > 0 && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Victims ({nibrs.victims.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {nibrs.victims.map((victim: any, index: number) => (
              <div key={index} className="text-sm bg-white p-2 rounded border">
                <div><span className="font-medium">Type:</span> {victim.type}</div>
                {victim.age && <div><span className="font-medium">Age:</span> {victim.age}</div>}
                {victim.sex && <div><span className="font-medium">Sex:</span> {victim.sex}</div>}
                {victim.race && <div><span className="font-medium">Race:</span> {victim.race}</div>}
                {victim.ethnicity && <div><span className="font-medium">Ethnicity:</span> {victim.ethnicity}</div>}
                {victim.injury && <div><span className="font-medium">Injury:</span> {victim.injury}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multiple Offenders Section */}
      {nibrs.offenders && nibrs.offenders.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">Offenders ({nibrs.offenders.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {nibrs.offenders.map((offender: any, index: number) => (
              <div key={index} className="text-sm bg-white p-2 rounded border">
                {offender.age && <div><span className="font-medium">Age:</span> {offender.age}</div>}
                {offender.sex && <div><span className="font-medium">Sex:</span> {offender.sex}</div>}
                {offender.race && <div><span className="font-medium">Race:</span> {offender.race}</div>}
                {offender.ethnicity && <div><span className="font-medium">Ethnicity:</span> {offender.ethnicity}</div>}
                {offender.relationshipToVictim && (
                  <div><span className="font-medium">Relationship:</span> {
                    offender.relationshipToVictim === "BU" ? "Business" :
                    offender.relationshipToVictim === "SE" ? "Stranger" :
                    offender.relationshipToVictim === "AQ" ? "Acquaintance" :
                    offender.relationshipToVictim
                  }</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multiple Arrestees Section */}
{nibrs.arrestees && nibrs.arrestees.length > 0 && (
  <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
    <h4 className="font-medium text-yellow-800 mb-2">Arrestees ({nibrs.arrestees.length})</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {nibrs.arrestees.map((arrestee: any, index: number) => (
        <div key={index} className="text-sm bg-white p-2 rounded border">
          <div><span className="font-medium">Arrest #:</span> {arrestee.sequenceNumber}</div>
          <div><span className="font-medium">Date:</span> {arrestee.arrestDate}</div>
          <div><span className="font-medium">Type:</span> {
            arrestee.arrestType === "O" ? "On-view" :
            arrestee.arrestType === "S" ? "Summoned/Cited" :
            arrestee.arrestType === "T" ? "Taken into Custody" :
            arrestee.arrestType
          }</div>
          {arrestee.age && <div><span className="font-medium">Age:</span> {arrestee.age}</div>}
          {arrestee.sex && <div><span className="font-medium">Sex:</span> {arrestee.sex}</div>}
          {arrestee.race && <div><span className="font-medium">Race:</span> {arrestee.race}</div>}
        </div>
      ))}
    </div>
  </div>
)}


      {/* Multiple Properties Section - ENHANCED */}
      {nibrs.properties && nibrs.properties.length > 0 && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
          <h4 className="font-medium text-purple-800 mb-2">Properties ({nibrs.properties.length})</h4>
          <div className="mb-2">
            <span className="font-medium">Total Value: </span>
            ${totalPropertyValue.toLocaleString()}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {nibrs.properties.map((property: any, index: number) => (
              <div key={index} className="text-sm bg-white p-3 rounded border">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="font-medium">Code:</span> {property.descriptionCode}</div>
                  <div><span className="font-medium">Loss Type:</span> {
                    property.lossType === "1" ? "Stolen" :
                    property.lossType === "5" ? "Damaged" :
                    property.lossType
                  }</div>
                </div>
                <div><span className="font-medium">Description:</span> {property.description}</div>
                {property.value && (
                  <div><span className="font-medium">Value:</span> ${property.value.toLocaleString()}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weapon Codes */}
      {nibrs.weaponCodes && nibrs.weaponCodes.length > 0 && (
        <div className="mb-4 p-3 bg-orange-50 rounded-lg">
          <h4 className="font-medium text-orange-800 mb-2">Weapons</h4>
          <div className="text-sm bg-white p-2 rounded border">
            <span className="font-medium">Codes:</span> {nibrs.weaponCodes.join(", ")}
          </div>
        </div>
      )}

      {/* Data Quality Indicator */}
      <Alert className="bg-gray-50 border-gray-200">
        <AlertDescription className="text-sm">
          <span className="font-medium">Data Summary:</span> {
            nibrs.offenses?.length > 1 ? "Multiple offenses" : "Single offense"
          }, {
            nibrs.victims?.length > 0 ? `${nibrs.victims.length} victim(s)` : "No victims"
          }, {
            nibrs.offenders?.length > 0 ? `${nibrs.offenders.length} offender(s)` : "No offenders"
          }, {
            nibrs.properties?.length > 0 ? `${nibrs.properties.length} property item(s)` : "No properties"
          }
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default NibrsSummary;