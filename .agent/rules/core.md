---
trigger: always_on
---

Estas reglas definen restricciones fundamentales del sistema Seencel.
No son sugerencias. Son obligatorias.

1. Idioma y veracidad

El agente debe responder siempre en español.

El agente no debe afirmar que algo fue probado, ejecutado o verificado si el usuario no lo pidió explícitamente.

El agente no debe simular ejecuciones de build, tests o navegador sin instrucción explícita del usuario.

2. Supabase como fuente de verdad

Supabase es la única fuente de verdad para:

permisos

visibilidad

reglas de negocio críticas

integridad de datos

El frontend y el backend no deben reemplazar reglas que pertenecen a la base de datos.

Si algo depende de permisos o roles, debe estar garantizado mediante RLS o funciones SQL.

3. RLS obligatoria

Toda tabla persistente del sistema debe tener políticas RLS explícitas.

Las políticas deben contemplar, según corresponda:

SELECT

INSERT

UPDATE

DELETE

No se aceptan tablas reales sin RLS.

Si una tabla no puede explicarse claramente mediante RLS, el diseño se considera incorrecto.

4. Regla crítica de identidad

auth_id se usa únicamente para vincular Supabase Auth con la tabla users.

Reglas obligatorias:

auth_id NO debe usarse como clave foránea en otras tablas.

Todas las relaciones del sistema deben usar users.id como FK real.

No existen excepciones a esta regla.

5. No duplicar lógica

Cada regla de negocio debe existir en un solo lugar del sistema.

Si una lógica ya existe como:

función SQL

política RLS

helper central

servicio backend

no debe reimplementarse en otra capa.

No se crean atajos “simplificados” que dupliquen comportamiento existente.

Duplicar lógica se considera deuda técnica crítica.

6. Separación estricta de responsabilidades

Cada capa cumple un rol único:

Base de datos: permisos, integridad y reglas de datos

Backend / API: orquestación, integraciones y cálculos

Frontend: UI, UX, estado y presentación

Si una capa asume responsabilidades de otra, el diseño es inválido.

7. El modelo de datos manda

El modelo de datos se diseña primero.

Reglas obligatorias:

La UI se adapta al modelo de datos.

El modelo no se deforma para facilitar React, formularios o queries.

Las vistas (*_view) se usan para lectura y simplificación, no para ocultar problemas de modelado.

8. Naming orientado al dominio

Los nombres deben reflejar conceptos reales del negocio.

Reglas:

Evitar nombres genéricos cuando el dominio es específico.

No reutilizar conceptos distintos “porque se parecen”.

Si un nombre no puede explicarse claramente a un humano, se considera incorrecto.

9. Prioridad de calidad del sistema

No se aceptan soluciones que comprometan:

seguridad

escalabilidad

claridad del sistema

visión de largo plazo de Seencel

Si algo funciona pero viola estos principios, debe rechazarse.

10. Prohibición de hacks estructurales

No se permite:

agregar campos “provisorios”

crear tablas sin diseño relacional claro

introducir soluciones rápidas que generen deuda estructural

El sistema está diseñado para largo plazo desde el primer commit.

11. Uso obligatorio de reglas del proyecto

El agente debe respetar las reglas definidas en .agent/rules.

Cuando una decisión esté guiada por una regla específica, el agente debe mencionarla explícitamente en su razonamiento visible usando el nombre del archivo de regla correspondiente.

Ejemplo esperado:

“Según avoid-layout-shift.md, …”