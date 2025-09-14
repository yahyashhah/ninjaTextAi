// xml.ts - Fixed XML builder
import { NibrsExtract, NibrsSegments } from "./schema";
import { NibrsMapper } from "./mapper";
import { NIBRS_TEMPLATES } from "./templates";

// xml.ts - Enhanced XML builder
export function buildNIBRSXML(data: NibrsSegments): string {
  const esc = (s?: string) => 
    s ? s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<nibrs:NIBRSReport xmlns:nibrs="http://fbi.gov/cjis/nibrs/4.0" xmlns:j="http://fbi.gov/cjis/jxdm/3.0.3">
  <nibrs:Incident>
    <!-- Administrative Segment -->
    <nibrs:IncidentNumber>${esc(data.administrative.incidentNumber)}</nibrs:IncidentNumber>
    <nibrs:IncidentDate>${esc(data.administrative.incidentDate)}</nibrs:IncidentDate>
    ${data.administrative.incidentTime ? `<nibrs:IncidentTime>${esc(data.administrative.incidentTime)}</nibrs:IncidentTime>` : ''}
    <nibrs:ClearedExceptionally>${esc(data.administrative.clearedExceptionally)}</nibrs:ClearedExceptionally>
    ${data.administrative.clearedBy ? `<nibrs:ClearedBy>${esc(data.administrative.clearedBy)}</nibrs:ClearedBy>` : ''}

    <!-- Offense Segments -->
    ${data.offenses.map(offense => `
    <nibrs:Offense>
      <nibrs:OffenseCode>${esc(offense.code)}</nibrs:OffenseCode>
      <nibrs:AttemptedCompleted>${esc(offense.attemptedCompleted)}</nibrs:AttemptedCompleted>
      <nibrs:OffenseSequenceNumber>${offense.sequenceNumber}</nibrs:OffenseSequenceNumber>
    </nibrs:Offense>`).join('')}

    <!-- Property Segments -->
    ${data.properties ? data.properties.map(property => `
    <nibrs:Property>
      <nibrs:PropertySequenceNumber>${property.sequenceNumber}</nibrs:PropertySequenceNumber>
      <nibrs:PropertyDescriptionCode>${esc(property.descriptionCode)}</nibrs:PropertyDescriptionCode>
      <nibrs:PropertyLossCode>${esc(property.lossType)}</nibrs:PropertyLossCode>
      ${property.value ? `<nibrs:PropertyValue>${property.value}</nibrs:PropertyValue>` : ''}
      ${property.description ? `<nibrs:PropertyDescriptionText>${esc(property.description)}</nibrs:PropertyDescriptionText>` : ''}
      ${property.seized ? `<nibrs:PropertySeizedCode>Y</nibrs:PropertySeizedCode>` : ''}
      ${property.drugMeasurement ? `<nibrs:DrugMeasurementCode>${esc(property.drugMeasurement)}</nibrs:DrugMeasurementCode>` : ''}
      ${property.drugQuantity ? `<nibrs:DrugQuantity>${property.drugQuantity}</nibrs:DrugQuantity>` : ''}
    </nibrs:Property>`).join('') : ''}

    <!-- Victim Segments -->
    ${data.victims ? data.victims.map(victim => `
    <nibrs:Victim>
      <nibrs:VictimSequenceNumber>${victim.sequenceNumber}</nibrs:VictimSequenceNumber>
      <nibrs:VictimTypeCode>${esc(victim.type)}</nibrs:VictimTypeCode>
      ${victim.age ? `<nibrs:VictimAge>${victim.age}</nibrs:VictimAge>` : ''}
      ${victim.sex ? `<nibrs:VictimSexCode>${esc(victim.sex)}</nibrs:VictimSexCode>` : ''}
      ${victim.race ? `<nibrs:VictimRaceCode>${esc(victim.race)}</nibrs:VictimRaceCode>` : ''}
      ${victim.ethnicity ? `<nibrs:VictimEthnicityCode>${esc(victim.ethnicity)}</nibrs:VictimEthnicityCode>` : ''}
      ${victim.injury ? `<nibrs:VictimInjuryCode>${esc(victim.injury)}</nibrs:VictimInjuryCode>` : ''}
    </nibrs:Victim>`).join('') : ''}

    <!-- Arrestee Segments -->
    ${data.arrestees ? data.arrestees.map(arrestee => `
    <nibrs:Arrestee>
      <nibrs:ArresteeSequenceNumber>${arrestee.sequenceNumber}</nibrs:ArresteeSequenceNumber>
      <nibrs:ArrestDate>${esc(arrestee.arrestDate)}</nibrs:ArrestDate>
      ${arrestee.arrestTime ? `<nibrs:ArrestTime>${esc(arrestee.arrestTime)}</nibrs:ArrestTime>` : ''}
      <nibrs:ArrestTypeCode>${esc(arrestee.arrestType)}</nibrs:ArrestTypeCode>
      ${arrestee.age ? `<nibrs:ArresteeAge>${arrestee.age}</nibrs:ArresteeAge>` : ''}
      ${arrestee.sex ? `<nibrs:ArresteeSexCode>${esc(arrestee.sex)}</nibrs:ArresteeSexCode>` : ''}
      ${arrestee.race ? `<nibrs:ArresteeRaceCode>${esc(arrestee.race)}</nibrs:ArresteeRaceCode>` : ''}
      ${arrestee.ethnicity ? `<nibrs:ArresteeEthnicityCode>${esc(arrestee.ethnicity)}</nibrs:ArresteeEthnicityCode>` : ''}
      ${arrestee.offenseCodes ? arrestee.offenseCodes.map(code => `
        <nibrs:ArresteeOffenseCode>${esc(code)}</nibrs:ArresteeOffenseCode>`).join('') : ''}
    </nibrs:Arrestee>`).join('') : ''}

    <nibrs:Narrative>${esc(data.narrative)}</nibrs:Narrative>
  </nibrs:Incident>
</nibrs:NIBRSReport>`;
}