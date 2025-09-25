// components/reports/sub-components/NIBRSSummary.tsx - ENHANCED FOR RAG
import { ListChecks, User, ShieldAlert, Package, MapPin, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import downloadXML from "@/lib/nibrs/downloadXML";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface NIBRSSummaryProps {
  nibrs: any;
  xmlData: string | null;
}

const NibrsSummary = ({ nibrs, xmlData }: NIBRSSummaryProps) => {
  // Calculate total property value
  const totalPropertyValue = nibrs.properties?.reduce((total: number, property: any) => {
    return total + (property.value || 0);
  }, 0) || 0;

  console.log("Enhanced NIBRS Data from RAG:", nibrs);

  // Helper function to format arrest type
  const formatArrestType = (type: string) => {
    const typeMap: Record<string, string> = {
      "O": "On-view Arrest",
      "S": "Summoned/Cited", 
      "T": "Taken into Custody",
      "A": "Arrested"
    };
    return typeMap[type] || type;
  };

  // Helper function to format victim type
  const formatVictimType = (type: string) => {
    const typeMap: Record<string, string> = {
      "I": "Individual",
      "B": "Business",
      "S": "Society/Public",
      "R": "Property Owner",
      "O": "Other"
    };
    return typeMap[type] || type;
  };

  return (
    <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ListChecks className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-gray-800 text-lg">NIBRS Report Summary</h3>
          {nibrs.metadata?.source === "rag" && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              RAG Enhanced
            </Badge>
          )}
        </div>
        <Button onClick={() => xmlData && nibrs && downloadXML(xmlData, nibrs)} className="bg-green-600 hover:bg-green-700">
          Download NIBRS XML
        </Button>
      </div>

      {/* Enhanced Administrative Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-2">
          <div><span className="font-medium">Incident #:</span> {nibrs.administrative?.incidentNumber}</div>
          <div><span className="font-medium">Date:</span> {nibrs.administrative?.incidentDate}</div>
          <div><span className="font-medium">Time:</span> {nibrs.administrative?.incidentTime || "Unknown"}</div>
        </div>
        <div className="space-y-2">
          <div><span className="font-medium">Location Code:</span> {nibrs.locationCode}</div>
          <div><span className="font-medium">Cleared Exceptionally:</span> {nibrs.administrative?.clearedExceptionally}</div>
          <div><span className="font-medium">Cargo Involved:</span> {nibrs.administrative?.cargoPropertyInvolved || "Unknown"}</div>
        </div>
        <div className="space-y-2">
          {nibrs.administrative?.clearedBy && (
            <div><span className="font-medium">Cleared By:</span> {nibrs.administrative.clearedBy}</div>
          )}
          <div><span className="font-medium">Total Properties:</span> {nibrs.properties?.length || 0}</div>
          <div><span className="font-medium">Total Value:</span> ${totalPropertyValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Offense Summary Section - ENHANCED */}
      {nibrs.offenses && nibrs.offenses.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border">
          <div className="flex items-center space-x-2 mb-3">
            <ShieldAlert className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-blue-800">Offenses ({nibrs.offenses.length})</h4>
          </div>
          
          {/* Offense Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {nibrs.offenses.map((offense: any, index: number) => (
              <div key={index} className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {offense.code}
                  </Badge>
                  <Badge variant={offense.nibrsReportable === "Y" ? "default" : "secondary"} 
                         className={offense.nibrsReportable === "Y" ? "bg-green-100 text-green-800" : "bg-gray-100"}>
                    {offense.nibrsReportable === "Y" ? "Reportable" : "Not Reportable"}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="font-medium text-sm">{offense.description}</div>
                  {offense.offenseCategory && (
                    <div className="text-xs text-gray-600">Category: {offense.offenseCategory}</div>
                  )}
                  <div className="text-xs">
                    Status: <span className={offense.attemptedCompleted === "C" ? "text-green-600" : "text-orange-600"}>
                      {offense.attemptedCompleted === "A" ? "Attempted" : "Completed"}
                    </span>
                  </div>
                  
                  {/* Enhanced offense details */}
                  {offense.locationDescription && (
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {offense.locationDescription}
                    </div>
                  )}
                  
                  {offense.weaponForceUsed && offense.weaponForceUsed !== "None" && (
                    <div className="flex items-center text-xs text-gray-500">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Weapon: {offense.weaponForceUsed}
                    </div>
                  )}
                  
                  {offense.notes && (
                    <div className="text-xs text-gray-500 mt-1 italic">Notes: {offense.notes}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Victim Section */}
      {nibrs.victims && nibrs.victims.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border">
          <div className="flex items-center space-x-2 mb-3">
            <User className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-green-800">Victims ({nibrs.victims.length})</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nibrs.victims.map((victim: any, index: number) => (
              <div key={index} className="bg-white p-3 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    {formatVictimType(victim.type)}
                  </Badge>
                  {victim.victimId && (
                    <span className="text-xs text-gray-500">ID: {victim.victimId}</span>
                  )}
                </div>
                
                <div className="space-y-2">
                  {victim.name && victim.name !== "Unknown" && (
                    <div><span className="font-medium">Name:</span> {victim.name}</div>
                  )}
                  
                  {victim.role && (
                    <div><span className="font-medium">Role:</span> {victim.role}</div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {victim.age && <div><span className="font-medium">Age:</span> {victim.age}</div>}
                    {victim.sex && victim.sex !== "U" && <div><span className="font-medium">Sex:</span> {victim.sex}</div>}
                    {victim.race && victim.race !== "U" && <div><span className="font-medium">Race:</span> {victim.race}</div>}
                    {victim.ethnicity && victim.ethnicity !== "U" && <div><span className="font-medium">Ethnicity:</span> {victim.ethnicity}</div>}
                  </div>
                  
                  {victim.injuryDescription && victim.injuryDescription !== "None" && (
                    <div className="mt-2 p-2 bg-red-50 rounded border">
                      <span className="font-medium">Injury:</span> {victim.injuryDescription}
                      {victim.injuryCode && <span className="text-xs text-gray-500 ml-2">(Code: {victim.injuryCode})</span>}
                    </div>
                  )}
                  
                  {victim.offenseConnected && (
                    <div className="text-xs text-gray-500">
                      Connected to: {victim.offenseConnected}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Property Section */}
      {nibrs.properties && nibrs.properties.length > 0 && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border">
          <div className="flex items-center space-x-2 mb-3">
            <Package className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold text-purple-800">Property Evidence ({nibrs.properties.length})</h4>
          </div>
          
          <div className="mb-3 p-3 bg-white rounded border">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Property Value:</span>
              <span className="text-lg font-bold text-purple-600">${totalPropertyValue.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {nibrs.properties.map((property: any, index: number) => (
              <div key={index} className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={property.seized ? "default" : "secondary"} 
                         className={property.seized ? "bg-purple-100 text-purple-800" : "bg-gray-100"}>
                    {property.seized ? "Seized" : "Not Seized"}
                  </Badge>
                  {property.value > 0 && (
                    <span className="font-medium text-green-600">${property.value.toLocaleString()}</span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Description:</span> {property.description}
                    {property.propertyTypeDescription && (
                      <span className="text-xs text-gray-500 ml-2">({property.propertyTypeDescription})</span>
                    )}
                  </div>
                  
                  {property.itemDetails && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Details:</span> {property.itemDetails}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Code:</span> {property.descriptionCode}</div>
                    <div><span className="font-medium">Loss Type:</span> {property.lossType}</div>
                    {property.currency && property.currency !== "Unknown" && (
                      <div><span className="font-medium">Currency:</span> {property.currency}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Arrestee Section */}
      {nibrs.arrestees && nibrs.arrestees.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h4 className="font-semibold text-yellow-800">Arrest Information ({nibrs.arrestees.length})</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nibrs.arrestees.map((arrestee: any, index: number) => (
              <div key={index} className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    Arrest #{arrestee.sequenceNumber}
                  </Badge>
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    {formatArrestType(arrestee.arrestType)}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {arrestee.name && arrestee.name !== "Unknown" && (
                    <div className="font-medium text-lg">{arrestee.name}</div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Arrest Date:</span> {arrestee.arrestDate}</div>
                    {arrestee.arrestTime && <div><span className="font-medium">Time:</span> {arrestee.arrestTime}</div>}
                    {arrestee.age && <div><span className="font-medium">Age:</span> {arrestee.age}</div>}
                    {arrestee.sex && <div><span className="font-medium">Sex:</span> {arrestee.sex}</div>}
                  </div>
                  
                  {arrestee.arrestTypeDescription && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Type:</span> {arrestee.arrestTypeDescription}
                    </div>
                  )}
                  
                  {arrestee.offenseArrestDescription && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <span className="font-medium">Charges:</span> {arrestee.offenseArrestDescription}
                    </div>
                  )}
                  
                  {arrestee.offenseCodes && arrestee.offenseCodes.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Offense Codes: {arrestee.offenseCodes.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offender Section (if no arrestees but offenders exist) */}
      {(!nibrs.arrestees || nibrs.arrestees.length === 0) && nibrs.offenders && nibrs.offenders.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border">
          <div className="flex items-center space-x-2 mb-3">
            <User className="h-5 w-5 text-red-600" />
            <h4 className="font-semibold text-red-800">Offenders ({nibrs.offenders.length})</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nibrs.offenders.map((offender: any, index: number) => (
              <div key={index} className="bg-white p-3 rounded-lg border">
                {offender.name && offender.name !== "Unknown" && (
                  <div className="font-medium mb-2">{offender.name}</div>
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {offender.age && <div><span className="font-medium">Age:</span> {offender.age}</div>}
                  {offender.sex && <div><span className="font-medium">Sex:</span> {offender.sex}</div>}
                  {offender.race && <div><span className="font-medium">Race:</span> {offender.race}</div>}
                  {offender.ethnicity && <div><span className="font-medium">Ethnicity:</span> {offender.ethnicity}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Summary */}
      <Alert className="bg-gray-50 border-gray-200">
        <AlertDescription className="text-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><span className="font-medium">Offenses:</span> {nibrs.offenses?.length || 0}</div>
            <div><span className="font-medium">Victims:</span> {nibrs.victims?.length || 0}</div>
            <div><span className="font-medium">Arrestees:</span> {nibrs.arrestees?.length || 0}</div>
            <div><span className="font-medium">Properties:</span> {nibrs.properties?.length || 0}</div>
          </div>
          {nibrs.metadata?.source === "rag" && (
            <div className="mt-2 text-xs text-blue-600">
              ✓ Enhanced with NIBRS manual knowledge via RAG
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default NibrsSummary;