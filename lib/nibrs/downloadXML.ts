// lib/nibrs/downloadXML.ts
const downloadXML = (xmlData: string, nibrs: any) => {
  const blob = new Blob([xmlData], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  // Use incident number for filename, fallback to timestamp
  const fileName = nibrs.incidentNumber 
    ? `NIBRS_${nibrs.incidentNumber}.xml`
    : `NIBRS_${Date.now()}.xml`;
  
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default downloadXML;