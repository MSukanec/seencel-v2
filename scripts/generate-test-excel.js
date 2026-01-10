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

// 1. Contactos - Ordenado
const ordenadoData = [
    { Nombre: "Ana", Apellido: "García", Email: "ana.garcia@gmail.com", Telefono: "+5491112345678", Empresa: "Tech Solutions", Ubicacion: "Buenos Aires", Notas: "Cliente VIP", Tipo: "Cliente", Cargo: "CEO", Fecha: "2024-01-01" },
    { Nombre: "Carlos", Apellido: "Rodríguez", Email: "carlos.r@hotmail.com", Telefono: "+5491187654321", Empresa: "Norte Construcciones", Ubicacion: "Córdoba", Notas: "Interesado", Tipo: "Proveedor", Cargo: "Gerente", Fecha: "2024-02-15" },
    { Nombre: "María", Apellido: "López", Email: "maria.lopez@estudio.com", Telefono: "+5493512345678", Empresa: "Estudio López", Ubicacion: "Rosario", Notas: "Reunión pendiente", Tipo: "Arquitecto", Cargo: "Socio", Fecha: "2024-03-20" },
    { Nombre: "Juan", Apellido: "Pérez", Email: "juan.perez@consulting.com", Telefono: "+5491111223344", Empresa: "Global Consulting", Ubicacion: "Mendoza", Notas: "Llamar el lunes", Tipo: "Inversor", Cargo: "Director", Fecha: "2024-04-10" },
    { Nombre: "Sofía", Apellido: "Martínez", Email: "sofia.m@design.com", Telefono: "+5492615556666", Empresa: "Design Studio", Ubicacion: "La Plata", Notas: "", Tipo: "Cliente", Cargo: "Diseñadora", Fecha: "2024-05-05" }
];
writeExcel('Contactos - Ordenado.xlsx', ordenadoData);

// 2. Contactos - Errores
const erroresData = [
    { Nombre: "Pedro", Apellido: "", Email: "pedro.sinapellido@ok.com", Telefono: "123456", Empresa: "Solo Nombre Inc", Ubicacion: "", Notas: "Falta apellido", Tipo: "Cliente", Cargo: "Empleado", Fecha: "2024-01-01" },
    { Nombre: "", Apellido: "García", Email: "sin.nombre@error.com", Telefono: "123456", Empresa: "Solo Apellido SA", Ubicacion: "", Notas: "Falta nombre", Tipo: "Proveedor", Cargo: "Admin", Fecha: "2024-02-01" },
    { Nombre: "Martín", Apellido: "López", Email: "mail-invalido-sin-arroba", Telefono: "123456", Empresa: "Error Corp", Ubicacion: "CABA", Notas: "Mail mal", Tipo: "Cliente", Cargo: "Manager", Fecha: "2024-03-01" },
    { Nombre: "Julia", Apellido: "Rojas", Email: "julia@ok.com", Telefono: "telefono-texto", Empresa: "Valid Corp", Ubicacion: "GBA", Notas: "Tel texto", Tipo: "Arquitecto", Cargo: "Jefa", Fecha: "2024-04-01" },
    { Nombre: "", Apellido: "", Email: "sin.nombre.ni.apellido@error.com", Telefono: "", Empresa: "Fantasma SA", Ubicacion: "", Notas: "Faltan datos", Tipo: "Inversor", Cargo: "", Fecha: "2024-05-01" }
];
writeExcel('Contactos - Errores.xlsx', erroresData);

// 3. Materiales - Ordenado (Different schema to test versatility)
const materialesData = [
    { Material: "Cemento Portland", Codigo: "CEM-001", Unidad: "Bolsa 50kg", Precio: 15000, Stock: 100, Proveedor: "Loma Negra", Categoria: "Obra Gruesa", Ubicacion: "Depósito A", Minimo: 20, Maximo: 200 },
    { Material: "Arena Fina", Codigo: "ARE-002", Unidad: "m3", Precio: 25000, Stock: 50, Proveedor: "Arenera Sur", Categoria: "Áridos", Ubicacion: "Patio", Minimo: 10, Maximo: 100 },
    { Material: "Ladrillo Hueco 12x18x33", Codigo: "LAD-003", Unidad: "Pallet", Precio: 85000, Stock: 30, Proveedor: "Cerámica Norte", Categoria: "Mampostería", Ubicacion: "Depósito B", Minimo: 5, Maximo: 50 },
    { Material: "Hierro 8mm", Codigo: "HIE-004", Unidad: "Barra 12m", Precio: 12000, Stock: 200, Proveedor: "Acindar", Categoria: "Estructura", Ubicacion: "Depósito A", Minimo: 50, Maximo: 500 },
    { Material: "Pintura Latex Interior", Codigo: "PIN-005", Unidad: "Lata 20L", Precio: 65000, Stock: 15, Proveedor: "Alba", Categoria: "Terminaciones", Ubicacion: "Local", Minimo: 5, Maximo: 30 }
];
writeExcel('Materiales - Ordenado.xlsx', materialesData);

// 4. Dataset Caos
const caosData = [
    { "Nombre Completo": "Juan Carlos", "Correo Electrónico": "juan@carlos.com", "Tel.": "12345", "Notas": "Separado por punto y coma en vez de coma", Columna5: "X", Columna6: "Y", Columna7: "Z", Columna8: "A", Columna9: "B", Columna10: "C" },
    { "Nombre Completo": "Maria; Ines", "Correo Electrónico": "maria@ines.com", "Tel.": "5678", "Notas": "Tiene punto y coma", Columna5: "", Columna6: "", Columna7: "", Columna8: "", Columna9: "", Columna10: "" },
    { "Nombre Completo": "", "Correo Electrónico": "No tiene nombre ni mail", "Tel.": "", "Notas": "", Columna5: "Raro", Columna6: "Raro", Columna7: "Raro", Columna8: "Raro", Columna9: "Raro", Columna10: "Raro" },
    { "Nombre Completo": "SoloNombre", "Correo Electrónico": "", "Tel.": "", "Notas": "Faltan datos", Columna5: "1", Columna6: "2", Columna7: "3", Columna8: "4", Columna9: "5", Columna10: "6" },
    { "Nombre Completo": "Rompiendo, todo", "Correo Electrónico": "rompiendo@todo.com", "Tel.": "9999", "Notas": "Comillas, extras, y desastre", Columna5: "!", Columna6: "@", Columna7: "#", Columna8: "$", Columna9: "%", Columna10: "^" }
];
writeExcel('Contactos - Caos.xlsx', caosData);
