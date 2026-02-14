---
trigger: always_on
---

📐 RULES — SEENCEL (VERSIÓN OPERATIVA Y DEFINITIVA)

Estas reglas definen cómo debe trabajar el agente dentro del proyecto Seencel.
No son sugerencias. Son restricciones de funcionamiento.

1. Idioma y comportamiento general

Responder siempre en español.

No ejecutar builds, tests ni simulaciones de navegador/DOM salvo que el usuario lo pida explícitamente.

No afirmar que algo fue “probado” si no se pidió ni se ejecutó.

2. Archivos protegidos (NO MODIFICAR)

Los siguientes archivos son documentación de referencia y NUNCA deben ser modificados por el agente:

**/TABLES.md

**/features/*/TABLES.md

DB/SCHEMA.md (auto-generado por `npm run db:schema`)

Estos archivos solo los actualiza el usuario manualmente luego de ejecutar migraciones reales en Supabase.
`DB/SCHEMA.md` se regenera con `npm run db:schema` — el agente puede pedirle al usuario que lo ejecute si necesita datos actualizados.

3. Cambios de Base de Datos (DB)

El agente NUNCA ejecuta SQL ni intenta modificar Supabase.

El agente NUNCA pega SQL en el chat.

Si se necesitan cambios de base de datos:

Crear archivos .sql separados

Guardarlos en una carpeta /DB en el root del proyecto (al mismo nivel que src/, scripts/, etc.)

El usuario es el único responsable de:

ejecutar esos scripts en Supabase

luego actualizar los TABLES.md (y ejecutar `npm run db:schema` para regenerar el schema)

📖 CONSULTAR SCHEMA: Para conocer la estructura actual de la base de datos (tablas, columnas, FKs, funciones, triggers, RLS, vistas, enums, índices), el agente DEBE leer `DB/SCHEMA.md`. Este archivo es la fuente de verdad del estado real de la base de datos.

4. Supabase es la fuente de verdad

Supabase define:

permisos

visibilidad

reglas de negocio

integridad de datos

El frontend NO reemplaza reglas que existen en la base.

Si algo depende de permisos o roles:

debe existir RLS o una función SQL que lo garantice

No se “compensa” una RLS débil con lógica en frontend.

5. RLS no es opcional

Ninguna tabla real existe sin RLS explícita.

Las políticas se definen en conjunto:

SELECT

INSERT

UPDATE

DELETE (si aplica)

No se crean tablas “temporales” sin RLS.

Si una tabla no puede explicarse claramente con RLS, el diseño es incorrecto.

6. Regla crítica de identidad de usuario

NUNCA usar auth_id como clave foránea del sistema.

auth_id se usa únicamente en la tabla users para vincular:

Supabase Auth → users.id

TODAS las demás tablas y relaciones usan users.id como FK.

No hay excepciones.

7. No duplicar lógica

Una regla existe en un solo lugar.

Si algo ya existe:

como función SQL

como helper central

como política RLS
NO se reimplementa en otro lado.

No se crean atajos “más simples”.

Duplicar lógica = deuda técnica inmediata.

8. Separación estricta de responsabilidades

Cada capa hace solo lo que le corresponde:

Base de datos: reglas, permisos, integridad

Backend / API: orquestación, cálculos, integraciones

Frontend: UI, UX, estado y presentación

Si una capa hace trabajo de otra, el diseño es inválido.

9. El modelo de datos manda

El modelo de datos se diseña primero.

La UI se adapta al modelo.

El modelo NO se deforma para facilitar React, forms o queries.

Las vistas (*_view) sirven para lectura y simplificación, no para esconder malos modelos.

10. Naming y dominio

Los nombres reflejan conceptos reales del negocio.

No usar nombres genéricos si el dominio es específico.

No reutilizar conceptos distintos “porque se parecen”.

Si un nombre no se puede explicar a un humano, está mal.

11. Proceso obligatorio al trabajar en un feature

Antes de modificar o crear algo en un feature:

Leer `DB/SCHEMA.md` para consultar la estructura real de las tablas involucradas (columnas, FKs, RLS, triggers).

Leer features/<feature>/TABLES.md para contexto adicional del esquema.

Leer features/<feature>/README.md si existe, para contexto funcional.

Al crear o modificar:

páginas

modales

formularios

flujos UX

Se debe verificar que cumplan las reglas de diseño y funcionalidad definidas en .agent/rules.

👉 Si durante el trabajo se detecta:

código legacy

lógica que rompe esas reglas

Avisar inmediatamente al usuario para que decida si se corrige o no.

12. Documentación viva

Si se realiza un cambio importante en un feature:

se debe actualizar su README.md

No documentar cambios triviales.

Documentar decisiones relevantes y comportamiento nuevo.

13. Código y mantenibilidad

Priorizar claridad por sobre cleverness.

Evitar abstracciones prematuras.

El código debe poder entenderse meses después.

Refactorizar es válido, romper contratos no.

14. Nada “rápido” que comprometa el sistema

No agregar campos “provisorios”.

No crear tablas sin pensar relaciones, RLS y naming.

No aceptar hacks con “después lo arreglamos”.

El sistema está pensado para largo plazo desde el primer commit.

15. Regla final (la más importante)

Ninguna decisión técnica puede ir en contra de:

seguridad

escalabilidad

claridad

visión de Seencel a largo plazo

Si algo funciona pero rompe eso, se descarta.