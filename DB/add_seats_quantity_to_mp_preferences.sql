-- Add seats_quantity column to mp_preferences
-- Allows tracking how many seats were purchased via MercadoPago
ALTER TABLE public.mp_preferences
ADD COLUMN IF NOT EXISTS seats_quantity integer NULL DEFAULT NULL;

COMMENT ON COLUMN public.mp_preferences.seats_quantity IS 'Number of seats purchased (only for product_type = seats)';
