---
name: No fallback queries desde el cliente
description: Prohibido que un widget duplique queries del servidor como fallback en el cliente.
severity: medium
---

# ⛔ Prohibido: Fallback Queries desde el Cliente

## Regla

Si un widget recibe datos del servidor vía props (`initialData`), **NO** debe tener un fallback que re-ejecute las mismas queries desde el cliente cuando `initialData` es null o vacío.

## Patrón prohibido

```tsx
// ❌ PROHIBIDO: Duplicar queries del servidor en el cliente
function MyWidget({ initialData }: Props) {
    const [data, setData] = useState(initialData);

    useEffect(() => {
        if (!initialData) {
            // Re-ejecuta las MISMAS queries que el servidor debería haber hecho
            const fetchData = async () => {
                const result = await supabase.from('table').select('*')...;
                setData(result);
            };
            fetchData();
        }
    }, [initialData]);
}
```

## Patrón correcto

Opción A: Widget siempre autónomo (carga sus propios datos, nunca recibe del server):
```tsx
// ✅ Widget autónomo
function MyWidget() {
    const [data, setData] = useState(null);
    useEffect(() => { fetchMyData().then(setData); }, []);
}
```

Opción B: Widget siempre recibe datos del server (nunca fetch propio):
```tsx
// ✅ Widget con datos del server
function MyWidget({ data }: { data: WidgetData }) {
    // Usa data directamente, no tiene fetch propio
}
```

## Por qué

El patrón de "pruebo server, si falla hago client" genera:
1. **Duplicación de código**: Las mismas queries existen en dos lugares
2. **Queries desde el navegador**: Más lentas que desde el servidor (latencia de red + CORS)
3. **Inconsistencia**: El servidor puede tener datos distintos al cliente
4. **Doble mantenimiento**: Si cambia la query, hay que cambiarla en dos lugares
