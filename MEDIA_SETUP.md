# Configuração de Envio de Mídia (Imagens, Documentos, Vídeos)

Guia completo para configurar o envio de todos os tipos de mídia no painel WhatsApp.

## 📦 Tipos de Mídia Suportados

| Tipo | Formatos | Tamanho Máx | Bucket |
|------|----------|-------------|--------|
| **🎤 Áudio** | OGG, MP3, WAV, WEBM, M4A, AAC, OPUS | 10MB | `audios` |
| **🖼️ Imagem** | JPG, PNG, GIF, WEBP, SVG, BMP | 5MB | `images` |
| **📄 Documento** | PDF, DOC, DOCX, XLS, XLSX, PPT, TXT, CSV, ZIP | 20MB | `documents` |
| **🎬 Vídeo** | MP4, WEBM, OGG, MOV, AVI, WMV, MKV | 50MB | `videos` |

---

## 🔧 Passo 1: Criar Buckets no Supabase (5 min)

### 1.1 Acessar Supabase Storage

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**

### 1.2 Criar os 4 Buckets

Você precisa criar **4 buckets** (um para cada tipo de mídia):

#### Bucket 1: `audios`
- Nome: `audios`
- **Public:** ✅ Marcar como público
- Criar

#### Bucket 2: `images`
- Nome: `images`
- **Public:** ✅ Marcar como público
- Criar

#### Bucket 3: `documents`
- Nome: `documents`
- **Public:** ✅ Marcar como público
- Criar

#### Bucket 4: `videos`
- Nome: `videos`
- **Public:** ✅ Marcar como público
- Criar

---

## 🔒 Passo 2: Configurar Políticas RLS

Para cada bucket, você precisa configurar políticas de acesso.

### Opção A: Via SQL Editor (Mais Rápido)

1. No Supabase, vá em **SQL Editor**
2. Clique em **New query**
3. Cole e execute:

```sql
-- Políticas para AUDIOS
CREATE POLICY "Allow public audio upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'audios');

CREATE POLICY "Allow public audio read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audios');

-- Políticas para IMAGES
CREATE POLICY "Allow public image upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow public image read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Políticas para DOCUMENTS
CREATE POLICY "Allow public document upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public document read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Políticas para VIDEOS
CREATE POLICY "Allow public video upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Allow public video read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');
```

4. Clique em **Run**

---

### Opção B: Via Interface (Mais Visual)

Para cada bucket, faça:

1. Vá em **Storage** → **Policies**
2. Selecione o bucket (ex: `images`)
3. Clique em **New Policy**
4. Selecione template **"Allow public access"**
5. Marque:
   - ✅ **INSERT** (upload)
   - ✅ **SELECT** (leitura)
6. **Review** → **Save policy**

Repita para todos os 4 buckets!

---

## 🎯 Passo 3: Como Usar no Painel

### Enviar Imagem 🖼️
1. Abra uma conversa
2. Clique no botão de **imagem** (ícone de foto)
3. Selecione uma imagem (JPG, PNG, GIF, etc)
4. Preview aparece
5. Clique em **Enviar imagem**

### Enviar Documento 📄
1. Abra uma conversa
2. Clique no botão de **documento** (ícone de arquivo)
3. Selecione um arquivo (PDF, DOC, XLS, etc)
4. Clique em **Enviar documento**

### Enviar Áudio 🎤
1. Abra uma conversa
2. **Opção A:** Clique no microfone e grave
3. **Opção B:** Clique em anexo de áudio e selecione arquivo

---

## 📱 Passo 4: Atualizar Workflow n8n

O webhook n8n precisa identificar o tipo de mídia e usar o endpoint correto.

### Workflow Atualizado

```javascript
// Nó Function - Detectar tipo de mensagem
const messageType = $json.messageType || 'text';
const phone = $json.phone;
const mediaUrl = $json.mediaUrl;
const message = $json.message;

const evolutionUrl = 'https://sua-evolution-api.com';
const apiKey = 'sua-api-key';

if (messageType === 'text') {
  // Enviar texto
  return [{
    json: {
      endpoint: '/message/sendText/instancia',
      method: 'POST',
      body: {
        number: phone,
        text: message
      }
    }
  }];
}

// Enviar mídia (audio, image, document, video)
const mediaTypeMapping = {
  audio: 'audio',
  image: 'image',
  document: 'document',
  video: 'video'
};

return [{
  json: {
    endpoint: '/message/sendMedia/instancia',
    method: 'POST',
    body: {
      number: phone,
      mediatype: mediaTypeMapping[messageType],
      media: mediaUrl,
      caption: message || ''
    }
  }
}];
```

