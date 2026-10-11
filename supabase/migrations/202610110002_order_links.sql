-- Protect new orders while allowing existing historical rows to be reviewed separately.
begin;
do $constraints$
begin
  if not exists(select 1 from pg_constraint where conrelid='public.orders'::regclass and conname='orders_buyer_auth_fk') then
    alter table public.orders add constraint orders_buyer_auth_fk foreign key(buyer_id) references auth.users(id) not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.orders'::regclass and conname='orders_seller_auth_fk') then
    alter table public.orders add constraint orders_seller_auth_fk foreign key(seller_id) references auth.users(id) not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.orders'::regclass and conname='orders_ticket_offer_fk') then
    alter table public.orders add constraint orders_ticket_offer_fk foreign key(offer_id) references public.ticket_offers(id) not valid;
  end if;
end;
$constraints$;
commit;
select 'Order foreign keys protect all new writes' as result;
