# Configuração de Mídias no n8n

## Problema
O painel não estava exibindo imagens porque o campo `mediaUrl` não estava sendo salvo na tabela `chats` do Supabase.

## Solução

### 1. Atualizar Banco de Dados (Supabase)

Execute o SQL abaixo no Supabase SQL Editor:

```sql
-- Adicionar coluna media_url na tabela chats
ALTER TABLE chats ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_chats_media_url ON chats(media_url) WHERE media_url IS NOT NULL;
```

### 2. Atualizar Workflow n8n

No seu workflow do n8n que salva mensagens no Supabase, você precisa incluir o campo `mediaUrl` ao inserir dados na tabela `chats`.

#### Antes (apenas salvando message):
```json
{
  "session_id": "{{ $json.phone }}",
  "message": {
    "type": "human",
    "content": "{{ $json.message }}"
  }
}
```

#### Depois (salvando message E media_url):
```json
{
  "session_id": "{{ $json.phone }}",
  "media_url": "{{ $json.mediaUrl }}",
  "message": {
    "type": "human",
    "content": "{{ $json.message }}"
  }
}
```

### 3. Estrutura Esperada do Webhook

Quando o webhook receber uma mensagem com imagem, deve ter esta estrutura:

```json
{
  "phone": "5511915656962",
  "messageType": "image",
  "message": "foto.jpg",
  "mediaUrl": "https://hyhagshrpmsrzheljtel.supabase.co/storage/v1/object/public/images/image_123.jpg",
  "clientName": "Cliente",
  "timestamp": "2025-12-15T00:00:00.000Z",
  "source": "whatsapp"
}
```

### 4. Node do n8n - Supabase Insert

No node "Supabase" do tipo "Insert", configure os campos assim:

**Campos a mapear:**
- `session_id` → `{{ $json.phone }}`
- `media_url` → `{{ $json.mediaUrl }}` (NOVO - adicione este campo)
- `message` → Objeto JSON:
  ```json
  {
    "type": "human",
    "content": "{{ $json.message }}"
  }
  ```

### 5. Exemplo Completo do Node Supabase

```json
{
  "parameters": {
    "operation": "insert",
    "tableId": "chats",
    "fieldsUi": {
      "fieldValues": [
        {
          "fieldId": "session_id",
          "fieldValue": "={{ $json.phone }}"
        },
        {
          "fieldId": "media_url",
          "fieldValue": "={{ $json.mediaUrl }}"
        },
        {
          "fieldId": "message",
          "fieldValue": "={{ { \"type\": \"human\", \"content\": $json.message } }}"
        }
      ]
    }
  }
}
```

## Testando

Após fazer as alterações:

1. Execute a migration SQL no Supabase
2. Atualize o workflow do n8n conforme instruções acima
3. Envie uma imagem pelo WhatsApp
4. Verifique no painel se a imagem aparece corretamente
5. Verifique no Supabase se o campo `media_url` foi preenchido

## Troubleshooting

### Imagem não aparece
1. Verifique se o campo `media_url` está preenchido na tabela `chats`
2. Verifique se a URL é acessível (abra no navegador)
3. Verifique o console do navegador para erros

### Campo media_url vazio
1. Verifique se o webhook está enviando o `mediaUrl`
2. Verifique se o node do n8n está mapeando corretamente o campo
3. Execute a migration SQL se ainda não executou

## Documentação Relacionada

- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [n8n Supabase Integration](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.supabase/)
