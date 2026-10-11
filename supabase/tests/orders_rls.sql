begin;
do $test$
declare s uuid := gen_random_uuid(); b uuid := gen_random_uuid(); x uuid := gen_random_uuid(); t uuid := gen_random_uuid(); o uuid; again uuid; row_count integer;
begin
  insert into auth.users(id,email,aud,role,raw_user_meta_data) values
    (s,'pasespain-seller-test@example.invalid','authenticated','authenticated','{"birth_date":"2000-01-01","role":"buyer","terms_accepted":true,"privacy_accepted":true}'::jsonb),
    (b,'pasespain-buyer-test@example.invalid','authenticated','authenticated','{"birth_date":"2000-01-01","role":"buyer","terms_accepted":true,"privacy_accepted":true}'::jsonb),
    (x,'pasespain-other-test@example.invalid','authenticated','authenticated','{"birth_date":"2000-01-01","role":"buyer","terms_accepted":true,"privacy_accepted":true}'::jsonb);
  insert into public.ticket_offers(id,seller_id,home,away,match_date,stadium,city,price_eur,details,status,quantity)
    values(t,s,'PaseSpain test home','PaseSpain test away','2099-01-01','Test stadium','Test city',100,'Anzahl Tickets: 2','available',2);
  if not public.reserve_ticket_offer(t,b,30) then raise exception 'Reservation failed'; end if;
  if public.reserve_ticket_offer(t,x,30) then raise exception 'Concurrent buyer could reserve'; end if;
  o := public.complete_ticket_order(t,b,'cs_pasespain_sql_test');
  again := public.complete_ticket_order(t,b,'cs_pasespain_sql_test');
  if o <> again then raise exception 'Duplicate order'; end if;
  if not exists(select 1 from public.orders where id=o and buyer_id=b and seller_id=s and quantity=2 and ticket_price_eur=200 and buyer_total_eur=220 and seller_payout_eur=180) then raise exception 'Order data or amounts wrong'; end if;
  if not exists(select 1 from public.ticket_offers where id=t and status='sold' and reserved_by=b) then raise exception 'Sold status wrong'; end if;
  perform set_config('request.jwt.claim.sub',b::text,true);
  execute 'set local role authenticated';
  select count(*) into row_count from public.orders where id=o;
  if row_count <> 1 then raise exception 'Buyer cannot read own order'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',s::text,true);
  execute 'set local role authenticated';
  select count(*) into row_count from public.orders where id=o;
  if row_count <> 1 then raise exception 'Seller cannot read own order'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',x::text,true);
  execute 'set local role authenticated';
  select count(*) into row_count from public.orders where id=o;
  if row_count <> 0 then raise exception 'Unrelated user can read order'; end if;
  if has_table_privilege('authenticated','public.orders','INSERT') then raise exception 'Clients can forge orders'; end if;
  if has_column_privilege('authenticated','public.orders','buyer_total_eur','UPDATE') then raise exception 'Clients can alter amount'; end if;
  if has_function_privilege('authenticated','public.complete_ticket_order(uuid,uuid,text)','EXECUTE') then raise exception 'Clients can fulfill orders'; end if;
  execute 'reset role';
end;
$test$;
rollback;
select 'PASS: quantity, fees, reservation conflict, atomic sold/order, webhook idempotency, buyer/seller RLS, outsider isolation, protected amounts and RPC. Test data rolled back.' as result;
