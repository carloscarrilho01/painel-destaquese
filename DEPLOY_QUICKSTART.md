# 🚀 Deploy Rápido na Vercel (5 minutos)

## Passo 1: Commit e Push (2 min)

```bash
# Adicionar todos os arquivos
git add .

# Commit
git commit -m "Adicionar sistema de envio de áudio completo"

# Push
git push origin awesome-visvesvaraya
```

---

## Passo 2: Deploy na Vercel (3 min)

### Opção A: Via Interface Web (Mais Fácil)

1. **Acesse:** https://vercel.com/new
2. **Import Repository**
3. **Configure:**
   - Project Name: `painel-whatsapp-v3`
   - Framework: Next.js (auto-detectado)

4. **Adicione Environment Variables:**

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
N8N_WEBHOOK_URL=https://seu-n8n.app.n8n.cloud/webhook/send-whatsapp
```

**Marque:** Production + Preview + Development

5. **Clique em "Deploy"**

**Aguarde ~2-3 minutos** ⏱️

---

### Opção B: Via CLI (Mais Rápido)

```bash
# Instalar Vercel CLI (uma vez)
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Seguir prompts
```

---

## Passo 3: Configurar Supabase Storage

**IMPORTANTE:** Se ainda não criou o bucket `audios`:

1. Supabase Dashboard → **Storage** → **New bucket**
2. Nome: `audios`
3. **Public:** ✅
4. Criar

**Adicionar Políticas:**

```sql
CREATE POLICY "Allow public audio upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'audios');

CREATE POLICY "Allow public audio read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audios');
```

---

## Passo 4: Testar Deploy

1. Acesse URL: `https://seu-projeto.vercel.app`
2. Vá em `/conversas`
3. Teste:
   - ✅ Clique no microfone 🎤
   - ✅ Clique no anexo 📎
   - ✅ Envie uma mensagem de texto

---

## ✅ Checklist Rápido

- [ ] Código commitado e pushado
- [ ] Deploy feito na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Bucket `audios` criado no Supabase
- [ ] Site funcionando
- [ ] Áudio testado

---

## 🚨 Problemas?

### Site não carrega
→ Vercel → Functions → Logs (veja erros)

### "Supabase não configurado"
→ Vercel → Settings → Environment Variables → Adicione variáveis → Redeploy

### Áudio não funciona
→ Verifique se bucket `audios` está **público**

---

## 📚 Documentação Completa

- [`DEPLOY.md`](./DEPLOY.md) - Guia completo de deploy
- [`AUDIO_SETUP.md`](./AUDIO_SETUP.md) - Configuração de áudio
- [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) - Soluções de problemas

---

**🎉 Deploy completo! Seu painel está no ar!**

URL: `https://seu-projeto.vercel.app`
