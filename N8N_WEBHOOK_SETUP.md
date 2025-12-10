# Configuração do Webhook n8n para Envio de Mensagens

Este guia explica como configurar o n8n para receber mensagens do painel e enviá-las via WhatsApp.

## 📋 Pré-requisitos

- Conta no n8n (Cloud ou Self-hosted)
- Integração com WhatsApp configurada (ex: Evolution API, Baileys, Twilio, etc.)

---

## 🔧 Configuração no Painel

### 1. Adicionar URL do Webhook no `.env.local`

Crie o arquivo `.env.local` na raiz do projeto com:

```env
# Supabase (já configurado)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima

# Webhook n8n
N8N_WEBHOOK_URL=https://seu-n8n.app.n8n.cloud/webhook/send-whatsapp
```

### 2. Reiniciar o servidor Next.js

```bash
npm run dev
```

---

## 🎯 Estrutura do Payload Enviado pelo Painel

Quando você digitar uma mensagem no chat e clicar em "Enviar", o painel enviará este payload para o webhook n8n:

```json
{
  "phone": "5511999999999",
  "message": "Olá! Como posso ajudar?",
  "clientName": "João Silva",
  "timestamp": "2025-12-10T14:30:00.000Z",
  "source": "painel-admin"
}
```

### Campos:
- **phone**: Telefone do destinatário (mesmo formato do `session_id` da conversa)
- **message**: Texto da mensagem digitada pelo atendente
- **clientName**: Nome do cliente (se disponível no cadastro de leads)
- **timestamp**: Data/hora do envio
- **source**: Sempre `"painel-admin"` para identificar origem

---

## 🛠️ Workflow n8n - Exemplo Básico

### Opção 1: Com Evolution API

```
[Webhook] → [Function: Formatar Telefone] → [HTTP Request: Evolution API]
```

#### 1. Nó Webhook
- **Webhook Type**: `POST`
- **Path**: `/send-whatsapp`
- **Response Code**: `200`
- **Response Mode**: `When Last Node Finishes`

#### 2. Nó Function (Opcional - Normalizar telefone)
```javascript
// Normalizar telefone para formato internacional
const phone = $json.phone.replace(/\D/g, '');
const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;

return {
  json: {
    ...$json,
    phone: formattedPhone
  }
};
```

#### 3. Nó HTTP Request (Evolution API)
- **Method**: `POST`
- **URL**: `https://sua-evolution-api.com/message/sendText/sua-instancia`
- **Authentication**: Bearer Token (ou API Key)
- **Headers**:
  - `Content-Type`: `application/json`
  - `apikey`: `sua-api-key-evolution`

**Body**:
```json
{
  "number": "{{ $json.phone }}",
  "text": "{{ $json.message }}"
}
```

#### 4. Nó Response (Retornar sucesso ao painel)
```json
{
  "success": true,
  "message_id": "{{ $json.key.id }}",
  "timestamp": "{{ $now }}"
}
```

---

### Opção 2: Com Baileys (WppConnect/Venom)

```
[Webhook] → [HTTP Request: API Baileys]
```

**HTTP Request**:
- **URL**: `http://localhost:8080/api/sendText`
- **Method**: `POST`
- **Body**:
```json
{
  "session": "default",
  "number": "{{ $json.phone }}@c.us",
  "text": "{{ $json.message }}"
}
```

---

### Opção 3: Com Twilio

```
[Webhook] → [Twilio Node]
```

**Twilio Node**:
- **Resource**: `Create a Message`
- **From**: `whatsapp:+14155238886` (número Twilio)
- **To**: `whatsapp:+{{ $json.phone }}`
- **Message**: `{{ $json.message }}`

---

## 🧪 Testar o Webhook

### 1. Usar webhook.site (Teste inicial)

Antes de configurar o n8n real, teste com webhook.site:

1. Acesse https://webhook.site
2. Copie a URL única gerada
3. Coloque no `.env.local`:
   ```env
   N8N_WEBHOOK_URL=https://webhook.site/seu-id-unico
   ```
4. Envie uma mensagem pelo painel
5. Veja o payload recebido no webhook.site

### 2. Testar n8n local

