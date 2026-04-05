import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.in",
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_APP_PASSWORD,
  },
});

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export async function sendClientNotification(clientEmail, clientName, postTitle, clientId) {
  const greeting = getGreeting();
  const portalUrl = `https://studio.creatormonk.in/portal/${clientId}#content`;
  const logoUrl = `https://studio.creatormonk.in/logo1.png`;
  const year = new Date().getFullYear();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Content Ready</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <img src="${logoUrl}" alt="CreatorMonk" width="160" height="auto"
                style="display:block;max-width:160px;" />
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Orange top bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#d4511a;height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Card Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 40px 32px;">

                    <!-- Status pill -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="background:#fff4ee;border:1px solid #fcd9c4;border-radius:999px;padding:5px 14px;">
                          <span style="color:#d4511a;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                            ● Action Required
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Greeting -->
                    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#1a1714;letter-spacing:-0.02em;line-height:1.2;">
                      ${greeting},<br/><span style="color:#d4511a;">${clientName}</span>
                    </h1>

                    <!-- Subtext -->
                    <p style="margin:0 0 28px;font-size:15px;color:#78716c;line-height:1.65;">
                      Your content team at <strong style="color:#1a1714;">CreatorMonk</strong> has
                      prepared new content for your brand and it's ready for your approval before
                      it goes live.
                    </p>

                    <!-- Content preview card -->
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#faf9f6;border:1px solid #e8e4dd;border-radius:12px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a8a29e;">
                            New Deliverable
                          </p>
                          <p style="margin:0;font-size:16px;font-weight:600;color:#1a1714;">
                            ${postTitle}
                          </p>
                        </td>
                        <td style="padding:20px 24px;text-align:right;vertical-align:middle;">
                          <span style="background:#fff4ee;border:1px solid #fcd9c4;color:#d4511a;
                            font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;
                            padding:4px 10px;border-radius:6px;">
                            Pending Review
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="border-radius:10px;background:#d4511a;
                          box-shadow:0 4px 16px rgba(212,81,26,0.3);">
                          <a href="${portalUrl}"
                            style="display:inline-block;padding:14px 32px;color:#ffffff;
                            font-size:15px;font-weight:700;text-decoration:none;
                            letter-spacing:-0.01em;border-radius:10px;">
                            Review Content →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Fallback link -->
                    <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.6;">
                      Button not working?
                      <a href="${portalUrl}" style="color:#d4511a;text-decoration:underline;">
                        Click here
                      </a>
                    </p>

                  </td>
                </tr>
              </table>

              <!-- What to do section -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#faf9f6;border-top:1px solid #e8e4dd;padding:28px 40px;">
                    <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.1em;
                      text-transform:uppercase;color:#a8a29e;">
                      What to do next
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0 0 12px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:28px;vertical-align:top;">
                                <span style="display:inline-block;width:20px;height:20px;
                                  background:#d4511a;border-radius:50%;text-align:center;
                                  line-height:20px;font-size:10px;font-weight:700;color:white;">
                                  1
                                </span>
                              </td>
                              <td style="padding-left:8px;font-size:13px;color:#57534e;line-height:1.5;">
                                Click <strong style="color:#1a1714;">Review Content</strong> above to open your portal
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 0 12px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:28px;vertical-align:top;">
                                <span style="display:inline-block;width:20px;height:20px;
                                  background:#d4511a;border-radius:50%;text-align:center;
                                  line-height:20px;font-size:10px;font-weight:700;color:white;">
                                  2
                                </span>
                              </td>
                              <td style="padding-left:8px;font-size:13px;color:#57534e;line-height:1.5;">
                                Watch the content and read the proposed caption
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:28px;vertical-align:top;">
                                <span style="display:inline-block;width:20px;height:20px;
                                  background:#d4511a;border-radius:50%;text-align:center;
                                  line-height:20px;font-size:10px;font-weight:700;color:white;">
                                  3
                                </span>
                              </td>
                              <td style="padding-left:8px;font-size:13px;color:#57534e;line-height:1.5;">
                                <strong style="color:#1a1714;">Approve</strong> to greenlight it, or
                                <strong style="color:#1a1714;">Request Changes</strong> with your feedback
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#a8a29e;">
                © ${year} CreatorMonk. All rights reserved.
              </p>
              <p style="margin:0;font-size:11px;color:#c7c3bc;">
                You're receiving this because your brand is managed by CreatorMonk.<br/>
                <a href="https://studio.creatormonk.in" style="color:#d4511a;text-decoration:none;">
                  studio.creatormonk.in
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"CreatorMonk Studio" <${process.env.ZOHO_EMAIL}>`,
      to: clientEmail,
      subject: `Action Required: "${postTitle}" is ready for your review`,
      html,
    });
    // console.log("Email sent:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error };
  }
}