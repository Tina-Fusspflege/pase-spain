const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const Module=require('node:module');
process.env.NEXT_PUBLIC_SUPABASE_URL='https://db.test';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='test';process.env.SUPABASE_SERVICE_ROLE_KEY='test';process.env.NEXT_PUBLIC_SITE_URL='http://localhost:3000';
let buyer=true,reserved=true,self=false,creates=0,reserves=0,releases=0,input;
let quantity=1;
const id='11111111-1111-1111-1111-111111111111';
const stripe={checkout:{sessions:{create:async body=>{creates++;input=body;return {url:'https://checkout.stripe.test/session'};}}}};
const filename=require('node:path').resolve('app/api/stripe/checkout/route.ts');const mod=new Module(filename,module);mod.filename=filename;mod.paths=module.paths;const original=mod.require.bind(mod);mod.require=name=>name==='../../../lib/stripe'?{stripe}:original(name);mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
global.fetch=async(url,init={})=>{
 if(url.endsWith('/auth/v1/user'))return Response.json({id:'buyer1',email:'buyer@example.test'});
 if(url.includes('/buyer_profiles?'))return Response.json(buyer?[{user_id:'buyer1'}]:[]);
 if(url.includes('/rpc/reserve_ticket_offer')){reserves++;return Response.json(reserved);}
 if(url.includes('/ticket_offers?')&&init.method==='PATCH'){releases++;return new Response(null,{status:204});}
 if(url.includes('/ticket_offers?'))return Response.json([{id,seller_id:self?'buyer1':'seller1',home:'Barcelona',away:'Madrid',price_eur:100,details:'Anzahl Tickets: '+quantity,quantity,status:'reserved',reserved_by:'buyer1'}]);
 throw Error('Unexpected URL '+url);
};
const request=(body,auth=true)=>new Request('http://localhost/api/stripe/checkout',{method:'POST',headers:{'Content-Type':'application/json',origin:'https://evil.test',...(auth?{authorization:'Bearer test'}:{})},body:JSON.stringify(body)});
(async()=>{
 assert.equal((await mod.exports.POST(request({offerIds:[id]},false))).status,401);
 buyer=false;assert.equal((await mod.exports.POST(request({offerIds:[id]}))).status,403);buyer=true;
 assert.equal((await mod.exports.POST(request({offerIds:['invalid']}))).status,400);assert.equal(reserves,0);
 reserved=false;assert.equal((await mod.exports.POST(request({offerIds:[id]}))).status,409);reserved=true;
 self=true;assert.equal((await mod.exports.POST(request({offerIds:[id]}))).status,500);assert.equal(releases,1);self=false;
 assert.equal((await mod.exports.POST(request({offerIds:[id,id]}))).status,200);assert.equal(creates,1);assert.equal(input.line_items.length,2);assert.equal(input.line_items[1].price_data.unit_amount,1000);assert.ok(input.success_url.startsWith('http://localhost:3000/'));assert.equal(input.metadata.pasespain_offer_ids,id);
 quantity=2;assert.equal((await mod.exports.POST(request({offerIds:[id]}))).status,200);assert.equal(input.line_items[0].quantity,2);assert.equal(input.line_items[1].price_data.unit_amount,2000);
 console.log('PASS: auth, buyer profile, invalid offer ID, reservation conflict, self-purchase releases reservation, deduplication, authoritative price/fee, trusted return URL');
})().catch(error=>{console.error(error);process.exitCode=1});
