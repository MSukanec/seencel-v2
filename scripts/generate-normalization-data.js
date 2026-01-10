const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, '..', 'public', 'test-data');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to write file
const writeExcel = (filename, data) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hoja1");
    XLSX.writeFile(wb, path.join(outputDir, filename));
    console.log(`Generated: ${filename}`);
};

// 5. Normalization Test
const normalizationData = [
    { Nombre: " Juan ", Email: "  JUAN@gmail.COM ", Teléfono: "011-4444-5555", Empresa: "  Space  Inc  ", Notas: "  Trim me  " },
    { Nombre: "Maria", Email: "Maria.Gomez@HOTMAIL.com", Teléfono: "+54 9 11 1234 5678", Empresa: "Clean Corp", Notas: "Ok" },
    { Nombre: "Pedro", Email: "pedro@yahoo", Teléfono: "abc-123-def", Empresa: "Bad Phone", Notas: "Phone should be 123" },
    { Nombre: "Lucia", Email: "lucia@domain.com", Teléfono: "(011) 15-5555-6666", Empresa: "Format Phone", Notas: "Classic format" }
];
writeExcel('Contactos - Normalizacion.xlsx', normalizationData);