---

## 🎨 Payload Enviado ao n8n

### Texto
```json
{
  "phone": "5511999999999",
  "messageType": "text",
  "message": "Olá!",
  "clientName": "João Silva"
}
```

### Imagem
```json
{
  "phone": "5511999999999",
  "messageType": "image",
  "message": "foto.jpg",
  "mediaUrl": "https://projeto.supabase.co/storage/v1/object/public/images/image_123.jpg",
  "clientName": "João Silva"
}
```

### Documento
```json
{
  "phone": "5511999999999",
  "messageType": "document",
  "message": "contrato.pdf",
  "mediaUrl": "https://projeto.supabase.co/storage/v1/object/public/documents/doc_456.pdf",
  "clientName": "João Silva"
}
```

### Áudio
```json
{
  "phone": "5511999999999",
  "messageType": "audio",
  "message": "audio.webm",
  "mediaUrl": "https://projeto.supabase.co/storage/v1/object/public/audios/audio_789.webm",
  "clientName": "João Silva"
}
```

### Vídeo (futuro)
```json
{
  "phone": "5511999999999",
  "messageType": "video",
  "message": "video.mp4",
  "mediaUrl": "https://projeto.supabase.co/storage/v1/object/public/videos/video_012.mp4",
  "clientName": "João Silva"
}
```

---

## ✅ Checklist de Configuração

- [ ] Bucket `audios` criado e público
- [ ] Bucket `images` criado e público
- [ ] Bucket `documents` criado e público
- [ ] Bucket `videos` criado e público (opcional)
- [ ] Políticas RLS configuradas para todos os buckets
- [ ] Workflow n8n atualizado com lógica de múltiplos tipos
- [ ] Testado envio de imagem
- [ ] Testado envio de documento
- [ ] Testado envio de áudio

---

## 🚨 Troubleshooting

### Erro: "Falha ao fazer upload. Verifique se o bucket existe"

**Causa:** Bucket não foi criado ou não está público

**Solução:**
1. Verifique se o bucket existe no Supabase Storage
2. Verifique se está marcado como **público**
3. Verifique se as políticas RLS estão configuradas

---

### Erro: "Arquivo muito grande"

**Limites por tipo:**
- Áudio: 10MB
- Imagem: 5MB
- Documento: 20MB
- Vídeo: 50MB

**Solução:** Comprima o arquivo antes de enviar

---

### Mídia não chega no WhatsApp

**Soluções:**
1. Verifique logs do n8n (Executions)
2. Teste se a URL da mídia abre no navegador
3. Verifique se Evolution API suporta o tipo de mídia
4. Verifique se o `mediatype` está correto no payload

---

## 🎯 Limites e Recomendações

### Tamanhos Recomendados

| Tipo | Ideal | Máximo |
|------|-------|--------|
| Imagem | < 500KB | 5MB |
| Documento | < 2MB | 20MB |
| Áudio | < 1MB | 10MB |
| Vídeo | < 10MB | 50MB |

### Formatos Mais Compatíveis

- **Imagem:** JPG, PNG
- **Documento:** PDF
- **Áudio:** MP3, OGG
- **Vídeo:** MP4

---

## 📚 Endpoints da API

### Upload de Mídia
```
POST /api/upload-media

FormData:
- file: File
- type: 'audio' | 'image' | 'document' | 'video'

Response:
{
  "success": true,
  "mediaUrl": "https://...",
  "fileName": "image_123.jpg",
  "fileSize": 245678,
  "mimeType": "image/jpeg",
  "mediaType": "image",
  "bucket": "images"
}
```

### Enviar Mensagem
```
POST /api/send-message

Body:
{
  "phone": "5511999999999",
  "messageType": "image",
  "message": "Foto do produto",
  "mediaUrl": "https://...",
  "clientName": "Cliente"
}
```

---

## 🎉 Pronto!

Agora você pode enviar:
- ✅ Textos
- ✅ Áudios (gravados ou arquivos)
- ✅ Imagens
- ✅ Documentos
- ✅ Vídeos (futuro)

**Interface atualizada com 4 botões:**
- 🎤 Gravar áudio
- 🖼️ Enviar imagem
- 📄 Enviar documento
- ✉️ Enviar texto
