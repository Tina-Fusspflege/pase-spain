const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
process.env.STRIPE_WEBHOOK_SECRET='test';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://db.test';
process.env.SUPABASE_SERVICE_ROLE_KEY='test';
process.env.RESEND_API_KEY='test';
let event, badSignature=false, failMail=false, persisted=false, rpcCalls=0, mails=[];
const metadata={};
const stripe={webhooks:{constructEvent(){if(badSignature) throw Error('signature'); return event;}},checkout:{sessions:{retrieve:async()=>({metadata}),update:async(_id,input)=>Object.assign(metadata,input.metadata)}}};
const filename=require('node:path').resolve('app/api/stripe/webhook/route.ts');
const compiled=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const mod=new Module(filename,module);mod.filename=filename;mod.paths=module.paths;
const original=mod.require.bind(mod);mod.require=(name)=>name==='../../../lib/stripe'?{stripe}:original(name);mod._compile(compiled,filename);
const offer={id:'offer1',seller_id:'seller1',home:'<Barcelona>',away:'Madrid',match_date:'2026-12-01',stadium:'Camp Nou',price_eur:100,status:'reserved',reserved_by:'buyer1'};
global.fetch=async(url,init={})=>{
 if(url.includes('/orders?')) return Response.json(persisted?[{id:'order1'}]:[]);
 if(url.includes('/ticket_offers?')) return Response.json([offer]);
 if(url.includes('/rpc/complete_ticket_order')){rpcCalls++;persisted=true;offer.status='sold';assert.equal(JSON.parse(init.body).p_session_id,'cs_test');return Response.json('order1');}
 if(url.includes('/buyer_profiles?')) return Response.json([{first_name:'Max <script>',last_name:'Muster',phone:'+34 123'}]);
 if(url.includes('/admin/users/')) return Response.json({email:'seller@example.test'});
 if(url==='https://api.resend.com/emails'){mails.push({body:JSON.parse(init.body),headers:init.headers});return failMail?Response.json({error:'provider unavailable'},{status:503}):Response.json({id:'mail'+mails.length});}
 throw Error('Unexpected fetch '+url);
};
const request=()=>new Request('http://localhost/api/stripe/webhook',{method:'POST',headers:{'stripe-signature':'test'},body:'{}'});
const paid={id:'cs_test',payment_status:'paid',metadata:{pasespain_buyer_id:'buyer1',pasespain_buyer_email:'buyer@example.test',pasespain_offer_ids:'offer1'}};
(async()=>{
 badSignature=true;assert.equal((await mod.exports.POST(request())).status,400);assert.equal(rpcCalls,0);badSignature=false;
 event={type:'checkout.session.completed',data:{object:{...paid,payment_status:'unpaid'}}};assert.equal((await mod.exports.POST(request())).status,200);assert.equal(rpcCalls,0);
 event={type:'checkout.session.completed',data:{object:paid}};failMail=true;
 assert.equal((await mod.exports.POST(request())).status,500);assert.equal(persisted,true);assert.equal(Object.keys(metadata).length,0);
 failMail=false;assert.equal((await mod.exports.POST(request())).status,200);
 assert.equal(mails.at(-2).body.to[0],'seller@example.test');assert.match(mails.at(-2).body.html,/Max &lt;script&gt;/);assert.match(mails.at(-2).body.html,/order1/);assert.match(mails.at(-2).body.html,/\+34 123/);assert.equal(Object.keys(metadata).length,2);
 const count=mails.length;assert.equal((await mod.exports.POST(request())).status,200);assert.equal(mails.length,count);
 event.type='checkout.session.async_payment_succeeded';assert.equal((await mod.exports.POST(request())).status,200);assert.equal(mails.length,count);
 delete process.env.RESEND_API_KEY;assert.equal((await mod.exports.POST(request())).status,500);assert.equal(persisted,true);
 console.log('PASS: invalid signature, unpaid checkout, durable order on mail failure, retry, HTML escaping, buyer/seller recipient, order number, duplicate notification suppression, async payment, missing provider key');
})().catch(e=>{console.error(e);process.exitCode=1});
