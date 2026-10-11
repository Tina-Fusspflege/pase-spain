-- Run after the existing ticket_offers / buyer_profiles schema.
begin;
alter table public.ticket_offers add column if not exists reserved_by uuid references auth.users(id);
alter table public.ticket_offers add column if not exists reserved_until timestamptz;
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id),
  seller_id uuid not null references auth.users(id),
  offer_id uuid not null references public.ticket_offers(id),
  home text not null, away text not null, match_date text, stadium text,
  quantity integer not null default 1 check (quantity > 0),
  ticket_price_eur numeric(12,2) not null check (ticket_price_eur > 0),
  buyer_total_eur numeric(12,2) not null,
  seller_payout_eur numeric(12,2) not null,
  status text not null default 'paid',
  ticket_available boolean not null default false,
  created_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);
alter table public.orders add column if not exists stripe_session_id text;
-- A duplicate in legacy data aborts this migration; inspect and resolve it first.
create unique index if not exists orders_offer_unique on public.orders(offer_id);
create index if not exists orders_buyer_created on public.orders(buyer_id, created_at desc);
create index if not exists orders_seller_created on public.orders(seller_id, created_at desc);
alter table public.orders enable row level security;
-- Remove legacy policies so permissive policies cannot bypass the new restrictions.
do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='orders' loop
    execute format('drop policy %I on public.orders', p.policyname);
  end loop;
end; $$;
revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
-- Existing seller ticket-upload route only updates this column.
grant update(ticket_available) on public.orders to authenticated;
grant all on public.orders to service_role;
create policy orders_participant_read on public.orders for select to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy orders_seller_delivery on public.orders for update to authenticated
  using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

create or replace function public.complete_ticket_order(p_offer_id uuid, p_buyer_id uuid, p_session_id text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare t public.ticket_offers%rowtype; o public.orders%rowtype; result_id uuid; ticket_count integer; ticket_total numeric;
begin
  if p_session_id is null or p_session_id = '' then raise exception 'Checkout session required'; end if;
  select * into t from public.ticket_offers where id=p_offer_id for update;
  if not found then raise exception 'Offer missing'; end if;
  select * into o from public.orders where offer_id=p_offer_id;
  if found then
    if o.buyer_id <> p_buyer_id or (o.stripe_session_id is not null and o.stripe_session_id <> p_session_id) then
      raise exception 'Offer belongs to another purchase';
    end if;
    update public.orders set stripe_session_id=p_session_id where id=o.id;
    update public.ticket_offers set status='sold', reserved_by=p_buyer_id, reserved_until=null where id=p_offer_id;
    return o.id;
  end if;
  if t.seller_id = p_buyer_id or t.price_eur <= 0 or not (
    (t.status='reserved' and t.reserved_by=p_buyer_id) or
    (t.status='available' and t.reserved_by is null)
  ) then raise exception 'Offer cannot be assigned to buyer'; end if;
  ticket_count := coalesce(substring(t.details from 'Anzahl Tickets:\s*(\d+)')::integer,t.quantity,1);
  if ticket_count < 1 then raise exception 'Invalid quantity'; end if;
  ticket_total := t.price_eur * ticket_count;
  insert into public.orders (buyer_id,seller_id,offer_id,home,away,match_date,stadium,
    quantity,ticket_price_eur,buyer_total_eur,seller_payout_eur,status,ticket_available,stripe_session_id)
  values (p_buyer_id,t.seller_id,t.id,t.home,t.away,t.match_date,t.stadium,ticket_count,
    ticket_total,round(ticket_total*1.1,2),round(ticket_total*0.9,2),'paid',false,p_session_id)
  returning id into result_id;
  update public.ticket_offers set status='sold', reserved_by=p_buyer_id, reserved_until=null where id=p_offer_id;
  return result_id;
end; $$;
revoke all on function public.complete_ticket_order(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.complete_ticket_order(uuid,uuid,text) to service_role;
-- Reservation is atomic and callable only by the authenticated checkout server.
create or replace function public.reserve_ticket_offer(p_offer_id uuid, p_buyer_id uuid, p_minutes integer default 30)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.ticket_offers set status='reserved', reserved_by=p_buyer_id,
    reserved_until=now() + make_interval(mins => least(greatest(p_minutes,1),30))
  where id=p_offer_id and seller_id <> p_buyer_id and (
    status='available' or (status='reserved' and reserved_until < now())
  );
  return found;
end; $$;
revoke all on function public.reserve_ticket_offer(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.reserve_ticket_offer(uuid,uuid,integer) to service_role;
commit;
