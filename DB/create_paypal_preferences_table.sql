-- PayPal Preferences Table
-- Mirrors mp_preferences for MercadoPago
-- Stores checkout metadata to be retrieved when PayPal returns the order

CREATE TABLE public.paypal_preferences (
    id VARCHAR(50) NOT NULL,  -- Short unique ID to pass to PayPal as custom_id
    order_id VARCHAR(100) NULL,  -- PayPal order ID once created
    user_id UUID NOT NULL,
    organization_id UUID NULL,  -- For subscription purchases
    plan_id UUID NULL,
    plan_slug TEXT NULL,
    billing_period TEXT NULL,
    amount NUMERIC(12, 2) NULL,
    currency TEXT NULL DEFAULT 'USD',
    product_type TEXT NULL,  -- 'subscription' | 'course'
    course_id UUID NULL,
    coupon_id UUID NULL,
    coupon_code TEXT NULL,
    discount_amount NUMERIC(12, 2) NULL DEFAULT 0,
    is_test BOOLEAN NULL DEFAULT FALSE,
    is_sandbox BOOLEAN NULL DEFAULT FALSE,
    status TEXT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    captured_at TIMESTAMP WITH TIME ZONE NULL,
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    
    CONSTRAINT paypal_preferences_pkey PRIMARY KEY (id),
    CONSTRAINT paypal_preferences_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT paypal_preferences_organization_id_fkey FOREIGN KEY (organization_id) 
        REFERENCES organizations (id) ON DELETE CASCADE,
    CONSTRAINT paypal_preferences_plan_id_fkey FOREIGN KEY (plan_id) 
        REFERENCES plans (id) ON DELETE SET NULL,
    CONSTRAINT paypal_preferences_course_id_fkey FOREIGN KEY (course_id) 
        REFERENCES courses (id) ON DELETE SET NULL,
    CONSTRAINT paypal_preferences_coupon_id_fkey FOREIGN KEY (coupon_id) 
        REFERENCES coupons (id) ON DELETE SET NULL,
    CONSTRAINT paypal_preferences_billing_period_check CHECK (
        billing_period = ANY (ARRAY['monthly', 'annual']) OR billing_period IS NULL
    ),
    CONSTRAINT paypal_preferences_product_type_check CHECK (
        product_type = ANY (ARRAY['subscription', 'course']) OR product_type IS NULL
    ),
    CONSTRAINT paypal_preferences_status_check CHECK (
        status = ANY (ARRAY['pending', 'completed', 'cancelled', 'expired'])
    )
) TABLESPACE pg_default;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_paypal_preferences_user ON public.paypal_preferences USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_paypal_preferences_org ON public.paypal_preferences USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_paypal_preferences_order ON public.paypal_preferences USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_paypal_preferences_status ON public.paypal_preferences USING btree (status)
    WHERE status = 'pending';
