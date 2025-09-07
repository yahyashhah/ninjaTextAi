const downloadXML = (xmlData: string, nibrs: { incidentNumber?: string }) => {
  if (!xmlData) return;
  const blob = new Blob([xmlData], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nibrs-incident-${nibrs?.incidentNumber || "report"}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default downloadXML;