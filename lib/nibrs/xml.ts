// xml.ts - Fixed XML builder
import { NibrsExtract } from "./schema";
import { NibrsMapper } from "./mapper";
import { NIBRS_TEMPLATES } from "./templates";

// xml.ts - Enhanced XML builder
export function buildNibrsXML(data: NibrsExtract): string {
  const esc = (s?: string) =>
    s ? s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";

  // Check if any offense is victimless
  const hasVictimlessOffense = data.offenses
    .filter(offense => offense.code !== undefined)
    .some(offense => NibrsMapper.isVictimlessOffense(offense.code!));

  return `<?xml version="1.0" encoding="UTF-8"?>
<NIBRSReport xmlns="http://fbi.gov/cjis/nibrs/4.0">
  <Incident>
    <IncidentNumber>${esc(data.incidentNumber)}</IncidentNumber>
    <IncidentDate>${esc(data.incidentDate)}</IncidentDate>
    ${data.incidentTime ? `<IncidentTime>${esc(data.incidentTime)}</IncidentTime>` : ""}
    <ClearedExceptionally>${esc(data.clearedExceptionally)}</ClearedExceptionally>
    ${data.clearedBy ? `<ClearedBy>${esc(data.clearedBy)}</ClearedBy>` : ""}
    ${data.exceptionalClearanceDate ? `<ExceptionalClearanceDate>${esc(data.exceptionalClearanceDate)}</ExceptionalClearanceDate>` : ""}

    <!-- Multiple Offenses -->
    ${data.offenses.map(offense => `
    <Offense>
      <OffenseCode>${esc(offense.code)}</OffenseCode>
      <AttemptedCompleted>${esc(offense.attemptedCompleted)}</AttemptedCompleted>
      <LocationCode>${esc(data.locationCode)}</LocationCode>
      ${data.weaponCodes && data.weaponCodes.length > 0 ? 
        data.weaponCodes.map(weapon => `<WeaponCode>${esc(weapon)}</WeaponCode>`).join('') : ""}
      ${data.biasMotivationCode ? `<BiasMotivation>${esc(data.biasMotivationCode)}</BiasMotivation>` : ""}
    </Offense>`).join('')}

    ${!hasVictimlessOffense && data.victims && data.victims.length > 0 ? 
      data.victims.map(victim => `
    <Victim>
      ${victim.type ? `<VictimType>${esc(victim.type)}</VictimType>` : ""}
      ${victim.age !== undefined ? `<Age>${victim.age}</Age>` : ""}
      ${victim.sex ? `<Sex>${esc(victim.sex)}</Sex>` : ""}
      ${victim.race ? `<Race>${esc(victim.race)}</Race>` : ""}
      ${victim.ethnicity ? `<Ethnicity>${esc(victim.ethnicity)}</Ethnicity>` : ""}
      ${victim.injury ? `<Injury>${esc(victim.injury)}</Injury>` : ""}
    </Victim>`).join('') : ""}

    ${data.offenders && data.offenders.length > 0 ? 
      data.offenders.map(offender => `
    <Offender>
      ${offender.age !== undefined ? `<Age>${offender.age}</Age>` : ""}
      ${offender.sex ? `<Sex>${esc(offender.sex)}</Sex>` : ""}
      ${offender.race ? `<Race>${esc(offender.race)}</Race>` : ""}
      ${offender.ethnicity ? `<Ethnicity>${esc(offender.ethnicity)}</Ethnicity>` : ""}
      ${!hasVictimlessOffense && offender.relationshipToVictim ? `<RelationshipToVictim>${esc(offender.relationshipToVictim)}</RelationshipToVictim>` : ""}
    </Offender>`).join('') : ""}

    <!-- Multiple Properties with Enhanced Details -->
    ${data.properties && data.properties.length > 0 ? 
      data.properties.map(property => `
    <Property>
      ${property.lossType ? `<LossType>${esc(property.lossType)}</LossType>` : ""}
      ${property.descriptionCode ? `<DescriptionCode>${esc(property.descriptionCode)}</DescriptionCode>` : ""}
      ${property.description ? `<Description>${esc(property.description)}</Description>` : ""}
      ${typeof property.value === "number" ? `<Value>${property.value}</Value>` : ""}
      <!-- MappingConfidence is not defined on the property object, so this line is removed -->
    </Property>`).join('') : ""}

    <!-- Arrestee Segment -->
    ${data.arrestees && data.arrestees.length > 0 ? 
      data.arrestees.map(arrestee => `
    <Arrestee>
      <SequenceNumber>${arrestee.sequenceNumber}</SequenceNumber>
      <ArrestDate>${esc(arrestee.arrestDate)}</ArrestDate>
      ${arrestee.arrestTime ? `<ArrestTime>${esc(arrestee.arrestTime)}</ArrestTime>` : ""}
      <ArrestType>${esc(arrestee.arrestType)}</ArrestType>
      ${arrestee.age !== undefined ? `<Age>${arrestee.age}</Age>` : ""}
      ${arrestee.sex ? `<Sex>${esc(arrestee.sex)}</Sex>` : ""}
      ${arrestee.race ? `<Race>${esc(arrestee.race)}</Race>` : ""}
      ${arrestee.ethnicity ? `<Ethnicity>${esc(arrestee.ethnicity)}</Ethnicity>` : ""}
      ${arrestee.residentCode ? `<ResidentCode>${esc(arrestee.residentCode)}</ResidentCode>` : ""}
      ${arrestee.clearanceCode ? `<ClearanceCode>${esc(arrestee.clearanceCode)}</ClearanceCode>` : ""}
    </Arrestee>`).join('') : ""}

    <Narrative>${esc(data.narrative)}</Narrative>
  </Incident>
</NIBRSReport>`;
}