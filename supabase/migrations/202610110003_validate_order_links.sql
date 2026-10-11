begin;
alter table public.orders validate constraint orders_buyer_auth_fk;
alter table public.orders validate constraint orders_seller_auth_fk;
alter table public.orders validate constraint orders_ticket_offer_fk;
commit;
