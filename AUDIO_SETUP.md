# Configuração de Envio de Áudio

Este guia explica como configurar o sistema completo de envio de áudio pelo painel WhatsApp.

## 📋 Recursos Implementados

✅ **Gravação de áudio direto do navegador**
- Interface igual ao WhatsApp Web
- Timer de gravação em tempo real
- Preview antes de enviar
- Cancelar gravação

✅ **Upload de arquivo de áudio**
- Suporte a MP3, OGG, WAV, WEBM, MP4
- Preview do áudio antes de enviar
- Limite de 10MB por arquivo

✅ **Armazenamento seguro**
- Upload para Supabase Storage
- URLs públicas com CDN global
- Validação de tipo e tamanho

---

## 🔧 Passo 1: Configurar Supabase Storage

### 1.1 Criar o bucket de áudios

Acesse o Supabase Dashboard:

1. Vá em **Storage** no menu lateral
2. Clique em **New bucket**
3. Configure:
   - **Name**: `audios`
   - **Public bucket**: ✅ Marcar como público
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `audio/ogg, audio/mpeg, audio/wav, audio/webm, audio/mp4`

4. Clique em **Create bucket**

### 1.2 Configurar políticas de acesso (RLS)

No bucket `audios`, adicione as seguintes políticas:

```sql
-- Permitir upload de áudios (INSERT)
CREATE POLICY "Allow public audio upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'audios');

-- Permitir leitura pública de áudios (SELECT)
CREATE POLICY "Allow public audio read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audios');

-- Permitir deletar áudios antigos (DELETE) - opcional
CREATE POLICY "Allow public audio delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'audios');
```

**Ou via interface:**

1. Vá em **Storage** > **Policies**
2. Clique em **New Policy** no bucket `audios`
3. Selecione template **Allow public access**
4. Aplique para operações: `INSERT`, `SELECT`, `DELETE`

---

## 🎯 Passo 2: Payload Atualizado

O painel agora envia este payload para o webhook n8n:

### Mensagem de Texto (anterior)
```json
{
  "phone": "5511999999999",
  "messageType": "text",
  "message": "Olá! Como posso ajudar?",
  "clientName": "João Silva",
  "timestamp": "2025-12-14T14:30:00.000Z",
  "source": "painel-admin"
}
```

### Mensagem de Áudio (NOVO)
```json
{
  "phone": "5511999999999",
  "messageType": "audio",
  "message": "Áudio enviado pelo atendente",
  "mediaUrl": "https://seu-projeto.supabase.co/storage/v1/object/public/audios/audio_1234567890_abc123.webm",
  "clientName": "João Silva",
  "timestamp": "2025-12-14T14:30:00.000Z",
  "source": "painel-admin"
}
```

### Campos:
- **messageType**: `"text"` ou `"audio"` (NOVO)
- **mediaUrl**: URL pública do áudio no Supabase Storage (NOVO)
- **message**: Descrição do áudio ou texto da mensagem

---

## 🛠️ Passo 3: Atualizar Workflow n8n

### Opção 1: Workflow Completo (Recomendado)

```
┌─────────────┐
│   Webhook   │ Recebe payload do painel
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ IF: Verificar│ messageType === 'audio' ?
│  Tipo        │
└──────┬──────┘
       │
       ├─── [ÁUDIO] ───┐
       │               ▼
       │         ┌──────────────┐
       │         │ HTTP: Baixar │ Baixa áudio do Supabase
       │         │    Áudio     │
       │         └──────┬───────┘
       │                │
       │                ▼
       │         ┌──────────────┐
       │         │ Evolution:   │ Envia áudio via WhatsApp
       │         │  sendMedia   │
       │         └──────────────┘
       │
       └─── [TEXTO] ───┐
                       ▼
                 ┌──────────────┐
                 │ Evolution:   │ Envia texto via WhatsApp
                 │  sendText    │
                 └──────────────┘
```

### 3.1 Nó 1: Webhook
- **HTTP Method**: POST
- **Path**: `/send-whatsapp`
- **Response Mode**: When Last Node Finishes

### 3.2 Nó 2: IF (Switch)
Verificar tipo de mensagem:

**Condição:**
- **Value 1**: `{{ $json.messageType }}`
- **Operation**: Equal
- **Value 2**: `audio`

### 3.3 Ramo ÁUDIO - Nó 3: HTTP Request (Baixar áudio)

**Configurações:**
- **Method**: GET
- **URL**: `{{ $json.mediaUrl }}`
- **Response Format**: File
- **Output Property Name**: `audioFile`

### 3.4 Ramo ÁUDIO - Nó 4: HTTP Request (Evolution API - sendMedia)

**Configurações:**
- **Method**: POST
- **URL**: `https://sua-evolution-api.com/message/sendMedia/instancia`
- **Authentication**: Header Auth
  - **Name**: `apikey`
  - **Value**: `sua-api-key`
- **Send Body**: Yes
- **Body Content Type**: Multipart-Form Data

**Body Parameters:**
```json
{
  "number": "{{ $json.phone }}",
  "mediatype": "audio",
  "media": "{{ $binary.audioFile }}"
}
```

### 3.5 Ramo TEXTO - Nó 5: HTTP Request (Evolution API - sendText)

**Configurações:**
- **Method**: POST
- **URL**: `https://sua-evolution-api.com/message/sendText/instancia`
- **Authentication**: Header Auth
  - **Name**: `apikey`
  - **Value**: `sua-api-key`
- **Send Body**: Yes
- **Body Content Type**: JSON

**Body:**
```json
{
  "number": "{{ $json.phone }}",
  "text": "{{ $json.message }}"
}
```

---

