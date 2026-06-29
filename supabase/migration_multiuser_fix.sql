-- Run this if migration_multiuser.sql partially failed

-- Add store_id columns (skip if already exist)
alter table materials add column if not exists store_id uuid references stores(id) on delete cascade;
alter table products add column if not exists store_id uuid references stores(id) on delete cascade;
alter table promos add column if not exists store_id uuid references stores(id) on delete cascade;
alter table sales add column if not exists store_id uuid references stores(id) on delete cascade;
alter table expenses add column if not exists store_id uuid references stores(id) on delete cascade;
alter table stock_adjustments add column if not exists store_id uuid references stores(id) on delete cascade;

-- Enable RLS on new tables
alter table stores enable row level security;
alter table store_members enable row level security;
alter table invitations enable row level security;

-- Drop old policies if exist
drop policy if exists "auth_all" on materials;
drop policy if exists "auth_all" on products;
drop policy if exists "auth_all" on recipes;
drop policy if exists "auth_all" on promos;
drop policy if exists "auth_all" on sales;
drop policy if exists "auth_all" on sale_items;
drop policy if exists "auth_all" on expenses;
drop policy if exists "auth_all" on stock_adjustments;
drop policy if exists "store_members_only" on materials;
drop policy if exists "store_members_only" on products;
drop policy if exists "store_members_only" on recipes;
drop policy if exists "store_members_only" on promos;
drop policy if exists "store_members_only" on sales;
drop policy if exists "store_members_only" on sale_items;
drop policy if exists "store_members_only" on expenses;
drop policy if exists "store_members_only" on stock_adjustments;
drop policy if exists "store_read" on stores;
drop policy if exists "store_owner_write" on stores;
drop policy if exists "members_read" on store_members;
drop policy if exists "members_owner_write" on store_members;
drop policy if exists "invite_owner" on invitations;
drop policy if exists "invite_read_by_token" on invitations;

-- Helper function
create or replace function my_store_id()
returns uuid language sql stable as $$
  select store_id from store_members where user_id = auth.uid() limit 1
$$;

-- RLS policies
create policy "store_members_only" on materials for all to authenticated
  using (store_id = my_store_id()) with check (store_id = my_store_id());

create policy "store_members_only" on products for all to authenticated
  using (store_id = my_store_id()) with check (store_id = my_store_id());

create policy "store_members_only" on recipes for all to authenticated
  using (product_id in (select id from products where store_id = my_store_id()))
  with check (product_id in (select id from products where store_id = my_store_id()));

create policy "store_members_only" on promos for all to authenticated
  using (store_id = my_store_id()) with check (store_id = my_store_id());

create policy "store_members_only" on sales for all to authenticated
  using (store_id = my_store_id()) with check (store_id = my_store_id());

create policy "store_members_only" on sale_items for all to authenticated
  using (sale_id in (select id from sales where store_id = my_store_id()))
  with check (sale_id in (select id from sales where store_id = my_store_id()));

create policy "store_members_only" on expenses for all to authenticated
  using (store_id = my_store_id()) with check (store_id = my_store_id());

create policy "store_members_only" on stock_adjustments for all to authenticated
  using (store_id = my_store_id()) with check (store_id = my_store_id());

create policy "store_read" on stores for select to authenticated
  using (id = my_store_id());
create policy "store_owner_write" on stores for update to authenticated
  using (owner_id = auth.uid());

create policy "members_read" on store_members for select to authenticated
  using (store_id = my_store_id());
create policy "members_owner_write" on store_members for all to authenticated
  using (store_id in (select id from stores where owner_id = auth.uid()))
  with check (store_id in (select id from stores where owner_id = auth.uid()));

create policy "invite_owner" on invitations for all to authenticated
  using (store_id in (select id from stores where owner_id = auth.uid()))
  with check (store_id in (select id from stores where owner_id = auth.uid()));
create policy "invite_read_by_token" on invitations for select to authenticated
  using (true);

-- Update RPCs
create or replace function record_sale(
  p_items jsonb,
  p_promo_id uuid,
  p_subtotal integer,
  p_discount_amount integer,
  p_total integer,
  p_notes text
) returns uuid language plpgsql as $$
declare
  v_sale_id uuid;
  v_store_id uuid;
  item jsonb;
  v_product_id uuid;
  v_quantity integer;
  recipe_row record;
  v_deduct numeric;
begin
  v_store_id := my_store_id();
  insert into sales (store_id, promo_id, subtotal, discount_amount, total, notes)
  values (v_store_id, p_promo_id, p_subtotal, p_discount_amount, p_total, p_notes)
  returning id into v_sale_id;

  for item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (item->>'product_id')::uuid;
    v_quantity := (item->>'quantity')::integer;
    insert into sale_items (sale_id, product_id, quantity, unit_price, line_total)
    values (v_sale_id, v_product_id, v_quantity, (item->>'unit_price')::integer, (item->>'line_total')::integer);
    for recipe_row in select r.material_id, r.quantity_per_unit from recipes r where r.product_id = v_product_id loop
      v_deduct := recipe_row.quantity_per_unit * v_quantity;
      update materials set current_stock = current_stock - v_deduct where id = recipe_row.material_id;
      insert into stock_adjustments (store_id, material_id, delta, reason, source)
      values (v_store_id, recipe_row.material_id, -v_deduct, 'Sale recorded', 'sale');
    end loop;
  end loop;
  return v_sale_id;
end;
$$;

create or replace function void_sale(p_sale_id uuid)
returns void language plpgsql as $$
declare
  v_store_id uuid;
  item_row record;
  recipe_row record;
  v_restore numeric;
begin
  v_store_id := my_store_id();
  update sales set status = 'voided' where id = p_sale_id;
  for item_row in select si.product_id, si.quantity from sale_items si where si.sale_id = p_sale_id loop
    for recipe_row in select r.material_id, r.quantity_per_unit from recipes r where r.product_id = item_row.product_id loop
      v_restore := recipe_row.quantity_per_unit * item_row.quantity;
      update materials set current_stock = current_stock + v_restore where id = recipe_row.material_id;
      insert into stock_adjustments (store_id, material_id, delta, reason, source)
      values (v_store_id, recipe_row.material_id, v_restore, 'Sale voided', 'void');
    end loop;
  end loop;
end;
$$;

-- Auto-create store trigger
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare v_store_id uuid;
begin
  if not exists (select 1 from store_members where user_id = new.id) then
    insert into stores (name, owner_id) values ('Toko Saya', new.id) returning id into v_store_id;
    insert into store_members (store_id, user_id, role) values (v_store_id, new.id, 'owner');
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Create store for existing users
do $$
declare
  u record;
  v_store_id uuid;
begin
  for u in select id from auth.users loop
    if not exists (select 1 from store_members where user_id = u.id) then
      insert into stores (name, owner_id) values ('Toko Saya', u.id) returning id into v_store_id;
      insert into store_members (store_id, user_id, role) values (v_store_id, u.id, 'owner');
    end if;
  end loop;
end;
$$;
