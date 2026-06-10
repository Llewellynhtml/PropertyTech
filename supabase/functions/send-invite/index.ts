import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { to, agencyName, inviteLink } = await req.json();

    if (!to || !agencyName || !inviteLink) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, agencyName, inviteLink' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY secret is not set' }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>You're invited to PropPost</title>
      </head>
      <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

                <!-- Header -->
                <tr>
                  <td style="background:#111827;padding:32px 40px;">
                    <p style="margin:0;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">PropPost</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:2px;">Real Estate Marketing</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <p style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.5px;">You're invited!</p>
                    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                      <strong style="color:#374151;">${agencyName}</strong> has invited you to join their agency on PropPost — South Africa's real estate marketing platform.
                    </p>

                    <!-- CTA -->
                    <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                      <tr>
                        <td style="background:#4f46e5;border-radius:12px;">
                          <a href="${inviteLink}"
                            style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;">
                            Accept invitation →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">Or copy this link into your browser:</p>
                    <p style="margin:0 0 32px;font-size:12px;color:#6366f1;word-break:break-all;">${inviteLink}</p>

                    <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 24px;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                      This link expires in <strong>7 days</strong>. If you weren't expecting this invitation, you can ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;">
                    <p style="margin:0;font-size:11px;color:#d1d5db;text-align:center;">Sent by PropPost on behalf of ${agencyName}</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PropPost Invites <invites@proppost.co.za>',
        to: [to],
        subject: `${agencyName} invited you to join PropPost`,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('Resend error:', result);
      return new Response(
        JSON.stringify({ error: result.message || 'Failed to send email' }),
        { status: res.status, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
