# Guia Rápido - Envio de Áudio

Este guia mostra como começar a usar o envio de áudio em 5 minutos.

## ⚡ Início Rápido (5 minutos)

### 1. Configurar Supabase Storage

**No Supabase Dashboard:**

1. Vá em **Storage** → **New bucket**
2. Nome: `audios`
3. Marque: **Public bucket** ✅
4. Clique em **Create bucket**

**Configurar políticas (RLS):**

```sql
-- Permitir upload público
CREATE POLICY "Allow public audio upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'audios');

-- Permitir leitura pública
CREATE POLICY "Allow public audio read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audios');
```

**Ou pela interface:**
- Storage → Policies → New Policy
- Template: "Allow public access"
- Operações: INSERT, SELECT

### 2. Variáveis de Ambiente

Certifique-se que `.env.local` tem:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
N8N_WEBHOOK_URL=https://seu-n8n.app.n8n.cloud/webhook/send-whatsapp
```

### 3. Atualizar Workflow n8n

**Adicione um nó IF após o Webhook:**

- **Condição**: `messageType === 'audio'`
- **Se VERDADEIRO**: Enviar via `sendMedia`
- **Se FALSO**: Enviar via `sendText`

**Exemplo de código do nó (Evolution API):**

```javascript
const messageType = $json.messageType || 'text';

if (messageType === 'audio') {
  // Enviar áudio
  return [{
    json: {
      endpoint: '/message/sendMedia/instancia',
      body: {
        number: $json.phone,
        mediatype: 'audio',
        media: $json.mediaUrl
      }
    }
  }];
} else {
  // Enviar texto
  return [{
    json: {
      endpoint: '/message/sendText/instancia',
      body: {
        number: $json.phone,
        text: $json.message
      }
    }
  }];
}
```

### 4. Testar!

1. Execute `npm run dev`
2. Acesse `/conversas`
3. Selecione uma conversa
4. Clique no ícone 🎤 (microfone)
5. Grave e envie!

---

## 🎯 Formatos Suportados

- ✅ **OGG** (Opus) - Recomendado (menor tamanho)
- ✅ **MP3** - Compatível com todos os dispositivos
- ✅ **WAV** - Alta qualidade (maior tamanho)
- ✅ **WEBM** - Formato da gravação do navegador
- ✅ **MP4** - Áudio AAC

---

## 🔍 Troubleshooting Rápido

### Erro ao fazer upload?
→ Verifique se o bucket `audios` está **público**

### Áudio não chega no WhatsApp?
→ Teste se a URL do áudio abre no navegador
→ Verifique logs do n8n

### Microfone não funciona?
→ Permita acesso ao microfone no navegador
→ Use HTTPS (localhost funciona sem HTTPS)

---

## 📚 Documentação Completa

- [`AUDIO_SETUP.md`](./AUDIO_SETUP.md) - Guia completo de configuração
- [`N8N_WEBHOOK_SETUP.md`](./N8N_WEBHOOK_SETUP.md) - Configuração webhook
- [`README.md`](./README.md) - Documentação geral

---

**💡 Dica:** O áudio gravado no navegador usa formato WEBM (Opus codec), que é o mesmo formato do WhatsApp Web!