### Opção 2: Workflow Simplificado (Código Único)

Use um nó **Code** (JavaScript) para processar tudo:

```javascript
// Detectar tipo de mensagem
const messageType = $input.item.json.messageType || 'text';
const phone = $input.item.json.phone;
const evolutionUrl = 'https://sua-evolution-api.com';
const apiKey = 'sua-api-key';

if (messageType === 'audio') {
  // Enviar áudio
  const mediaUrl = $input.item.json.mediaUrl;

  const response = await $http.request({
    method: 'POST',
    url: `${evolutionUrl}/message/sendMedia/instancia`,
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/json'
    },
    body: {
      number: phone,
      mediatype: 'audio',
      media: mediaUrl
    }
  });

  return { json: response };

} else {
  // Enviar texto
  const message = $input.item.json.message;

  const response = await $http.request({
    method: 'POST',
    url: `${evolutionUrl}/message/sendText/instancia`,
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/json'
    },
    body: {
      number: phone,
      text: message
    }
  });

  return { json: response };
}
```

---

## 🎨 Passo 4: Template n8n Pronto (JSON)

Copie e importe este workflow no n8n:

```json
{
  "name": "Send WhatsApp (Text + Audio)",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "send-whatsapp",
        "responseMode": "lastNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.messageType }}",
              "operation": "equals",
              "value2": "audio"
            }
          ]
        }
      },
      "name": "IF Audio or Text",
      "type": "n8n-nodes-base.if",
      "position": [440, 300]
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
        }
      },
      "name": "Send Text",
      "type": "n8n-nodes-base.httpRequest",
      "position": [640, 400]
    },
    {
      "parameters": {
        "url": "https://sua-evolution-api.com/message/sendMedia/instancia",
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
              "name": "mediatype",
              "value": "audio"
            },
            {
              "name": "media",
              "value": "={{ $json.mediaUrl }}"
            }
          ]
        }
      },
      "name": "Send Audio",
      "type": "n8n-nodes-base.httpRequest",
      "position": [640, 200]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "IF Audio or Text", "type": "main", "index": 0 }]]
    },
    "IF Audio or Text": {
      "main": [
        [{ "node": "Send Audio", "type": "main", "index": 0 }],
        [{ "node": "Send Text", "type": "main", "index": 0 }]
      ]
    }
  }
}
```

---

## 📱 Passo 5: Como Usar no Painel

### Enviar Áudio Gravado:

1. Abra uma conversa no painel
2. Clique no ícone do **microfone** (🎤)
3. Permita acesso ao microfone (primeira vez)
4. Fale sua mensagem
5. Clique em **Parar** (quadrado vermelho)
6. Ouça o preview
7. Clique em **Enviar** (seta) ou **Descartar** (lixeira)

### Enviar Arquivo de Áudio:

1. Abra uma conversa no painel
2. Clique no ícone de **anexo** (📎)
3. Selecione arquivo de áudio (MP3, OGG, WAV, etc)
4. Ouça o preview
5. Clique em **Enviar arquivo** ou **Cancelar**

---

## 🚨 Troubleshooting

### Erro: "Supabase não configurado"
- Verifique se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão no `.env.local`
- Reinicie o servidor Next.js

### Erro: "Erro ao fazer upload do áudio"
- Verifique se o bucket `audios` foi criado no Supabase Storage
- Verifique se as políticas RLS estão configuradas
- Verifique se o bucket está público

### Erro: "Erro ao acessar microfone"
- Navegador precisa de HTTPS (exceto localhost)
- Usuário precisa permitir acesso ao microfone
- Verifique permissões do navegador

### Áudio não chega no WhatsApp
- Verifique logs do n8n (aba Executions)
- Teste o endpoint Evolution API diretamente
- Verifique se `mediaUrl` está acessível (abra no navegador)
- Verifique formato do áudio (Evolution API suporta?)

### Erro: "Tipo de arquivo inválido"
- Apenas arquivos de áudio são aceitos
- Formatos suportados: OGG, MP3, WAV, WEBM, MP4
- Verifique extensão do arquivo

### Erro: "Arquivo muito grande"
- Limite atual: 10MB
- Comprima o áudio antes de enviar
- Ou ajuste `maxSize` em `/api/upload-audio/route.ts`

---

## 🔐 Segurança

### Limpar áudios antigos (opcional)

Crie um workflow n8n para deletar áudios com mais de 7 dias:

```javascript
// Nó Code (Schedule Trigger: diário)
const supabaseUrl = 'https://seu-projeto.supabase.co';
const supabaseKey = 'sua-chave-service-role'; // ⚠️ Service Role (não anon)

const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const response = await $http.request({
  method: 'POST',
  url: `${supabaseUrl}/storage/v1/object/delete`,
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  },
  body: {
    bucket: 'audios',
    prefixes: [`audio_${Date.now() - 7 * 24 * 60 * 60 * 1000}_`]
  }
});

return { json: response };
```

---

## ✅ Checklist de Configuração

- [ ] Bucket `audios` criado no Supabase Storage
- [ ] Bucket configurado como público
- [ ] Políticas RLS configuradas (INSERT, SELECT)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` no `.env.local`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` no `.env.local`
- [ ] Workflow n8n atualizado com lógica de áudio
- [ ] Endpoint Evolution API testado para `sendMedia`
- [ ] Teste de gravação de áudio realizado
- [ ] Teste de upload de arquivo realizado
- [ ] Teste de envio para WhatsApp realizado

---

## 📚 Recursos Úteis

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Evolution API - Send Media](https://doc.evolution-api.com/endpoints/send-media)
- [MediaRecorder API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

**🎉 Pronto! Agora você pode enviar áudios pelo painel!**
