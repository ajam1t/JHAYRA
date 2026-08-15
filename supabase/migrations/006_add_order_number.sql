-- Add order_number column (JHY-YYYYMMDD-XXXXXX) to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Function to auto-generate order_number on insert
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.order_number := 'JHY-'
    || TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD')
    || '-'
    || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

-- Trigger: fires on every INSERT where order_number is null
DROP TRIGGER IF EXISTS trg_set_order_number ON public.orders;
CREATE TRIGGER trg_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- Unique index (non-blocking, safe to add on empty or live table)
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_idx
  ON public.orders (order_number)
  WHERE order_number IS NOT NULL;
