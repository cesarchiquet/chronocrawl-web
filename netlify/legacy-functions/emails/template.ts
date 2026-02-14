export const EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>ChronoCrawl</title>
  </head>
  <body style="margin:0; padding:0; background-color:#0b1020; font-family:Inter, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:40px 20px;">
          
          <table width="100%" style="max-width:560px; background:#0f172a; border-radius:14px; padding:32px; color:#e5e7eb;">
            
            <tr>
              <td style="text-align:center; padding-bottom:24px;">
                <h1 style="margin:0; font-size:26px; color:#8b5cf6;">
                  ChronoCrawl
                </h1>
                <p style="margin:8px 0 0; font-size:14px; color:#94a3b8;">
                  Veille concurrentielle intelligente
                </p>
              </td>
            </tr>

            <tr>
              <td style="font-size:16px; line-height:1.6;">
                <h2 style="margin-top:0; color:#ffffff;">
                  {{TITLE}}
                </h2>

                <p>
                  {{MESSAGE}}
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding-top:24px;">
                <a
                  href="{{CTA_URL}}"
                  style="
                    background:#8b5cf6;
                    color:#ffffff;
                    text-decoration:none;
                    padding:14px 24px;
                    border-radius:10px;
                    font-weight:600;
                    display:inline-block;
                  "
                >
                  {{CTA_LABEL}}
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding-top:32px; font-size:12px; color:#64748b; text-align:center;">
                ChronoCrawl © 2026<br />
                Tu reçois cet email car tu t’es inscrit à l’accès anticipé.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;