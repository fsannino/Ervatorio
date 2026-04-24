// ============================================================
// Helper de email transacional via Resend
// ============================================================
// Envia confirmação de pedido quando o webhook MP muda status
// para 'paid'. Chamado diretamente de mp-webhook (não é Edge
// Function separada — deploy/manutenção unificado).
//
// Variáveis de ambiente esperadas:
//   RESEND_API_KEY       — API key do Resend (começa com re_...)
//   EMAIL_FROM           — remetente (ex.: 'Ervatório <pedidos@ervatorio.com.br>')
//                          precisa ter dominio verificado no Resend
//   EMAIL_BCC (opcional) — copia oculta para admin acompanhar
// ============================================================

export interface OrderEmailInput {
  to: string;                      // email do cliente
  order_number: string;
  customer_name: string | null;
  total_cents: number;
  currency: string;
  payment_method: string | null;
  paid_at: string | null;
  items: Array<{
    product_name: string;
    product_unit: string | null;
    qty: number;
    unit_price_cents: number;
    line_total_cents: number;
  }>;
  shipping_address: Record<string, string> | null;
}

export async function sendOrderPaidEmail(input: OrderEmailInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM') || 'Ervatório <onboarding@resend.dev>';
  const bcc = Deno.env.get('EMAIL_BCC');

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY nao configurado — email nao enviado');
    return { ok: false, error: 'RESEND_API_KEY nao configurado' };
  }
  if (!input.to) {
    return { ok: false, error: 'email do destinatario ausente' };
  }

  const body = {
    from,
    to: [input.to],
    ...(bcc ? { bcc: [bcc] } : {}),
    subject: `Pedido ${input.order_number} confirmado — Ervatório`,
    html: renderHtml(input),
    text: renderText(input),
  };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('[email] Resend respondeu erro', { status: res.status, data });
      return { ok: false, error: data?.message || `Resend ${res.status}` };
    }
    console.log('[email] enviado', { to: input.to, order: input.order_number, id: data.id });
    return { ok: true, id: data.id };
  } catch (e) {
    console.error('[email] exception', e);
    return { ok: false, error: (e as Error).message };
  }
}

function formatBRL(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

function renderText(i: OrderEmailInput): string {
  const lines = [
    `Olá, ${i.customer_name || 'cliente'}!`,
    ``,
    `Recebemos seu pagamento para o pedido ${i.order_number}.`,
    `Obrigado por escolher o Ervatório.`,
    ``,
    `Itens:`,
    ...i.items.map((it) => `  • ${it.qty}x ${it.product_name} (${it.product_unit || ''}) — ${formatBRL(it.line_total_cents)}`),
    ``,
    `Total pago: ${formatBRL(i.total_cents)}`,
    i.payment_method ? `Forma de pagamento: ${mapPaymentMethod(i.payment_method)}` : '',
    ``,
    i.shipping_address ? `Entrega em:` : '',
    i.shipping_address ? `  ${i.shipping_address.street}${i.shipping_address.number ? ', ' + i.shipping_address.number : ''}` : '',
    i.shipping_address ? `  ${i.shipping_address.city} - ${i.shipping_address.state}` : '',
    i.shipping_address ? `  CEP ${i.shipping_address.zip}` : '',
    ``,
    `Assim que seu pedido for despachado, você receberá o código de rastreamento.`,
    ``,
    `Dúvidas? Responda este email ou acesse seu histórico em ervatorio.com.br.`,
    ``,
    `— Equipe Ervatório`,
  ];
  return lines.filter(Boolean).join('\n');
}

function renderHtml(i: OrderEmailInput): string {
  const itemsRows = i.items.map((it) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee">
        <div style="color:#2d2a22;font-size:14px">${escapeHtml(it.product_name)}</div>
        <div style="color:#8a8270;font-size:12px">${it.qty} × ${escapeHtml(it.product_unit || '')}</div>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#2d2a22;font-size:14px">
        ${formatBRL(it.line_total_cents)}
      </td>
    </tr>
  `).join('');

  const addr = i.shipping_address;
  const addressHtml = addr ? `
    <div style="margin-top:24px;padding:16px;background:#faf8f3;border-radius:8px">
      <div style="color:#8a8270;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Entrega</div>
      <div style="color:#2d2a22;font-size:14px;line-height:1.5">
        ${escapeHtml(addr.name || '')}<br>
        ${escapeHtml(addr.street || '')}${addr.number ? ', ' + escapeHtml(addr.number) : ''}${addr.complement ? ' — ' + escapeHtml(addr.complement) : ''}<br>
        ${addr.neighborhood ? escapeHtml(addr.neighborhood) + '<br>' : ''}
        ${escapeHtml(addr.city || '')} - ${escapeHtml(addr.state || '')}<br>
        CEP ${escapeHtml(addr.zip || '')}
      </div>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f1e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1e8">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04)">
          <tr>
            <td style="padding:32px 40px;background:#2d2a22;color:#d4a85a;text-align:center">
              <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:300;letter-spacing:2px">ERVATÓRIO</div>
              <div style="font-size:12px;color:#a39478;margin-top:4px;letter-spacing:1px">PEDIDO CONFIRMADO</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px">
              <p style="margin:0 0 16px;color:#2d2a22;font-size:16px">Olá, ${escapeHtml(i.customer_name || 'cliente')}.</p>
              <p style="margin:0 0 24px;color:#5a5244;font-size:14px;line-height:1.6">
                Seu pagamento foi aprovado e estamos preparando seu pedido.
                Assim que ele sair para entrega, você receberá o código de rastreamento.
              </p>

              <div style="margin:24px 0;padding:16px;background:#faf8f3;border-left:3px solid #d4a85a;border-radius:4px">
                <div style="color:#8a8270;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Número do pedido</div>
                <div style="color:#2d2a22;font-size:16px;font-weight:500;font-family:monospace">${escapeHtml(i.order_number)}</div>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
                ${itemsRows}
                <tr>
                  <td style="padding:16px 0 0;color:#2d2a22;font-weight:500;font-size:15px">Total pago</td>
                  <td style="padding:16px 0 0;text-align:right;color:#d4a85a;font-weight:500;font-size:18px">${formatBRL(i.total_cents)}</td>
                </tr>
                ${i.payment_method ? `
                <tr>
                  <td colspan="2" style="padding:4px 0;color:#8a8270;font-size:12px;text-align:right">via ${mapPaymentMethod(i.payment_method)}</td>
                </tr>` : ''}
              </table>

              ${addressHtml}

              <p style="margin:32px 0 0;color:#8a8270;font-size:12px;line-height:1.5;text-align:center">
                Dúvidas? Responda este email.<br>
                Acesse seu histórico em <a href="https://ervatorio.com.br" style="color:#d4a85a;text-decoration:none">ervatorio.com.br</a>
              </p>
            </td>
          </tr>
        </table>
        <div style="color:#a39478;font-size:11px;margin-top:16px">
          © Ervatório — Chás e Infusões
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function mapPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    account_money: 'Saldo Mercado Pago',
    credit_card: 'Cartão de crédito',
    debit_card: 'Cartão de débito',
    ticket: 'Boleto',
    bank_transfer: 'PIX',
    pix: 'PIX',
  };
  return map[method] || method;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
