import { NibrsExtract } from "./schema";

// Generates a basic NIBRS-like XML. Adapt tags/namespace to your state program spec if needed.
export function buildNibrsXML(data: NibrsExtract): string {
  const esc = (s?: string) =>
    s ? s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<NIBRSSubmission>
  <Incident>
    <IncidentNumber>${esc(data.incidentNumber)}</IncidentNumber>
    <IncidentDate>${esc(data.incidentDate)}</IncidentDate>
    ${data.incidentTime ? `<IncidentTime>${esc(data.incidentTime)}</IncidentTime>` : ""}
    <ClearedExceptionally>${esc(data.clearedExceptionally)}</ClearedExceptionally>
    ${data.exceptionalClearanceDate ? `<ExceptionalClearanceDate>${esc(data.exceptionalClearanceDate)}</ExceptionalClearanceDate>` : ""}

    <Offense>
      <OffenseCode>${esc(data.offenseCode)}</OffenseCode>
      <AttemptedCompleted>${esc(data.offenseAttemptedCompleted)}</AttemptedCompleted>
      <LocationCode>${esc(data.locationCode)}</LocationCode>
      ${data.weaponCode ? `<WeaponCode>${esc(data.weaponCode)}</WeaponCode>` : ""}
      ${data.biasMotivationCode ? `<BiasMotivation>${esc(data.biasMotivationCode)}</BiasMotivation>` : ""}
    </Offense>

    ${data.victim ? `
    <Victim>
      ${data.victim.type ? `<VictimType>${esc(data.victim.type)}</VictimType>` : ""}
      ${data.victim.age !== undefined ? `<Age>${data.victim.age}</Age>` : ""}
      ${data.victim.sex ? `<Sex>${esc(data.victim.sex)}</Sex>` : ""}
      ${data.victim.race ? `<Race>${esc(data.victim.race)}</Race>` : ""}
      ${data.victim.ethnicity ? `<Ethnicity>${esc(data.victim.ethnicity)}</Ethnicity>` : ""}
      ${data.victim.injury ? `<Injury>${esc(data.victim.injury)}</Injury>` : ""}
    </Victim>` : ""}

    ${data.offender ? `
    <Offender>
      ${data.offender.age !== undefined ? `<Age>${data.offender.age}</Age>` : ""}
      ${data.offender.sex ? `<Sex>${esc(data.offender.sex)}</Sex>` : ""}
      ${data.offender.race ? `<Race>${esc(data.offender.race)}</Race>` : ""}
      ${data.offender.ethnicity ? `<Ethnicity>${esc(data.offender.ethnicity)}</Ethnicity>` : ""}
      ${data.offender.relationshipToVictim ? `<RelationshipToVictim>${esc(data.offender.relationshipToVictim)}</RelationshipToVictim>` : ""}
    </Offender>` : ""}

    ${data.property ? `
    <Property>
      ${data.property.lossType ? `<LossType>${esc(data.property.lossType)}</LossType>` : ""}
      ${data.property.descriptionCode ? `<DescriptionCode>${esc(data.property.descriptionCode)}</DescriptionCode>` : ""}
      ${typeof data.property.value === "number" ? `<Value>${data.property.value}</Value>` : ""}
    </Property>` : ""}

    <Narrative>${esc(data.narrative)}</Narrative>
  </Incident>
</NIBRSSubmission>`;
}