Se estiver rodando n8n localmente:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/send-whatsapp
```

---

## 🔐 Segurança

### Adicionar autenticação ao webhook

#### No n8n (Nó Webhook):
- **Authentication**: `Header Auth`
- **Name**: `Authorization`
- **Value**: `Bearer seu-token-secreto`

#### No painel (src/app/api/send-message/route.ts):

Adicione o header de autenticação:

```typescript
const webhookResponse = await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.N8N_WEBHOOK_SECRET}` // Adicionar no .env
  },
  body: JSON.stringify(webhookPayload),
})
```

E adicione no `.env.local`:
```env
N8N_WEBHOOK_SECRET=seu-token-super-secreto-aqui
```

---

## 📊 Workflow n8n Completo (Recomendado)

```
┌─────────────┐
│   Webhook   │ Recebe mensagem do painel
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Validação  │ Valida campos obrigatórios
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Logger    │ Salva log no banco/arquivo
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Evolution  │ Envia via WhatsApp
│     API     │
└──────┬──────┘
       │
       ├─ Sucesso ──→ [Response 200]
       │
       └─ Erro ────→ [Error Handler] → [Retry] → [Alert]
```

### Nós adicionais úteis:

1. **If Node**: Verificar se `phone` e `message` não estão vazios
2. **Set Node**: Adicionar metadados (ex: `sent_at`, `agent_id`)
3. **Supabase Node**: Salvar log da mensagem enviada
4. **Error Handler**: Capturar erros e notificar (Slack, email)
5. **Wait Node**: Aguardar confirmação de entrega

---

## 🎨 Template n8n Pronto (JSON)

Copie e importe este workflow no n8n:

```json
{
  "name": "Send WhatsApp from Painel",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "send-whatsapp",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "https://sua-evolution-api.com/message/sendText/instancia",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameter": [
            {
              "name": "apikey",
              "value": "sua-api-key"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameter": [
            {
              "name": "number",
              "value": "={{ $json.phone }}"
            },
            {
              "name": "text",
              "value": "={{ $json.message }}"
            }
          ]
        },
        "options": {}
      },
      "name": "Evolution API",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Evolution API", "type": "main", "index": 0 }]]
    }
  }
}
```

---

## 📝 Logs e Debugging

### Ver logs do painel

No terminal onde está rodando `npm run dev`, você verá:

```
✅ Sucesso: POST /api/send-message 200
❌ Erro: Webhook n8n retornou 500
```

### Ver logs do n8n

Na interface do n8n, clique em "Executions" para ver todas as execuções do workflow.

---

## 🚨 Troubleshooting

### Erro: "Webhook n8n não configurado"
- Verifique se `N8N_WEBHOOK_URL` está no `.env.local`
- Reinicie o servidor Next.js

### Erro: "Timeout ao conectar com webhook n8n"
- Verifique se a URL está acessível
- O webhook tem 10 segundos de timeout

### Mensagem não chega no WhatsApp
- Verifique logs do n8n (aba Executions)
- Teste o endpoint Evolution API diretamente (Postman/Insomnia)
- Verifique se o telefone está no formato correto

### Erro 401 Unauthorized
- Adicione autenticação no webhook n8n
- Configure `N8N_WEBHOOK_SECRET` no `.env.local`

---

## ✅ Checklist de Configuração

- [ ] n8n instalado e rodando
- [ ] Webhook criado no n8n (`/webhook/send-whatsapp`)
- [ ] Evolution API (ou similar) integrada
- [ ] `N8N_WEBHOOK_URL` configurado no `.env.local`
- [ ] Servidor Next.js reiniciado
- [ ] Teste com webhook.site realizado
- [ ] Teste de envio real realizado
- [ ] Logs funcionando corretamente

---

## 📚 Recursos Úteis

- [Documentação n8n Webhooks](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Evolution API Docs](https://doc.evolution-api.com/)
- [Baileys GitHub](https://github.com/WhiskeySockets/Baileys)
- [Twilio WhatsApp API](https://www.twilio.com/whatsapp)

---

**🎉 Pronto! Agora você pode enviar mensagens do painel diretamente pelo chat.**
