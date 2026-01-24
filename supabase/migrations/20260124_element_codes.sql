-- ============================================================================
-- Migración: Agregar código a task_elements
-- Fecha: 2026-01-24
-- Descripción: Agrega columna code para generar códigos como EJE-MA-MUR
-- ============================================================================

-- PASO 1: Agregar columna code
ALTER TABLE task_elements ADD COLUMN IF NOT EXISTS code varchar(4);

-- PASO 2: Poblar códigos para todos los elementos
UPDATE task_elements SET code = 'CTR' WHERE slug = 'contrapiso';
UPDATE task_elements SET code = 'CRP' WHERE slug = 'carpeta-nivelacion';
UPDATE task_elements SET code = 'LOS' WHERE slug = 'losa';
UPDATE task_elements SET code = 'PFL' WHERE slug = 'piso-flotante';
UPDATE task_elements SET code = 'CER' WHERE slug = 'ceramico';
UPDATE task_elements SET code = 'POR' WHERE slug = 'porcelanato';

UPDATE task_elements SET code = 'MUR' WHERE slug = 'muro';
UPDATE task_elements SET code = 'TAB' WHERE slug = 'tabique';
UPDATE task_elements SET code = 'MHO' WHERE slug = 'muro-hormigon';
UPDATE task_elements SET code = 'COL' WHERE slug = 'columna';
UPDATE task_elements SET code = 'VIG' WHERE slug = 'viga';

UPDATE task_elements SET code = 'RVG' WHERE slug = 'revoque-grueso';
UPDATE task_elements SET code = 'RVF' WHERE slug = 'revoque-fino';
UPDATE task_elements SET code = 'PIN' WHERE slug = 'pintura';
UPDATE task_elements SET code = 'REV' WHERE slug = 'revestimiento';

UPDATE task_elements SET code = 'CIE' WHERE slug = 'cielorraso';
UPDATE task_elements SET code = 'CIS' WHERE slug = 'cielorraso-suspendido';
UPDATE task_elements SET code = 'CUB' WHERE slug = 'cubierta';
UPDATE task_elements SET code = 'MEM' WHERE slug = 'membrana';

UPDATE task_elements SET code = 'PTA' WHERE slug = 'puerta';
UPDATE task_elements SET code = 'VEN' WHERE slug = 'ventana';
UPDATE task_elements SET code = 'REJ' WHERE slug = 'reja';
UPDATE task_elements SET code = 'PTN' WHERE slug = 'porton';
UPDATE task_elements SET code = 'BAR' WHERE slug = 'baranda';

UPDATE task_elements SET code = 'CAG' WHERE slug = 'caneria-agua';
UPDATE task_elements SET code = 'CAD' WHERE slug = 'caneria-desague';
UPDATE task_elements SET code = 'INO' WHERE slug = 'inodoro';
UPDATE task_elements SET code = 'LAV' WHERE slug = 'lavatorio';
UPDATE task_elements SET code = 'DUC' WHERE slug = 'ducha';
UPDATE task_elements SET code = 'BAN' WHERE slug = 'banera';
UPDATE task_elements SET code = 'GRI' WHERE slug = 'grifo';
UPDATE task_elements SET code = 'TAN' WHERE slug = 'tanque-agua';
UPDATE task_elements SET code = 'CAL' WHERE slug = 'calefon';
UPDATE task_elements SET code = 'TER' WHERE slug = 'termotanque';

UPDATE task_elements SET code = 'TBE' WHERE slug = 'tablero-electrico';
UPDATE task_elements SET code = 'CBL' WHERE slug = 'cableado';
UPDATE task_elements SET code = 'TOM' WHERE slug = 'tomacorriente';
UPDATE task_elements SET code = 'INT' WHERE slug = 'interruptor';
UPDATE task_elements SET code = 'LUM' WHERE slug = 'luminaria';

UPDATE task_elements SET code = 'AAC' WHERE slug = 'aire-acondicionado';
UPDATE task_elements SET code = 'CLF' WHERE slug = 'calefaccion';
UPDATE task_elements SET code = 'RAD' WHERE slug = 'radiador';

UPDATE task_elements SET code = 'VER' WHERE slug = 'vereda';
UPDATE task_elements SET code = 'COR' WHERE slug = 'cordon';
UPDATE task_elements SET code = 'CRC' WHERE slug = 'cerco';
UPDATE task_elements SET code = 'JAR' WHERE slug = 'jardin';

UPDATE task_elements SET code = 'ESC' WHERE slug = 'escalera';
UPDATE task_elements SET code = 'MES' WHERE slug = 'mesada';
UPDATE task_elements SET code = 'MUE' WHERE slug = 'mueble';
UPDATE task_elements SET code = 'ZOC' WHERE slug = 'zocalo';

-- PASO 3: También agregar code a task_divisions si no existe
ALTER TABLE task_divisions ADD COLUMN IF NOT EXISTS code varchar(4);

-- Poblar códigos de divisiones
UPDATE task_divisions SET code = 'PRE' WHERE lower(name) LIKE '%preliminar%';
UPDATE task_divisions SET code = 'DEM' WHERE lower(name) LIKE '%demolici%';
UPDATE task_divisions SET code = 'MAP' WHERE lower(name) LIKE '%mamposter%';
UPDATE task_divisions SET code = 'SUE' WHERE lower(name) LIKE '%suelo%' OR lower(name) LIKE '%tierra%';
UPDATE task_divisions SET code = 'EQU' WHERE lower(name) LIKE '%equipam%';
UPDATE task_divisions SET code = 'AIS' WHERE lower(name) LIKE '%aislaci%';
UPDATE task_divisions SET code = 'CAR' WHERE lower(name) LIKE '%carpinter%' AND lower(name) NOT LIKE '%met%';
UPDATE task_divisions SET code = 'CIE' WHERE lower(name) LIKE '%cielorraso%';
UPDATE task_divisions SET code = 'EST' WHERE lower(name) LIKE '%estructur%resistente%';
UPDATE task_divisions SET code = 'HAR' WHERE lower(name) LIKE '%hormig%armado%';
UPDATE task_divisions SET code = 'MET' WHERE lower(name) LIKE '%met%lica%';
UPDATE task_divisions SET code = 'CUB' WHERE lower(name) LIKE '%cubierta%';
UPDATE task_divisions SET code = 'CTP' WHERE lower(name) LIKE '%contrapiso%' OR lower(name) LIKE '%carpeta%';
UPDATE task_divisions SET code = 'ABE' WHERE lower(name) LIKE '%abertura%';
UPDATE task_divisions SET code = 'PAI' WHERE lower(name) LIKE '%paisaj%' OR lower(name) LIKE '%exterior%';
UPDATE task_divisions SET code = 'INS' WHERE lower(name) LIKE '%instalacion%' AND lower(name) NOT LIKE '%el%ctric%' AND lower(name) NOT LIKE '%gas%' AND lower(name) NOT LIKE '%climatiz%';
UPDATE task_divisions SET code = 'CLI' WHERE lower(name) LIKE '%climatiz%';
UPDATE task_divisions SET code = 'GAS' WHERE lower(name) LIKE '%gas%';
UPDATE task_divisions SET code = 'ELE' WHERE lower(name) LIKE '%el%ctric%';
