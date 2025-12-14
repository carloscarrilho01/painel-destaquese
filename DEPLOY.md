# Deploy na Vercel - Guia Completo

Este guia mostra como fazer deploy do Painel WhatsApp v3 na Vercel.

## 📋 Pré-requisitos

- [ ] Conta no GitHub
- [ ] Conta na Vercel (use GitHub para login)
- [ ] Supabase configurado
- [ ] Bucket `audios` criado no Supabase Storage (para envio de áudio)
- [ ] n8n configurado (opcional - para envio de mensagens)

---

## 🚀 Passo 1: Preparar o Repositório

### 1.1 Fazer commit das alterações

```bash
# Adicionar todos os arquivos
git add .

# Criar commit
git commit -m "Adicionar sistema de envio de áudio

- Componente de gravação de áudio
- Componente de upload de arquivo
- API de upload para Supabase Storage
- Suporte a mensagens de áudio no webhook n8n
- Documentação completa"

# Enviar para o GitHub
git push origin awesome-visvesvaraya
```

### 1.2 Criar Pull Request (Opcional)

Se você tem uma branch `main`:

```bash
# Via GitHub CLI (se instalado)
gh pr create --title "Sistema de envio de áudio" --body "Implementação completa do sistema de envio de áudio"

# Ou faça via interface do GitHub
```

---

## 🌐 Passo 2: Deploy na Vercel

### Opção A: Deploy via GitHub (Recomendado)

**1. Acesse:** https://vercel.com/new

**2. Importe seu repositório:**
- Clique em **Import Git Repository**
- Selecione o repositório do projeto
- Clique em **Import**

**3. Configure o projeto:**
- **Project Name**: `painel-whatsapp-v3` (ou o nome que preferir)
- **Framework Preset**: Next.js (detectado automaticamente)
- **Root Directory**: `./` (deixe como está)
- **Build Command**: `npm run build` (padrão)
- **Output Directory**: `.next` (padrão)

**4. Adicione as variáveis de ambiente:**

Clique em **Environment Variables** e adicione:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
N8N_WEBHOOK_URL=https://seu-n8n.app.n8n.cloud/webhook/send-whatsapp
```

**IMPORTANTE:** Adicione para todos os ambientes:
- ✅ Production
- ✅ Preview
- ✅ Development

**5. Clique em Deploy**

A Vercel irá:
1. Clonar o repositório
2. Instalar dependências
3. Executar `npm run build`
4. Fazer deploy

**Deploy leva ~2-3 minutos** ⏱️

---

### Opção B: Deploy via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Seguir prompts interativos
```

---

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

### 3.1 Via Dashboard Vercel

1. Acesse seu projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável:

| Variável | Valor | Ambiente |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://seu-projeto.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sua-chave-anonima` | Production, Preview, Development |
| `N8N_WEBHOOK_URL` | `https://seu-n8n.app.n8n.cloud/webhook/send-whatsapp` | Production, Preview, Development |

### 3.2 Redeploy após adicionar variáveis

Após adicionar as variáveis:

1. Vá em **Deployments**
2. Clique nos **três pontos** do último deployment
3. Clique em **Redeploy**
4. Marque **Use existing build cache** (opcional - mais rápido)
5. Clique em **Redeploy**

---

## 🔒 Passo 4: Configurar Domínio (Opcional)

### 4.1 Usar domínio da Vercel

Por padrão, seu projeto estará em:
```
https://seu-projeto.vercel.app
```

### 4.2 Adicionar domínio customizado

1. Vá em **Settings** → **Domains**
2. Clique em **Add**
3. Digite seu domínio (ex: `painel.seusite.com`)
4. Configure DNS conforme instruções
5. Aguarde propagação (~5-60 min)

---

## ✅ Passo 5: Verificar Deploy

### 5.1 Checklist pós-deploy

- [ ] Site carrega corretamente
- [ ] Dashboard mostra estatísticas
- [ ] Página de conversas funciona
- [ ] Botão de microfone 🎤 aparece
- [ ] Botão de anexo 📎 aparece
- [ ] Variáveis de ambiente configuradas

### 5.2 Testar funcionalidades

**Teste 1: Gravação de Áudio**
1. Acesse `/conversas`
2. Selecione uma conversa
3. Clique no microfone 🎤
4. Permita acesso ao microfone
5. Grave e envie

**Teste 2: Upload de Arquivo**
1. Clique no anexo 📎
2. Selecione um arquivo de áudio
3. Envie

**Teste 3: Envio de Texto**
1. Digite uma mensagem
2. Pressione Enter
3. Verifique se chegou no webhook n8n

### 5.3 Verificar logs

**No Vercel:**
1. Vá em **Functions** → **Logs**
2. Filtre por `/api/upload-audio` e `/api/send-message`
3. Verifique erros

