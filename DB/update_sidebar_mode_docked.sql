-- Actualizar sidebar_mode a 'docked' para todos los usuarios
UPDATE public.user_preferences
SET sidebar_mode = 'docked';
