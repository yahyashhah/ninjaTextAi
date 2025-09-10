import { NibrsExtract } from "./schema";
import { NibrsMapper } from "./mapper";
import { NIBRS_TEMPLATES } from "./templates"; // Add this import

export function buildNibrsXML(data: NibrsExtract): string {
  const esc = (s?: string) =>
    s ? s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";

  // Get template or use default
  const template = NIBRS_TEMPLATES[data.offenseCode] || NIBRS_TEMPLATES.default;
  const isVictimless = template?.isVictimless || NibrsMapper.isVictimlessOffense(data.offenseCode);

  return `<?xml version="1.0" encoding="UTF-8"?>
<NIBRSReport xmlns="http://fbi.gov/cjis/nibrs/4.0">
  <Incident>
    <IncidentNumber>${esc(data.incidentNumber)}</IncidentNumber>
    <IncidentDate>${esc(data.incidentDate)}</IncidentDate>
    ${data.incidentTime ? `<IncidentTime>${esc(data.incidentTime)}</IncidentTime>` : ""}
    <ClearedExceptionally>${esc(data.clearedExceptionally)}</ClearedExceptionally>
    ${data.clearedBy ? `<ClearedBy>${esc(data.clearedBy)}</ClearedBy>` : ""}
    ${data.exceptionalClearanceDate ? `<ExceptionalClearanceDate>${esc(data.exceptionalClearanceDate)}</ExceptionalClearanceDate>` : ""}

    <Offense>
      <OffenseCode>${esc(data.offenseCode)}</OffenseCode>
      <AttemptedCompleted>${esc(data.offenseAttemptedCompleted)}</AttemptedCompleted>
      <LocationCode>${esc(data.locationCode)}</LocationCode>
      ${data.weaponCode ? `<WeaponCode>${esc(data.weaponCode)}</WeaponCode>` : ""}
      ${data.biasMotivationCode ? `<BiasMotivation>${esc(data.biasMotivationCode)}</BiasMotivation>` : ""}
    </Offense>

    ${!isVictimless && data.victim ? `
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
      ${!isVictimless && data.offender.relationshipToVictim ? `<RelationshipToVictim>${esc(data.offender.relationshipToVictim)}</RelationshipToVictim>` : ""}
    </Offender>` : ""}

    ${data.property ? `
    <Property>
      ${data.property.lossType ? `<LossType>${esc(data.property.lossType)}</LossType>` : ""}
      ${data.property.descriptionCode ? `<DescriptionCode>${esc(data.property.descriptionCode)}</DescriptionCode>` : ""}
      ${typeof data.property.value === "number" ? `<Value>${data.property.value}</Value>` : ""}
    </Property>` : ""}

    ${(data as any).properties ? (data as any).properties.map((prop: any) => `
    <Property>
      ${prop.lossType ? `<LossType>${esc(prop.lossType)}</LossType>` : ""}
      ${prop.descriptionCode ? `<DescriptionCode>${esc(prop.descriptionCode)}</DescriptionCode>` : ""}
      ${typeof prop.value === "number" ? `<Value>${prop.value}</Value>` : ""}
    </Property>`).join('') : ""}

    ${(data as any).evidence ? `
    <Evidence>
      <Description>${esc((data as any).evidence.description)}</Description>
      ${typeof (data as any).evidence.value === "number" ? `<Value>${(data as any).evidence.value}</Value>` : ""}
    </Evidence>` : ""}

    <Narrative>${esc(data.narrative)}</Narrative>
  </Incident>
</NIBRSReport>`;
}