**No Supabase:**
1. Vá em **Storage** → Bucket `audios`
2. Verifique se áudios foram salvos

---

## 🚨 Troubleshooting

### Erro: "Build failed"

**Causa:** Erro de compilação TypeScript ou dependência

**Solução:**
```bash
# Teste localmente
npm run build

# Se funcionar local mas falhar na Vercel:
# Verifique node version em package.json
```

### Erro: "Supabase não configurado"

**Causa:** Variáveis de ambiente não configuradas

**Solução:**
1. Vercel Dashboard → Settings → Environment Variables
2. Adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy

### Erro: "Bucket não encontrado" ao gravar áudio

**Causa:** Bucket `audios` não existe no Supabase

**Solução:**
1. Supabase Dashboard → Storage → New bucket
2. Nome: `audios`
3. Público: ✅
4. Adicionar políticas RLS

### Erro: "CORS" ao fazer upload

**Causa:** Configuração CORS no Supabase

**Solução:**
1. Supabase → Settings → API
2. Adicione seu domínio Vercel em **CORS Allowed Origins**
3. Exemplo: `https://seu-projeto.vercel.app`

### Preview deployment não funciona

**Causa:** Variáveis de ambiente não configuradas para Preview

**Solução:**
1. Adicione variáveis também para **Preview**
2. Ou use variáveis específicas de preview

---

## 🔐 Segurança em Produção

### 1. Variáveis de Ambiente

✅ **Correto:**
```
NEXT_PUBLIC_SUPABASE_URL=https://...  (pode ser pública)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...     (pode ser pública)
N8N_WEBHOOK_URL=...                   (servidor - não exposta)
```

❌ **Evite:**
- Não commitar `.env.local` no git
- Não usar chave `service_role` do Supabase no frontend

### 2. Supabase Row Level Security (RLS)

Configure políticas RLS:

```sql
-- Apenas leitura pública em chats
CREATE POLICY "Allow read chats"
ON chats FOR SELECT
TO public
USING (true);

-- Apenas leitura pública em leads
CREATE POLICY "Allow read leads"
ON leads FOR SELECT
TO public
USING (true);
```

### 3. n8n Webhook Authentication

Adicione autenticação no webhook:

```env
N8N_WEBHOOK_SECRET=seu-token-super-secreto
```

E no código:
```typescript
headers: {
  'Authorization': `Bearer ${process.env.N8N_WEBHOOK_SECRET}`
}
```

---

## 🔄 Continuous Deployment (CD)

A Vercel já configura CD automaticamente:

- ✅ **Push para main/master** → Deploy automático em produção
- ✅ **Pull Request** → Preview deployment automático
- ✅ **Commit em branch** → Preview deployment

### Configurar branch de produção

1. Vercel Dashboard → Settings → Git
2. **Production Branch**: `main` (ou `master`)
3. Salvar

---

## 📊 Monitoramento

### Analytics da Vercel

1. Vercel Dashboard → Analytics
2. Veja:
   - Visitas
   - Performance
   - Core Web Vitals

### Logs de Função

1. Vercel Dashboard → Functions
2. Filtre por:
   - `/api/upload-audio`
   - `/api/send-message`
   - `/api/receive-message`

### Supabase Logs

1. Supabase Dashboard → Logs
2. Filtre por:
   - Storage operations
   - API requests

---

## 🎯 Otimizações para Produção

### 1. Ativar Caching

Já está configurado por padrão no Next.js 16.

### 2. Comprimir Imagens (se adicionar)

```typescript
// next.config.ts
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}
```

### 3. Limpar áudios antigos

Configure workflow n8n para deletar áudios com mais de 7 dias (veja `AUDIO_SETUP.md`).

---

## ✅ Checklist Final

- [ ] Deploy bem-sucedido na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Site acessível via URL Vercel
- [ ] Bucket `audios` criado no Supabase
- [ ] Políticas RLS configuradas
- [ ] Webhook n8n atualizado com lógica de áudio
- [ ] Testes realizados:
  - [ ] Gravação de áudio
  - [ ] Upload de arquivo
  - [ ] Envio de texto
  - [ ] Tempo real funcionando
- [ ] Domínio customizado configurado (opcional)
- [ ] Analytics ativado (opcional)

---

## 📚 Recursos Úteis

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [n8n Best Practices](https://docs.n8n.io/hosting/)

---

## 🎉 Deploy Completo!

Seu painel está no ar! 🚀

**URL de produção:**
```
https://seu-projeto.vercel.app
```

**Próximos passos:**
1. Configure domínio customizado
2. Ative analytics
3. Configure alertas de erro
4. Monitore performance

---

**Precisa de ajuda?** Consulte:
- `TROUBLESHOOTING.md` - Guia de problemas comuns
- `AUDIO_SETUP.md` - Configuração de áudio
- `README.md` - Documentação geral
