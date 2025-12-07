import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, resetCode: string) {
  try {
    await resend.emails.send({
      from: 'Studentski Forum <onboarding@resend.dev>', // Change this in production
      to: email,
      subject: 'Resetiranje lozinke - Studentski Forum',
      html: `
        <!DOCTYPE html>
        <html lang="hr">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Resetiranje lozinke</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1c1917;
                background: linear-gradient(135deg, #fef2f2 0%, #ffffff 50%, #eff6ff 100%);
                padding: 12px;
              }

              .wrapper {
                max-width: 600px;
                margin: 0 auto;
              }

              .card {
                background: #ffffff;
                border-radius: 8px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                border: 1px solid #e7e5e4;
                overflow: hidden;
              }

              .header {
                padding: 24px 24px 12px;
                text-align: center;
              }

              .logo-container {
                display: flex;
                justify-content: center;
                margin-bottom: 12px;
              }

              .title {
                font-size: 24px;
                font-weight: 700;
                color: #1c1917;
                margin: 0 0 6px 0;
              }

              .subtitle {
                font-size: 14px;
                color: #78716c;
                margin: 0;
              }

              .content {
                padding: 20px 24px;
              }

              .message {
                font-size: 15px;
                color: #44403c;
                margin-bottom: 24px;
                line-height: 1.7;
              }

              .code-box {
                background: #f9fafb;
                border: 2px solid #e7e5e4;
                border-radius: 8px;
                padding: 24px;
                margin: 24px 0;
                text-align: center;
              }

              .code-label {
                font-size: 13px;
                font-weight: 600;
                color: #78716c;
                margin-bottom: 12px;
              }

              .code {
                font-size: 36px;
                font-weight: 700;
                letter-spacing: 10px;
                color: #E03131;
                font-family: 'Courier New', Courier, monospace;
                margin: 8px 0;
              }

              .expiry {
                margin-top: 12px;
                font-size: 13px;
                color: #78716c;
              }

              .steps {
                background: #f9fafb;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
              }

              .steps-title {
                font-size: 14px;
                font-weight: 600;
                color: #1c1917;
                margin-bottom: 12px;
              }

              .steps ol {
                margin: 0;
                padding-left: 20px;
              }

              .steps li {
                font-size: 14px;
                color: #44403c;
                margin-bottom: 8px;
                line-height: 1.6;
              }

              .alert {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                border-radius: 6px;
                padding: 16px;
                margin: 20px 0;
              }

              .alert-title {
                font-size: 14px;
                font-weight: 700;
                color: #92400e;
                margin-bottom: 4px;
              }

              .alert-text {
                font-size: 13px;
                color: #78350f;
                line-height: 1.5;
              }

              .footer {
                background: #f9fafb;
                padding: 24px;
                text-align: center;
                border-top: 1px solid #e7e5e4;
              }

              .footer-text {
                font-size: 13px;
                color: #78716c;
                line-height: 1.6;
                margin: 4px 0;
              }

              @media only screen and (max-width: 600px) {
                body {
                  padding: 8px;
                }

                .card {
                  border-radius: 0;
                }

                .content, .header, .footer {
                  padding: 20px 16px;
                }

                .code {
                  font-size: 28px;
                  letter-spacing: 6px;
                }

                .title {
                  font-size: 20px;
                }
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="card">
                <!-- Header -->
                <div class="header">
                  <div class="logo-container">
                    <!-- Skripta Logo PNG (email-compatible) -->
                    <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://2025-intro-swe-bice.vercel.app'}/logo-email.png" alt="Skripta Logo" width="64" height="64" style="display: block; margin: 0 auto; border-radius: 12px;" />
                  </div>
                  <h1 class="title">Resetiraj lozinku</h1>
                  <p class="subtitle">Studentski Forum</p>
                </div>

                <!-- Content -->
                <div class="content">
                  <p class="message">
                    Pozdrav,<br><br>
                    Zatražili ste resetiranje lozinke za vaš račun na Studentskom Forumu.
                  </p>

                  <!-- Code Box -->
                  <div class="code-box">
                    <div class="code-label">Vaš kod za resetiranje:</div>
                    <div class="code">${resetCode}</div>
                    <div class="expiry">Kod vrijedi <strong>15 minuta</strong></div>
                  </div>

                  <!-- Steps -->
                  <div class="steps">
                    <div class="steps-title">Za resetiranje lozinke:</div>
                    <ol>
                      <li>Idite na stranicu za verifikaciju</li>
                      <li>Unesite ovaj kod</li>
                      <li>Unesite novu lozinku</li>
                    </ol>
                  </div>

                  <!-- Alert -->
                  <div class="alert">
                    <div class="alert-title">⚠️ Niste zatražili resetiranje?</div>
                    <div class="alert-text">
                      Ako niste zatražili resetiranje lozinke, ignorirajte ovaj email. Vaš račun je siguran.
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                  <p class="footer-text"><strong>Studentski Forum</strong></p>
                  <p class="footer-text">Ovaj email je automatski generiran, molimo ne odgovarajte na njega.</p>
                  <p class="footer-text" style="margin-top: 12px; font-size: 12px;">
                    © ${new Date().getFullYear()} Studentski Forum. Sva prava pridržana.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
