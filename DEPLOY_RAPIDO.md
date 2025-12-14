# 🚀 Deploy Rápido - Vercel (5 minutos)

## Passo 1: Fazer Push do Código

```bash
# Push do branch para o GitHub
git push origin agitated-roentgen

# Ou fazer merge com main e push
git checkout main
git merge agitated-roentgen
git push origin main
```

## Passo 2: Deploy na Vercel

### Opção A: Interface Web (Recomendado)

1. Acesse https://vercel.com
2. Clique em **"Add New" → "Project"**
3. Selecione seu repositório: `carloscarrilho01/painel-destaquese`
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
5. Clique em **"Environment Variables"**
6. Adicione as variáveis (veja abaixo)
7. Clique em **"Deploy"**

### Variáveis de Ambiente Necessárias

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
N8N_WEBHOOK_URL=https://seu-n8n.app.n8n.cloud/webhook/send-whatsapp
```

**IMPORTANTE:** Marque as variáveis `NEXT_PUBLIC_*` para todos os ambientes:
- ✅ Production
- ✅ Preview
- ✅ Development

### Opção B: CLI (Rápido)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (vai pedir pra configurar)
vercel

# Adicionar variáveis de ambiente
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add N8N_WEBHOOK_URL

# Deploy para produção
vercel --prod
```

## Passo 3: Configurar Supabase

1. Acesse seu projeto no Supabase
2. Vá em **Database → Replication**
3. Ative **Realtime** na tabela `chats`
4. Pronto! ✅

## Passo 4: Testar

Acesse sua URL da Vercel e teste:

1. **Dashboard:** `https://seu-app.vercel.app`
2. **Conversas:** `https://seu-app.vercel.app/conversas`
   - Clique em "+ Nova Conversa"
   - Preencha telefone e mensagem
   - Envie!
3. **Leads:** `https://seu-app.vercel.app/leads`
   - Clique em "Iniciar" em um lead
   - Ou "Ver Chat" em lead com conversa

## 🎉 Pronto!

Seu painel está no ar em **menos de 5 minutos**!

URL: `https://seu-app.vercel.app`

---

## Troubleshooting Rápido

### "Supabase connection failed"
→ Verifique se as variáveis `NEXT_PUBLIC_SUPABASE_*` estão corretas

### "n8n webhook timeout"
→ Verifique se `N8N_WEBHOOK_URL` está acessível

### Realtime não funciona
→ Ative no Supabase: Database → Replication → Enable `chats`
→ Polling funciona automaticamente como fallback (3s)

---

## Próximos Passos (Opcional)

- [ ] Configurar domínio customizado (Vercel → Settings → Domains)
- [ ] Ativar analytics (Vercel → Analytics)
- [ ] Configurar alertas (Vercel → Notifications)
- [ ] Adicionar proteção por senha (Vercel → Settings → Password Protection)

---

Para mais detalhes, veja **DEPLOY.md**
