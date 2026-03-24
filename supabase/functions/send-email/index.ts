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
    const { type, email, username } = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not found");
    if (!email) throw new Error("Email is required");

    let subject = "";
    let html = "";

    if (type === "welcome") {
      subject = "Welcome to Hazon";
      html = `
        <div style="background:#F5F5F3;padding:40px 20px;font-family:-apple-system,sans-serif;">
          <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:24px;padding:48px;border:1px solid rgba(0,0,0,0.06);">
            <h1 style="font-size:28px;font-weight:400;margin:0 0 8px;color:#111;">Hazon</h1>
            <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;opacity:0.4;margin:0 0 32px;">A Clear Vision</p>
            <p style="font-size:15px;color:#111;margin:0 0 16px;">Hi ${username || "friend"},</p>
            <p style="font-size:14px;opacity:0.7;line-height:1.7;margin:0 0 32px;">
              Welcome to Hazon. You've taken the first step toward seeking clarity in a different way — one that is rooted in reflection, wisdom, and the steady guidance of God's Word.
            </p>
            <p style="font-size:14px;opacity:0.7;line-height:1.7;margin:0 0 32px;">
              Hazon is designed to help you slow down, think deeply, and discern your next steps with intention. Through guided conversation grounded in Scripture, you will be able to shape a clear vision for the path ahead.
            </p>
            <a href="https://hazon.faith" style="display:inline-block;background:#111;color:#fff;padding:14px 28px;border-radius:9999px;font-size:11px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;font-weight:600;">Begin Your Journey</a>
            <p style="font-size:11px;opacity:0.3;margin:32px 0 0;line-height:1.6;">Moments like this are simple, but they matter. Clarity is built on small, intentional steps — and this is how you start yours.</p>
          </div>
        </div>
      `;
    } else if (type === "vision-ready") {
      subject = "Your Vision is Ready";
      html = `
        <div style="background:#F5F5F3;padding:40px 20px;font-family:-apple-system,sans-serif;">
          <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:24px;padding:48px;border:1px solid rgba(0,0,0,0.06);">
            <h1 style="font-size:28px;font-weight:400;margin:0 0 8px;color:#111;">Hazon</h1>
            <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;opacity:0.4;margin:0 0 32px;">A Clear Vision</p>
            <p style="font-size:15px;color:#111;margin:0 0 16px;">Hi ${username || "friend"},</p>
            <p style="font-size:14px;opacity:0.7;line-height:1.7;margin:0 0 32px;">
              Your new vision has been successfully created. You took the time to reflect, to think deeply, and to bring your situation into the light. That matters. Clarity begins there.
            </p>
            <p style="font-size:14px;opacity:0.7;line-height:1.7;margin:0 0 32px;">
              Your vision is now ready for you to explore. It brings together your thoughts, the direction you've been shaping, and guidance rooted in the steady wisdom of Scripture.
            </p>
            <a href="https://hazon.faith" style="display:inline-block;background:#111;color:#fff;padding:14px 28px;border-radius:9999px;font-size:11px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;font-weight:600;">View Your Vision</a>
            <p style="font-size:11px;opacity:0.3;margin:32px 0 0;line-height:1.6;">Now unlock your vision. Take a moment and approach it with intention.</p>
          </div>
        </div>
      `;
    } else if (type === "vision-unlocked") {
      subject = "Your Vision Has Been Unlocked";
      html = `
        <div style="background:#F5F5F3;padding:40px 20px;font-family:-apple-system,sans-serif;">
          <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:24px;padding:48px;border:1px solid rgba(0,0,0,0.06);">
            <h1 style="font-size:28px;font-weight:400;margin:0 0 8px;color:#111;">Hazon</h1>
            <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;opacity:0.4;margin:0 0 32px;">A Clear Vision</p>
            <p style="font-size:15px;color:#111;margin:0 0 16px;">Hi ${username || "friend"},</p>
            <p style="font-size:14px;opacity:0.7;line-height:1.7;margin:0 0 32px;">
              Congratulations — your payment has been received, and your vision is now unlocked.
            </p>
            <p style="font-size:14px;opacity:0.7;line-height:1.7;margin:0 0 32px;">
              What was once forming is now clear before you. This is your vision shaped through reflection and the Word of God, and it is ready to be walked out.
            </p>
            <a href="https://hazon.faith" style="display:inline-block;background:#111;color:#fff;padding:14px 28px;border-radius:9999px;font-size:11px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;font-weight:600;">Read Your Vision</a>
            <p style="font-size:11px;opacity:0.3;margin:32px 0 0;line-height:1.6;">Take your time as you read through it. Don't rush. Let each part settle. Clarity is not something you see, it's something you step into.</p>
          </div>
        </div>
      `;
    } else {
      throw new Error("Invalid email type");
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
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("send-email error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
