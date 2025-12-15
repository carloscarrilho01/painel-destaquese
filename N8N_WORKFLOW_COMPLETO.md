# Workflow n8n Completo - WhatsApp com Mídias

## Objetivo
Configurar o n8n para receber mensagens do WhatsApp (texto, imagens, áudios), fazer upload das mídias para o Supabase Storage e salvar tudo no banco de dados.

## Arquitetura do Workflow

```
WhatsApp → Webhook → Processar Mídia → Upload Supabase Storage → Salvar no DB
```

## 1. Estrutura do Workflow n8n

### Node 1: Webhook (Receber do WhatsApp)
- **Tipo**: Webhook
- **Método**: POST
- **Path**: `/webhook/whatsapp-incoming`

### Node 2: Switch (Verificar Tipo de Mensagem)
- **Tipo**: Switch
- **Regras**:
  - `messageType === 'text'` → Ir para Node de Texto
  - `messageType === 'image'` → Ir para Node de Imagem
  - `messageType === 'audio'` → Ir para Node de Áudio
  - `messageType === 'video'` → Ir para Node de Vídeo

### Node 3a: Processar Imagem
```javascript
// Code Node - JavaScript
const mediaUrl = $input.item.json.mediaUrl;
const phone = $input.item.json.phone;
const message = $input.item.json.message;

// Fazer download da imagem
const response = await fetch(mediaUrl);
const buffer = await response.arrayBuffer();
const blob = Buffer.from(buffer);

// Gerar nome único para arquivo
const timestamp = Date.now();
const extension = message.split('.').pop() || 'jpg';
const fileName = `image_${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`;

return {
  json: {
    phone,
    message,
    messageType: 'image',
    blob,
    fileName,
    mimeType: response.headers.get('content-type') || 'image/jpeg'
  }
};
```

### Node 4: Upload para Supabase Storage
- **Tipo**: HTTP Request
- **Método**: POST
- **URL**: `https://SEU-PROJETO.supabase.co/storage/v1/object/images/{{ $json.fileName }}`
- **Authentication**: Bearer Token
- **Token**: `SEU_SUPABASE_SERVICE_ROLE_KEY`
- **Headers**:
  - `Content-Type`: `{{ $json.mimeType }}`
  - `apikey`: `SEU_SUPABASE_SERVICE_ROLE_KEY`
- **Body**: `{{ $json.blob }}`
- **Body Content Type**: Raw/Custom

### Node 5: Processar Resposta do Upload
```javascript
// Code Node - JavaScript
const uploadResponse = $input.item.json;
const previousData = $node["Processar Imagem"].json;

// Construir URL pública da imagem
const publicUrl = `https://SEU-PROJETO.supabase.co/storage/v1/object/public/images/${previousData.fileName}`;

return {
  json: {
    session_id: previousData.phone,
    media_url: publicUrl,
    message: {
      type: 'human',
      content: previousData.message
    }
  }
};
```

### Node 6: Salvar no Supabase (chats)
- **Tipo**: Supabase
- **Operation**: Insert
- **Table**: chats
- **Fields**:
  - `session_id`: `{{ $json.session_id }}`
  - `media_url`: `{{ $json.media_url }}`
  - `message`: `{{ $json.message }}`

## 2. Configuração Supabase Storage

### Criar Bucket
No Supabase Dashboard:

1. Vá em **Storage** → **New Bucket**
2. Nome: `images`
3. Public: **✓ Sim** (para que as imagens sejam acessíveis publicamente)
4. File size limit: 50MB
5. Allowed MIME types: `image/*,audio/*,video/*`

### Políticas de Acesso (RLS)

```sql
-- Permitir upload autenticado (n8n usa service_role_key)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Permitir leitura pública
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');
```

## 3. Workflow Completo (JSON para Importar)

```json
{
  "name": "WhatsApp Media Handler",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-incoming",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "rules": {
          "rules": [
            {
              "conditions": {
                "string": [
                  {
                    "value1": "={{ $json.messageType }}",
                    "value2": "text"
                  }
                ]
              },
              "renameOutput": true,
              "outputKey": "texto"
            },
            {
              "conditions": {
                "string": [
                  {
                    "value1": "={{ $json.messageType }}",
                    "value2": "image"
                  }
                ]
              },
              "renameOutput": true,
              "outputKey": "imagem"
            }
          ]
        }
      },
      "name": "Switch",
      "type": "n8n-nodes-base.switch",
      "position": [450, 300]
    },
    {
      "parameters": {
        "functionCode": "const mediaUrl = $input.item.json.mediaUrl;\nconst phone = $input.item.json.phone;\nconst message = $input.item.json.message;\n\nconst response = await fetch(mediaUrl);\nconst buffer = await response.arrayBuffer();\nconst blob = Buffer.from(buffer);\n\nconst timestamp = Date.now();\nconst extension = message.split('.').pop() || 'jpg';\nconst fileName = `image_${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`;\n\nreturn {\n  json: {\n    phone,\n    message,\n    messageType: 'image',\n    blob,\n    fileName,\n    mimeType: response.headers.get('content-type') || 'image/jpeg'\n  }\n};"
      },
      "name": "Processar Imagem",
      "type": "n8n-nodes-base.code",
      "position": [650, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://SEU-PROJETO.supabase.co/storage/v1/object/images/{{ $json.fileName }}",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "={{ $json.mimeType }}"
            },
            {
              "name": "apikey",
              "value": "SEU_SUPABASE_SERVICE_ROLE_KEY"
            }
          ]
        },
        "sendBody": true,
        "bodyContentType": "raw",
        "rawContentType": "={{ $json.mimeType }}",
        "body": "={{ $json.blob }}"
      },
      "name": "Upload Supabase Storage",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 200]
    },
    {
      "parameters": {
        "functionCode": "const previousData = $node[\"Processar Imagem\"].json;\nconst publicUrl = `https://SEU-PROJETO.supabase.co/storage/v1/object/public/images/${previousData.fileName}`;\n\nreturn {\n  json: {\n    session_id: previousData.phone,\n    media_url: publicUrl,\n    message: {\n      type: 'human',\n      content: previousData.message\n    }\n  }\n};"
      },
      "name": "Preparar Dados",
      "type": "n8n-nodes-base.code",
      "position": [1050, 200]
    },
    {
      "parameters": {
        "operation": "insert",
        "tableId": "chats",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "session_id",
              "fieldValue": "={{ $json.session_id }}"
            },
            {
              "fieldId": "media_url",
              "fieldValue": "={{ $json.media_url }}"
            },
            {
              "fieldId": "message",
              "fieldValue": "={{ $json.message }}"
            }
          ]
        }
      },
      "name": "Salvar no Supabase",
      "type": "n8n-nodes-base.supabase",
      "position": [1250, 200]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Switch", "type": "main", "index": 0 }]]
    },
    "Switch": {
      "main": [
        [],
        [{ "node": "Processar Imagem", "type": "main", "index": 0 }]
      ]
    },
    "Processar Imagem": {
      "main": [[{ "node": "Upload Supabase Storage", "type": "main", "index": 0 }]]
    },
    "Upload Supabase Storage": {
      "main": [[{ "node": "Preparar Dados", "type": "main", "index": 0 }]]
    },
    "Preparar Dados": {
      "main": [[{ "node": "Salvar no Supabase", "type": "main", "index": 0 }]]
    }
  }
}
```

## 4. Variáveis de Ambiente Necessárias

No n8n, configure:
- `SUPABASE_URL`: `https://SEU-PROJETO.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: Sua chave service_role (encontre em Project Settings → API)

## 5. Testar

1. Importe o workflow no n8n
2. Substitua `SEU-PROJETO` pela URL do seu projeto Supabase
3. Substitua `SEU_SUPABASE_SERVICE_ROLE_KEY` pela sua chave
4. Envie uma imagem pelo WhatsApp
5. Verifique:
   - Imagem aparece em Storage → images
   - Registro criado em chats com `media_url` preenchido
   - Imagem aparece no painel

## 6. Troubleshooting

### Upload falha com erro 401
→ Verifique se está usando `service_role_key`, não `anon_key`

### Imagem não aparece no painel
→ Verifique se o bucket é público
→ Verifique se `media_url` está preenchido no banco

### Erro de CORS
→ Configure CORS no Supabase Storage (Settings → Storage)

## 7. Alternativa: Usar Supabase Node do n8n

Se preferir, use o node oficial do Supabase para upload:

1. Instale o node: `npm install n8n-nodes-supabase`
2. Use "Supabase Storage" ao invés de HTTP Request
3. Configure credenciais no n8n

---

**Documentação Relacionada:**
- [Supabase Storage Uploads](https://supabase.com/docs/guides/storage/uploads)
- [n8n Code Node](https://docs.n8n.io/code/builtin/javascript-code/)
- [n8n HTTP Request](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
