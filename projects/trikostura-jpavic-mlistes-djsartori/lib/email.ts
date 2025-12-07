import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, resetCode: string) {
  try {
    await resend.emails.send({
      from: 'Studentski Forum <onboarding@resend.dev>', // Change this in production
      to: email,
      subject: '🔐 Resetiranje lozinke - Studentski Forum',
      html: `
        <!DOCTYPE html>
        <html lang="hr">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <meta name="supported-color-schemes" content="light">
            <title>Resetiranje lozinke</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                background: linear-gradient(135deg, #fef2f2 0%, #eff6ff 100%);
                padding: 20px;
              }

              .email-wrapper {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
              }

              .header {
                background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #2563eb 100%);
                padding: 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
              }

              .header::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                animation: pulse 3s ease-in-out infinite;
              }

              @keyframes pulse {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 0.8; }
              }

              .logo {
                position: relative;
                z-index: 1;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 80px;
                height: 80px;
                background: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                margin-bottom: 20px;
              }

              .logo-text {
                font-size: 48px;
                font-weight: 800;
                color: white;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
              }

              .header h1 {
                position: relative;
                z-index: 1;
                color: white;
                font-size: 28px;
                font-weight: 700;
                margin: 0;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }

              .header p {
                position: relative;
                z-index: 1;
                color: rgba(255, 255, 255, 0.9);
                font-size: 14px;
                margin-top: 8px;
              }

              .content {
                padding: 40px 30px;
                background: #ffffff;
              }

              .greeting {
                font-size: 16px;
                color: #374151;
                margin-bottom: 20px;
              }

              .message {
                font-size: 15px;
                color: #4b5563;
                margin-bottom: 30px;
                line-height: 1.7;
              }

              .code-container {
                background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                border: 2px dashed #e5e7eb;
                border-radius: 12px;
                padding: 30px;
                margin: 30px 0;
                text-align: center;
                position: relative;
                overflow: hidden;
              }

              .code-container::before {
                content: '🔐';
                position: absolute;
                top: 10px;
                right: 10px;
                font-size: 24px;
                opacity: 0.3;
              }

              .code-label {
                font-size: 13px;
                font-weight: 600;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 15px;
              }

              .code {
                font-size: 42px;
                font-weight: 800;
                letter-spacing: 12px;
                color: #2563eb;
                font-family: 'Courier New', monospace;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                padding: 10px;
                display: inline-block;
                text-shadow: 0 0 30px rgba(37, 99, 235, 0.3);
              }

              .expiry {
                margin-top: 15px;
                font-size: 13px;
                color: #6b7280;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
              }

              .expiry::before {
                content: '⏱️';
              }

              .steps {
                background: #f9fafb;
                border-radius: 12px;
                padding: 25px;
                margin: 25px 0;
              }

              .steps-title {
                font-size: 15px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 15px;
              }

              .steps ol {
                margin: 0;
                padding-left: 20px;
              }

              .steps li {
                font-size: 14px;
                color: #4b5563;
                margin-bottom: 8px;
                line-height: 1.6;
              }

              .steps li:last-child {
                margin-bottom: 0;
              }

              .warning {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border-left: 4px solid #f59e0b;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                display: flex;
                gap: 12px;
              }

              .warning-icon {
                font-size: 24px;
                flex-shrink: 0;
              }

              .warning-content {
                flex: 1;
              }

              .warning-title {
                font-size: 14px;
                font-weight: 700;
                color: #92400e;
                margin-bottom: 4px;
              }

              .warning-text {
                font-size: 13px;
                color: #78350f;
                line-height: 1.5;
              }

              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #dc2626 0%, #2563eb 100%);
                color: white;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 15px;
                margin: 25px 0;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                transition: transform 0.2s;
              }

              .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
              }

              .footer {
                background: #f9fafb;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
              }

              .footer-brand {
                font-weight: 700;
                font-size: 16px;
                color: #1f2937;
                margin-bottom: 8px;
              }

              .footer-text {
                font-size: 13px;
                color: #6b7280;
                line-height: 1.6;
              }

              .footer-links {
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #e5e7eb;
              }

              .footer-link {
                color: #2563eb;
                text-decoration: none;
                font-size: 13px;
                margin: 0 10px;
              }

              .footer-link:hover {
                text-decoration: underline;
              }

              .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
                margin: 30px 0;
              }

              @media only screen and (max-width: 600px) {
                .email-wrapper {
                  border-radius: 0;
                }

                .header, .content, .footer {
                  padding: 30px 20px;
                }

                .code {
                  font-size: 32px;
                  letter-spacing: 8px;
                }

                .header h1 {
                  font-size: 24px;
                }
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <!-- Header -->
              <div class="header">
                <div class="logo">
                  <div class="logo-text">S</div>
                </div>
                <h1>Resetiranje lozinke</h1>
                <p>Siguran proces za povrat pristupa vašem računu</p>
              </div>

              <!-- Content -->
              <div class="content">
                <div class="greeting">
                  Pozdrav! 👋
                </div>

                <div class="message">
                  Primili smo zahtjev za resetiranje lozinke vašeg računa na <strong>Studentskom Forumu</strong>.
                  Koristite donji kod kako biste nastavili s procesom resetiranja.
                </div>

                <!-- Code Box -->
                <div class="code-container">
                  <div class="code-label">Vaš sigurnosni kod</div>
                  <div class="code">${resetCode}</div>
                  <div class="expiry">
                    <strong>Vrijedi 15 minuta</strong>
                  </div>
                </div>

                <!-- Steps -->
                <div class="steps">
                  <div class="steps-title">📋 Kako resetirati lozinku:</div>
                  <ol>
                    <li>Vratite se na stranicu za resetiranje lozinke</li>
                    <li>Unesite 6-znamenkasti kod prikazan gore</li>
                    <li>Kreirajte novu, sigurnu lozinku</li>
                    <li>Prijavite se s novom lozinkom</li>
                  </ol>
                </div>

                <!-- Warning -->
                <div class="warning">
                  <div class="warning-icon">⚠️</div>
                  <div class="warning-content">
                    <div class="warning-title">Niste zatražili resetiranje?</div>
                    <div class="warning-text">
                      Ako niste zatražili resetiranje lozinke, možete slobodno ignorirati ovaj email.
                      Vaš račun ostaje potpuno siguran i zaštićen.
                    </div>
                  </div>
                </div>

                <div class="divider"></div>

                <div class="message" style="margin-bottom: 0; font-size: 13px; color: #6b7280;">
                  Hvala što koristite Studentski Forum! Ako imate bilo kakvih pitanja,
                  slobodno nas kontaktirajte.
                </div>
              </div>

              <!-- Footer -->
              <div class="footer">
                <div class="footer-brand">Studentski Forum</div>
                <div class="footer-text">
                  Ovaj email je automatski generiran. Molimo ne odgovarajte direktno na ovu poruku.
                </div>
                <div class="footer-text" style="margin-top: 10px; font-size: 12px;">
                  © ${new Date().getFullYear()} Studentski Forum. Sva prava pridržana.
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}
