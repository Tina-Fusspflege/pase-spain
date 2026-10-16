import { createHmac } from "node:crypto";

export async function takeAiAllowance(request: Request, site: "pasespain" | "hofnacht"): Promise<Response | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const unavailable = () => Response.json({ error: site === "pasespain" ? "El asistente no está disponible temporalmente." : "Der Assistent ist vorübergehend nicht verfügbar." }, {status:503,headers:{"Cache-Control":"no-store","Retry-After":"30"}});
  if (!base || !key || key === "[SENSITIVE]") return unavailable();
  // Vercel overwrites X-Forwarded-For at its edge. No cookie/body identifier is trusted.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const day = new Date().toISOString().slice(0,10);
  const clientHash = createHmac("sha256",key).update(`${site}:${day}:${ip}`).digest("hex");
  try {
    const response = await fetch(`${base}/rest/v1/rpc/take_ai_allowance`, {
      method:"POST", headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
      body:JSON.stringify({p_site:site,p_client_hash:clientHash}), cache:"no-store",signal:AbortSignal.timeout(5000)
    });
    if (!response.ok) { console.error("AI quota backend unavailable",site,response.status); return unavailable(); }
    const result = await response.json() as {allowed?:boolean;retry_after?:number;scope?:string};
    if (result.allowed === true) return null;
    if (result.allowed !== false) return unavailable();
    const retry = Math.max(1,Math.min(86400,Math.ceil(Number(result.retry_after)||60)));
    return Response.json({error:site === "pasespain" ? "Se ha alcanzado el límite de consultas. Inténtalo más tarde." : "Das Anfragelimit ist erreicht. Bitte versuche es später erneut."}, {status:429,headers:{"Retry-After":String(retry),"Cache-Control":"no-store"}});
  } catch { return unavailable(); }
}

export async function readAiBody(request: Request): Promise<string | Response> {
  const origin = request.headers.get("origin");
  if (!origin || ![new URL(request.url).origin,"https://hofnacht.com","https://www.hofnacht.com"].includes(origin)) return Response.json({error:"Anfrage nicht erlaubt."},{status:403});
  const reader=request.body?.getReader(); if (!reader) return "";
  let size=0;const chunks:Uint8Array[]=[];
  for (;;) { const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();return Response.json({error:"Anfrage zu gross."},{status:413});}chunks.push(value); }
  const bytes=new Uint8Array(size);let pos=0;for(const chunk of chunks){bytes.set(chunk,pos);pos+=chunk.length;}return new TextDecoder().decode(bytes);
}
