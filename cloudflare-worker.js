// Cloudflare Worker – proxy till OpenAI med streaming (SSE-liknande)
export default {
  async fetch(req, env) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(env),
      });
    }
    if (req.method !== 'POST') {
      return new Response('Not found', { status: 404, headers: corsHeaders(env) });
    }

    const { message, history = [], meta = {} } = await req.json();

    const system = `
Du är ProFit AI – en hjälpsam assistent för ProFit Nutrition (svenska).
Svara kort, tydligt och korrekt. 
Håll dig till kosttillskott, startpaket, råd och allmän träning/kost. 
Vänligen länka till /shop, /guider-och-rad eller /kontakt när det passar.
Avslöja aldrig API-nycklar och be inte om personuppgifter.
    `.trim();

    const messages = [
      { role: 'system', content: system },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    // Ring OpenAI Chat Completions m. stream
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.2,
        stream: true
      })
    });

    // Proxy vidare strömmen
    return new Response(r.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...corsHeaders(env)
      }
    });
  }
}

function corsHeaders(env) {
  const allow = env.ALLOWED_ORIGIN || '*'; // sätt till din domän för hård CORS
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
  };
}
