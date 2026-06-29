-- Multi-user migration
-- Run this in Supabase SQL Editor

-- 1. Create stores table
create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Toko Saya',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 2. Create store members table
create table store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique(store_id, user_id)
);

-- 3. Create invitations table
create table invitations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  token text not null unique default gen_random_uuid()::text,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- 4. Add store_id to all data tables
alter table materials add column store_id uuid references stores(id) on delete cascade;
alter table products add column store_id uuid references stores(id) on delete cascade;
alter table promos add column store_id uuid references stores(id) on delete cascade;
alter table sales add column store_id uuid references stores(id) on delete cascade;
alter table expenses add column store_id uuid references stores(id) on delete cascade;
alter table stock_adjustments add column store_id uuid references stores(id) on delete cascade;

-- 5. Enable RLS on new tables
alter table stores enable row level security;
alter table store_members enable row level security;
alter table invitations enable row level security;

-- 6. Drop old permissive RLS policies
drop policy if exists "auth_all" on materials;
drop policy if exists "auth_all" on products;
drop policy if exists "auth_all" on recipes;
drop policy if exists "auth_all" on promos;
drop policy if exists "auth_all" on sales;
drop policy if exists "auth_all" on sale_items;
drop policy if exists "auth_all" on expenses;
drop policy if exists "auth_all" on stock_adjustments;

-- 7. Helper function: get user's store_id
create or replace function my_store_id()
returns uuid language sql stable as $$
  select store_id from store_members where user_id = auth.uid() limit 1
$$;

-- 8. New RLS policies: filter by store membership
create policy "store_members_only" on materials for all to authenticated
  using (store_id = my_store_id()) with check (store_id = my_store_id());

create policy "store_members_only" on products for all to authenticated
  using (store_id = my_store_id()) with check (store_id = my_store_id());

create policy "store_members_only" on recipes for all to authenticated
  using (
    product_id in (select id from products where store_id = my_store_id())
  ) with check (
    product_id in (select id from products where store_id = my_store_id())
  );

create policy "store_members_only" on promos for all to authenticated
  using (store_id = my_store_id()) with check (store_id = my_store_id());

create policy "store_members_only" on sales for all to authenticated
  using (store_id = my_store_id()) with check (store_id = my_store_id());

create policy "store_members_only" on sale_items for all to authenticated
  using (
    sale_id in (select id from sales where store_id = my_store_id())
  ) with check (
    sale_id in (select id from sales where store_id = my_store_id())
  );

create policy "store_members_only" on expenses for all to authenticated
  using (store_id = my_store_id()) with check (store_id = my_store_id());

create policy "store_members_only" on stock_adjustments for all to authenticated
  using (store_id = my_store_id()) with check (store_id = my_store_id());

-- stores: owner and members can read, only owner can update/delete
create policy "store_read" on stores for select to authenticated
  using (id = my_store_id());
create policy "store_owner_write" on stores for update to authenticated
  using (owner_id = auth.uid());

-- store_members: members can read their store's members
create policy "members_read" on store_members for select to authenticated
  using (store_id = my_store_id());
create policy "members_owner_write" on store_members for all to authenticated
  using (store_id in (select id from stores where owner_id = auth.uid()))
  with check (store_id in (select id from stores where owner_id = auth.uid()));

-- invitations: owner can manage, anyone with token can read (for accepting)
create policy "invite_owner" on invitations for all to authenticated
  using (store_id in (select id from stores where owner_id = auth.uid()))
  with check (store_id in (select id from stores where owner_id = auth.uid()));
create policy "invite_read_by_token" on invitations for select to authenticated
  using (true);

-- 9. Update RPCs to include store_id

-- record_sale updated
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

  for item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (item->>'product_id')::uuid;
    v_quantity := (item->>'quantity')::integer;

    insert into sale_items (sale_id, product_id, quantity, unit_price, line_total)
    values (v_sale_id, v_product_id, v_quantity, (item->>'unit_price')::integer, (item->>'line_total')::integer);

    for recipe_row in
      select r.material_id, r.quantity_per_unit
      from recipes r where r.product_id = v_product_id
    loop
      v_deduct := recipe_row.quantity_per_unit * v_quantity;
      update materials set current_stock = current_stock - v_deduct where id = recipe_row.material_id;
      insert into stock_adjustments (store_id, material_id, delta, reason, source)
      values (v_store_id, recipe_row.material_id, -v_deduct, 'Sale recorded', 'sale');
    end loop;
  end loop;

  return v_sale_id;
end;
$$;

-- void_sale updated
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

  for item_row in select si.product_id, si.quantity from sale_items si where si.sale_id = p_sale_id
  loop
    for recipe_row in select r.material_id, r.quantity_per_unit from recipes r where r.product_id = item_row.product_id
    loop
      v_restore := recipe_row.quantity_per_unit * item_row.quantity;
      update materials set current_stock = current_stock + v_restore where id = recipe_row.material_id;
      insert into stock_adjustments (store_id, material_id, delta, reason, source)
      values (v_store_id, recipe_row.material_id, v_restore, 'Sale voided', 'void');
    end loop;
  end loop;
end;
$$;

-- 10. Function: auto-create store on first login
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_store_id uuid;
begin
  -- Only create store if user has no store yet
  if not exists (select 1 from store_members where user_id = new.id) then
    insert into stores (name, owner_id) values ('Toko Saya', new.id) returning id into v_store_id;
    insert into store_members (store_id, user_id, role) values (v_store_id, new.id, 'owner');
  end if;
  return new;
end;
$$;

-- Trigger on new user
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Run for existing users (you, the owner) so your account gets a store
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
