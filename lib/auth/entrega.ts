import nodemailer from "nodemailer";

// Camada de entrega de SMS e e-mail.
//
// E-mail: com SMTP_USER/SMTP_PASS no .env, envia de verdade (Gmail SMTP).
//         Sem SMTP configurado, loga no console (modo dev).
// SMS:    sem provedor por ora — loga no console; com AUTH_DEV_RETORNA_CODIGO=true
//         o código também volta na resposta da API (o app mostra "código de teste").
//         Para SMS real: plugar Twilio/Zenvia aqui, nada mais muda.

export const devolverCodigoEmDev =
  process.env.AUTH_DEV_RETORNA_CODIGO === "true";

const smtpConfigurado = Boolean(
  process.env.SMTP_USER && process.env.SMTP_PASS
);

const transporter = smtpConfigurado
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: (process.env.SMTP_PORT ?? "465") === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export async function enviarSms(telefone: string, mensagem: string) {
  console.log(`[fortn auth] SMS para ${telefone}: ${mensagem}`);
}

export async function enviarEmail(
  destinatario: string,
  assunto: string,
  corpo: string,
  linkBotao?: { rotulo: string; url: string }
) {
  if (!transporter) {
    console.log(
      `[fortn auth] E-mail (SMTP não configurado) para ${destinatario} — ${assunto}\n${corpo}` +
        (linkBotao ? `\n${linkBotao.url}` : "")
    );
    return;
  }

  const html = montarHtml(assunto, corpo, linkBotao);

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `fortn <${process.env.SMTP_USER}>`,
      to: destinatario,
      subject: assunto,
      text: corpo + (linkBotao ? `\n\n${linkBotao.url}` : ""),
      html,
    });
    console.log(`[fortn auth] E-mail enviado para ${destinatario} — ${assunto}`);
  } catch (e) {
    // Falha de envio não pode derrubar o fluxo; em dev o link/código
    // continua acessível pelo log e pela resposta da API.
    console.error(`[fortn auth] Falha ao enviar e-mail para ${destinatario}:`, e);
  }
}

// Template com a identidade do fortn (dourado/creme, serifa)
function montarHtml(
  titulo: string,
  corpo: string,
  linkBotao?: { rotulo: string; url: string }
) {
  const botao = linkBotao
    ? `<tr><td align="center" style="padding:8px 0 24px">
         <a href="${linkBotao.url}"
            style="display:inline-block;background:#755A26;color:#ffffff;text-decoration:none;
                   padding:14px 32px;border-radius:16px;font-weight:600">
           ${linkBotao.rotulo}
         </a>
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR"><body style="margin:0;background:#FBF9F7;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF9F7;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="max-width:480px;background:#ffffff;border-radius:24px;padding:32px">
        <tr><td align="center" style="padding-bottom:16px">
          <span style="font-family:Georgia,serif;font-size:26px;color:#755A26">fortn</span>
        </td></tr>
        <tr><td align="center" style="padding-bottom:8px">
          <span style="font-family:Georgia,serif;font-size:20px;color:#1B1C1B">${titulo}</span>
        </td></tr>
        <tr><td align="center" style="padding:8px 8px 24px;color:#5F5E5C;font-size:15px;line-height:1.6">
          ${corpo}
        </td></tr>
        ${botao}
        <tr><td align="center" style="color:#9a958c;font-size:12px">
          Se você não solicitou isso, ignore este e-mail.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
