---
description: Checklist completo para deployment a producción de Seencel V2.
---

# 🚀 Workflow: Deployment a Producción

Este workflow define el proceso completo para hacer deploy a producción.

---

## Pre-Deploy Checklist

### 1. Verificaciones Locales

```bash
# Build local sin errores
npm run build

# Lint sin errores
npm run lint

# Type check
npx tsc --noEmit
```

### 2. Variables de Entorno

Verificar que están configuradas en Vercel:

| Variable | Propósito | Requerida |
|----------|-----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key pública | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Key privada (server) | ✅ |
| `GOOGLE_CLIENT_ID` | OAuth Google | ✅ |
| `GOOGLE_CLIENT_SECRET` | OAuth Google | ✅ |
| `RESEND_API_KEY` | Emails | ✅ |
| `MERCADOPAGO_ACCESS_TOKEN` | Pagos MP | ✅ |
| `PAYPAL_CLIENT_ID` | Pagos PayPal | Opcional |
| `PAYPAL_CLIENT_SECRET` | Pagos PayPal | Opcional |

### 3. Migraciones de Base de Datos

Si hay cambios de schema:

1. Ejecutar SQL en Supabase Dashboard (producción)
2. Verificar que las migraciones no rompen datos existentes
3. Documentar cambios en `TABLES.md` correspondiente

### 4. Webhooks

Verificar URLs de webhook apuntan a producción:

- **MercadoPago**: `https://seencel.com/api/mercadopago/webhook`
- **PayPal**: `https://seencel.com/api/paypal/webhook`

---

## Deploy Process

### Opción A: Deploy Automático (Recomendado)

```bash
git push origin main
```

Vercel detecta el push y hace deploy automático.

### Opción B: Deploy Manual

```bash
vercel --prod
```

---

## Post-Deploy Verification

### 1. Smoke Tests

- [ ] Home page carga correctamente
- [ ] Login con Google funciona
- [ ] Dashboard carga sin errores
- [ ] Crear un proyecto de prueba
- [ ] Eliminar proyecto de prueba

### 2. Pagos (si hubo cambios)

- [ ] Checkout de suscripción funciona
- [ ] Webhook de MercadoPago responde 200
- [ ] Email de confirmación se envía

### 3. Monitoreo

- [ ] Revisar logs en Vercel
- [ ] Revisar errores en Supabase Logs
- [ ] Verificar que no hay errores 500 en primeros 10 minutos

---

## Rollback

Si algo sale mal:

```bash
# Ver deployments anteriores
vercel ls

# Promover deployment anterior a producción
vercel promote [deployment-url]
```

---

## Checklist Final

- [ ] Build local exitoso
- [ ] Variables de entorno configuradas
- [ ] Migraciones ejecutadas (si aplica)
- [ ] Webhooks apuntan a producción
- [ ] Deploy ejecutado
- [ ] Smoke tests pasados
- [ ] Logs monitoreados por 10 minutos
