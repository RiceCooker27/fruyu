-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Materials (raw ingredients)
create table materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null,
  current_stock numeric not null default 0,
  low_stock_threshold numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Products (items sold)
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_price integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Recipes (product → material mapping)
create table recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  material_id uuid not null references materials(id) on delete restrict,
  quantity_per_unit numeric not null,
  unique(product_id, material_id)
);

-- Promos
create table promos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount')),
  discount_value integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Sales (transactions)
create table sales (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  promo_id uuid references promos(id) on delete set null,
  subtotal integer not null,
  discount_amount integer not null default 0,
  total integer not null,
  notes text,
  status text not null default 'completed' check (status in ('completed', 'voided'))
);

-- Sale line items
create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity integer not null,
  unit_price integer not null,
  line_total integer not null
);

-- Expenses / spending
create table expenses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  description text not null,
  amount integer not null,
  material_id uuid references materials(id) on delete set null,
  quantity_purchased numeric,
  notes text
);

-- Stock adjustment audit log
create table stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  material_id uuid not null references materials(id) on delete cascade,
  delta numeric not null,
  reason text not null,
  source text not null check (source in ('sale', 'void', 'expense', 'manual'))
);

-- RPC: record a sale atomically
-- Deducts stock, creates sale + sale_items, logs adjustments
create or replace function record_sale(
  p_items jsonb,           -- [{product_id, quantity, unit_price, line_total}]
  p_promo_id uuid,
  p_subtotal integer,
  p_discount_amount integer,
  p_total integer,
  p_notes text
) returns uuid language plpgsql as $$
declare
  v_sale_id uuid;
  item jsonb;
  v_product_id uuid;
  v_quantity integer;
  recipe_row record;
  v_deduct numeric;
begin
  -- Create sale record
  insert into sales (promo_id, subtotal, discount_amount, total, notes)
  values (p_promo_id, p_subtotal, p_discount_amount, p_total, p_notes)
  returning id into v_sale_id;

  -- Insert sale items and deduct stock
  for item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (item->>'product_id')::uuid;
    v_quantity := (item->>'quantity')::integer;

    insert into sale_items (sale_id, product_id, quantity, unit_price, line_total)
    values (
      v_sale_id,
      v_product_id,
      v_quantity,
      (item->>'unit_price')::integer,
      (item->>'line_total')::integer
    );

    -- Deduct ingredients per recipe
    for recipe_row in
      select r.material_id, r.quantity_per_unit
      from recipes r
      where r.product_id = v_product_id
    loop
      v_deduct := recipe_row.quantity_per_unit * v_quantity;

      update materials
      set current_stock = current_stock - v_deduct
      where id = recipe_row.material_id;

      insert into stock_adjustments (material_id, delta, reason, source)
      values (recipe_row.material_id, -v_deduct, 'Sale recorded', 'sale');
    end loop;
  end loop;

  return v_sale_id;
end;
$$;

-- RPC: void a sale atomically (restores stock)
create or replace function void_sale(p_sale_id uuid)
returns void language plpgsql as $$
declare
  item_row record;
  recipe_row record;
  v_restore numeric;
begin
  -- Mark as voided
  update sales set status = 'voided' where id = p_sale_id;

  -- Restore stock for each item
  for item_row in
    select si.product_id, si.quantity
    from sale_items si
    where si.sale_id = p_sale_id
  loop
    for recipe_row in
      select r.material_id, r.quantity_per_unit
      from recipes r
      where r.product_id = item_row.product_id
    loop
      v_restore := recipe_row.quantity_per_unit * item_row.quantity;

      update materials
      set current_stock = current_stock + v_restore
      where id = recipe_row.material_id;

      insert into stock_adjustments (material_id, delta, reason, source)
      values (recipe_row.material_id, v_restore, 'Sale voided', 'void');
    end loop;
  end loop;
end;
$$;

-- Enable Row Level Security (all tables owned by authenticated user)
alter table materials enable row level security;
alter table products enable row level security;
alter table recipes enable row level security;
alter table promos enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table expenses enable row level security;
alter table stock_adjustments enable row level security;

-- RLS policies: allow all for authenticated users (single-user app)
create policy "auth_all" on materials for all to authenticated using (true) with check (true);
create policy "auth_all" on products for all to authenticated using (true) with check (true);
create policy "auth_all" on recipes for all to authenticated using (true) with check (true);
create policy "auth_all" on promos for all to authenticated using (true) with check (true);
create policy "auth_all" on sales for all to authenticated using (true) with check (true);
create policy "auth_all" on sale_items for all to authenticated using (true) with check (true);
create policy "auth_all" on expenses for all to authenticated using (true) with check (true);
create policy "auth_all" on stock_adjustments for all to authenticated using (true) with check (true);
