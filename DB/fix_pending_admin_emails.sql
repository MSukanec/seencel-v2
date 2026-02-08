-- Corregir emails pendientes en la cola que tengan el destinatario incorrecto
UPDATE public.email_queue
SET recipient_email = 'contacto@seencel.com'
WHERE recipient_email = 'seencel@seencel.com'
  AND status = 'pending';
