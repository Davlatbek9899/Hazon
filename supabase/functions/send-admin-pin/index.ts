import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, pin } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not found");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Hazon <noreply@hazon.faith>",
        to: [email],
        subject: "Your Hazon Admin PIN",
        html: `
          <div style="background:#F5F5F3;padding:40px 20px;font-family:-apple-system,sans-serif;">
            <div style="max-width:420px;margin:0 auto;background:#fff;border-radius:24px;padding:48px;border:1px solid rgba(0,0,0,0.06);">
              <h1 style="font-size:28px;font-weight:400;margin:0 0 8px;color:#111;">Hazon</h1>
              <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;opacity:0.4;margin:0 0 40px;">Admin Access</p>
              <p style="font-size:13px;opacity:0.6;margin:0 0 32px;line-height:1.6;">
                Your one-time PIN for admin dashboard access.
              </p>
              <div style="background:#111;border-radius:16px;padding:32px;text-align:center;margin-bottom:32px;">
                <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin:0 0 16px;">Your PIN</p>
                <p style="font-size:42px;font-weight:700;color:#fff;letter-spacing:8px;margin:0;font-family:monospace;">${pin}</p>
              </div>
              <p style="font-size:11px;opacity:0.3;text-align:center;margin:0;line-height:1.6;">
                Do not share this PIN with anyone.
              </p>
            </div>
          </div>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`Resend error: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("send-admin-pin error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});