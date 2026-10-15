// This limits cross-site browser use and request size; it is not a global spending cap.
export async function readAssistantRequest(request: Request, maxBytes = 16384): Promise<string | Response> {
  const origin = request.headers.get("origin");
  const allowed = [new URL(request.url).origin, "https://pasespain.es", "https://www.pasespain.es"];
  const error = (status: number, message: string) => Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  if (!origin || !allowed.includes(origin)) return error(403, "Solicitud no permitida.");
  const declared = Number(request.headers.get("content-length"));
  if (declared > maxBytes) return error(413, "Solicitud demasiado grande.");
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); return error(413, "Solicitud demasiado grande."); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(bytes);
}
