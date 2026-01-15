import nodemailer from 'nodemailer';

// Create transporter lazily to ensure environment variables are loaded
function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

const fromName = 'Skripta';

export async function sendEmailVerification(email: string, verificationCode: string, username: string) {
  try {
    const transporter = getTransporter();
    const fromEmail = process.env.GMAIL_USER;

    const result = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: 'Potvrdite svoj email - Skripta',
      html: `
        <!DOCTYPE html>
        <html lang="hr">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Potvrdite svoj email</title>
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
                background: linear-gradient(135deg, #10B981 0%, #0066CC 100%);
                padding: 32px 24px;
                text-align: center;
              }

              .brand {
                font-size: 32px;
                font-weight: 800;
                color: #ffffff;
                margin: 0 0 8px 0;
                letter-spacing: -0.5px;
              }

              .title {
                font-size: 20px;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.95);
                margin: 0;
              }

              .content {
                padding: 20px 24px;
              }

              .greeting {
                font-size: 18px;
                font-weight: 700;
                color: #1c1917;
                margin-bottom: 16px;
              }

              .message {
                font-size: 15px;
                color: #44403c;
                margin-bottom: 24px;
                line-height: 1.7;
              }

              .code-box {
                background: linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%);
                border: 3px solid #10B981;
                border-radius: 12px;
                padding: 32px 24px;
                margin: 32px 0;
                text-align: center;
              }

              .code-label {
                font-size: 14px;
                font-weight: 700;
                color: #1c1917;
                margin-bottom: 16px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              .code {
                font-size: 48px;
                font-weight: 800;
                letter-spacing: 12px;
                background: linear-gradient(135deg, #10B981 0%, #0066CC 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-family: 'Courier New', Courier, monospace;
                margin: 16px 0;
                display: inline-block;
              }

              .expiry {
                margin-top: 16px;
                font-size: 14px;
                font-weight: 600;
                color: #10B981;
              }

              .steps {
                background: #ffffff;
                border: 2px solid #e7e5e4;
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
              }

              .steps-title {
                font-size: 15px;
                font-weight: 700;
                color: #1c1917;
                margin-bottom: 16px;
              }

              .steps ol {
                margin: 0;
                padding-left: 24px;
                counter-reset: step-counter;
                list-style: none;
              }

              .steps li {
                font-size: 15px;
                color: #44403c;
                margin-bottom: 12px;
                line-height: 1.7;
                counter-increment: step-counter;
                position: relative;
                padding-left: 8px;
              }

              .steps li:before {
                content: counter(step-counter);
                position: absolute;
                left: -24px;
                top: 0;
                width: 24px;
                height: 24px;
                background: linear-gradient(135deg, #10B981 0%, #0066CC 100%);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
              }

              .alert {
                background: #fef3c7;
                border: 2px solid #f59e0b;
                border-radius: 12px;
                padding: 20px;
                margin: 24px 0;
              }

              .alert-title {
                font-size: 15px;
                font-weight: 700;
                color: #92400e;
                margin-bottom: 8px;
              }

              .alert-text {
                font-size: 14px;
                color: #78350f;
                line-height: 1.6;
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
                  padding: 4px;
                }

                .card {
                  border-radius: 0;
                }

                .header {
                  padding: 24px 16px;
                }

                .brand {
                  font-size: 28px;
                }

                .title {
                  font-size: 18px;
                }

                .content, .footer {
                  padding: 20px 16px;
                }

                .code {
                  font-size: 32px;
                  letter-spacing: 8px;
                }

                .code-box {
                  padding: 24px 16px;
                  margin: 24px 0;
                }

                .steps li:before {
                  width: 20px;
                  height: 20px;
                  font-size: 11px;
                  left: -20px;
                }
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="card">
                <!-- Header -->
                <div class="header">
                  <h1 class="brand">Skripta</h1>
                  <p class="title">Dobrodošli!</p>
                </div>

                <!-- Content -->
                <div class="content">
                  <p class="greeting">Pozdrav, ${username}!</p>

                  <p class="message">
                    Hvala što ste se pridružili Skripta zajednici!<br><br>
                    Kako biste mogli u potpunosti koristiti sve funkcionalnosti, molimo potvrdite svoju email adresu pomoću koda ispod.
                  </p>

                  <!-- Code Box -->
                  <div class="code-box">
                    <div class="code-label">Verifikacijski kod</div>
                    <div class="code">${verificationCode}</div>
                    <div class="expiry">Vrijedi 15 minuta</div>
                  </div>

                  <!-- Steps -->
                  <div class="steps">
                    <div class="steps-title">Za potvrdu email adrese:</div>
                    <ol>
                      <li>Idite na stranicu za verifikaciju</li>
                      <li>Unesite ovaj kod</li>
                      <li>Počnite koristiti Skripta</li>
                    </ol>
                  </div>

                  <!-- Alert -->
                  <div class="alert">
                    <div class="alert-title">Niste se registrirali?</div>
                    <div class="alert-text">
                      Ako niste kreirali račun na Skripta, ignorirajte ovaj email. Vaš email neće biti registriran.
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                  <p class="footer-text"><strong>Skripta</strong></p>
                  <p class="footer-text">Ovaj email je automatski generiran, molimo ne odgovarajte na njega.</p>
                  <p class="footer-text" style="margin-top: 12px; font-size: 12px;">
                    © ${new Date().getFullYear()} Skripta. Sva prava pridržana.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true, id: result.messageId };
  } catch (error) {
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, resetCode: string) {
  try {
    const transporter = getTransporter();
    const fromEmail = process.env.GMAIL_USER;

    const result = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: 'Resetiranje lozinke - Skripta',
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
                background: linear-gradient(135deg, #E03131 0%, #0066CC 100%);
                padding: 32px 24px;
                text-align: center;
              }

              .brand {
                font-size: 32px;
                font-weight: 800;
                color: #ffffff;
                margin: 0 0 8px 0;
                letter-spacing: -0.5px;
              }

              .title {
                font-size: 20px;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.95);
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
                background: linear-gradient(135deg, #fef2f2 0%, #eff6ff 100%);
                border: 3px solid #E03131;
                border-radius: 12px;
                padding: 32px 24px;
                margin: 32px 0;
                text-align: center;
              }

              .code-label {
                font-size: 14px;
                font-weight: 700;
                color: #1c1917;
                margin-bottom: 16px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              .code {
                font-size: 48px;
                font-weight: 800;
                letter-spacing: 12px;
                background: linear-gradient(135deg, #E03131 0%, #0066CC 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-family: 'Courier New', Courier, monospace;
                margin: 16px 0;
                display: inline-block;
              }

              .expiry {
                margin-top: 16px;
                font-size: 14px;
                font-weight: 600;
                color: #E03131;
              }

              .steps {
                background: #ffffff;
                border: 2px solid #e7e5e4;
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
              }

              .steps-title {
                font-size: 15px;
                font-weight: 700;
                color: #1c1917;
                margin-bottom: 16px;
              }

              .steps ol {
                margin: 0;
                padding-left: 24px;
                counter-reset: step-counter;
                list-style: none;
              }

              .steps li {
                font-size: 15px;
                color: #44403c;
                margin-bottom: 12px;
                line-height: 1.7;
                counter-increment: step-counter;
                position: relative;
                padding-left: 8px;
              }

              .steps li:before {
                content: counter(step-counter);
                position: absolute;
                left: -24px;
                top: 0;
                width: 24px;
                height: 24px;
                background: linear-gradient(135deg, #E03131 0%, #0066CC 100%);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
              }

              .alert {
                background: #fef3c7;
                border: 2px solid #f59e0b;
                border-radius: 12px;
                padding: 20px;
                margin: 24px 0;
              }

              .alert-title {
                font-size: 15px;
                font-weight: 700;
                color: #92400e;
                margin-bottom: 8px;
              }

              .alert-text {
                font-size: 14px;
                color: #78350f;
                line-height: 1.6;
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
                  padding: 4px;
                }

                .card {
                  border-radius: 0;
                }

                .header {
                  padding: 24px 16px;
                }

                .brand {
                  font-size: 28px;
                }

                .title {
                  font-size: 18px;
                }

                .content, .footer {
                  padding: 20px 16px;
                }

                .code {
                  font-size: 32px;
                  letter-spacing: 8px;
                }

                .code-box {
                  padding: 24px 16px;
                  margin: 24px 0;
                }

                .steps li:before {
                  width: 20px;
                  height: 20px;
                  font-size: 11px;
                  left: -20px;
                }
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="card">
                <!-- Header -->
                <div class="header">
                  <h1 class="brand">Skripta</h1>
                  <p class="title">Resetiranje lozinke</p>
                </div>

                <!-- Content -->
                <div class="content">
                  <p class="message">
                    <strong>Pozdrav!</strong><br><br>
                    Primili smo zahtjev za resetiranje lozinke vašeg Skripta računa.
                    Koristite kod ispod kako biste postavili novu lozinku.
                  </p>

                  <!-- Code Box -->
                  <div class="code-box">
                    <div class="code-label">Kod za resetiranje</div>
                    <div class="code">${resetCode}</div>
                    <div class="expiry">Vrijedi 15 minuta</div>
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
                    <div class="alert-title">Niste zatražili resetiranje?</div>
                    <div class="alert-text">
                      Ako niste zatražili resetiranje lozinke, ignorirajte ovaj email. Vaš račun je siguran.
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                  <p class="footer-text"><strong>Skripta</strong></p>
                  <p class="footer-text">Ovaj email je automatski generiran, molimo ne odgovarajte na njega.</p>
                  <p class="footer-text" style="margin-top: 12px; font-size: 12px;">
                    © ${new Date().getFullYear()} Skripta. Sva prava pridržana.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true, id: result.messageId };
  } catch (error) {
    return { success: false, error };
  }
}
