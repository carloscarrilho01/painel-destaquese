# Guia de Deploy para Produção

## 🚀 Deploy Rápido (Vercel - Recomendado)

### Pré-requisitos
- ✅ Conta no [Vercel](https://vercel.com)
- ✅ Conta no [Supabase](https://supabase.com)
- ✅ Webhook n8n configurado

### Passo 1: Preparar o Repositório

```bash
# Voltar para o diretório principal (fora do worktree)
cd C:\Users\carlo\OneDrive\Área de Trabalho\painel.v3

# Fazer merge do branch agitated-roentgen para main
git checkout main
git merge agitated-roentgen

# Ou fazer push direto do branch
git push origin agitated-roentgen
```

### Passo 2: Deploy na Vercel

#### Opção A: Via Interface (Mais Fácil)

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"New Project"**
3. Importe o repositório do GitHub
4. Configure as variáveis de ambiente (veja abaixo)
5. Clique em **"Deploy"**

#### Opção B: Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

### Passo 3: Configurar Variáveis de Ambiente na Vercel

Na interface da Vercel, vá em **Settings → Environment Variables** e adicione:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# n8n Webhook (obrigatório para enviar mensagens)
N8N_WEBHOOK_URL=https://seu-n8n.app.n8n.cloud/webhook/send-whatsapp

# Segurança (opcional, mas recomendado)
N8N_WEBHOOK_SECRET=seu-token-super-secreto
WEBHOOK_SECRET=seu-token-para-receive-message
```

**IMPORTANTE:** Marque todas as variáveis `NEXT_PUBLIC_*` para os 3 ambientes:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## 🐳 Deploy com Docker

### Dockerfile

Crie um arquivo `Dockerfile` na raiz do projeto:

```dockerfile
FROM node:20-alpine AS base

# Dependências
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de build (Next.js precisa no build)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# Produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  painel:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - N8N_WEBHOOK_URL=${N8N_WEBHOOK_URL}
      - N8N_WEBHOOK_SECRET=${N8N_WEBHOOK_SECRET}
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
    restart: unless-stopped
```

### Comandos Docker

```bash
# Build
docker build -t painel-whatsapp .

# Run
docker run -p 3000:3000 --env-file .env.production painel-whatsapp

# Com docker-compose
docker-compose up -d
```

---

## ☁️ Outras Plataformas de Deploy

### Netlify

```bash
# Instalar CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `.next`

### Railway

1. Conecte seu repositório
2. Configure variáveis de ambiente
3. Deploy automático a cada push

### Render

1. New Web Service
2. Conecte repositório
3. Build: `npm run build`
4. Start: `npm run start`

---

## 🔧 Configuração Pós-Deploy

### 1. Configurar Supabase Realtime

No Supabase Dashboard:

1. Vá em **Database → Replication**
2. Ative Realtime na tabela `chats`
3. Configure RLS (Row Level Security) se necessário:

```sql
-- Permitir leitura pública (ou configure autenticação)
CREATE POLICY "Allow public read" ON chats
  FOR SELECT USING (true);

-- Permitir escrita pública (ou configure autenticação)
CREATE POLICY "Allow public insert" ON chats
  FOR INSERT WITH CHECK (true);
```

### 2. Atualizar Webhook n8n

No n8n, atualize o webhook de recebimento para apontar para seu domínio:

```
POST https://seu-dominio.vercel.app/api/receive-message
Header: Authorization: Bearer seu-token-secreto
```

### 3. Configurar Domínio Customizado (Opcional)

Na Vercel:
1. Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções

---

## 📊 Monitoramento

### Logs na Vercel

```bash
# Via CLI
vercel logs

# Ou na interface: Deployments → Selecionar deploy → Functions → Logs
```

### Verificações de Saúde

Teste os endpoints:

```bash
# Health check (página principal)
curl https://seu-dominio.vercel.app

# API de envio (requer dados)
curl -X POST https://seu-dominio.vercel.app/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"phone":"5511999999999","message":"teste","clientName":"teste"}'

# API de leads
curl -X POST https://seu-dominio.vercel.app/api/leads \
  -H "Content-Type: application/json" \
  -d '{"telefone":"5511999999999","nome":"teste"}'
```

---

## 🔒 Segurança em Produção

### 1. Ativar CORS (se necessário)

Em `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://seu-dominio.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### 2. Configurar Rate Limiting

Use Vercel Edge Config ou middleware:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Implementar rate limiting aqui
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

### 3. Validar Tokens em Produção

Garanta que `N8N_WEBHOOK_SECRET` e `WEBHOOK_SECRET` estejam configurados.

---

## 🐛 Troubleshooting

### Erro: "Internal Server Error"

1. Verifique logs: `vercel logs`
2. Confirme variáveis de ambiente
3. Teste build local: `npm run build && npm run start`

### Erro: "Supabase connection failed"

1. Verifique `NEXT_PUBLIC_SUPABASE_URL`
2. Verifique `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Teste conexão diretamente no Supabase Dashboard

### Erro: "n8n webhook timeout"

1. Verifique `N8N_WEBHOOK_URL`
2. Teste webhook diretamente com curl
3. Aumente timeout em `src/components/chat-view.tsx` (atualmente 10s)

### Realtime não funciona

1. Ative Realtime no Supabase (Database → Replication)
2. Verifique se polling está ativo (fallback automático)
3. Status deve mostrar 🟡 "Atualizando (3s)" se Realtime falhar

---

## 📈 Performance

### Otimizações Recomendadas

1. **Image Optimization**: Next.js otimiza automaticamente
2. **Font Optimization**: Já configurado com Geist
3. **Bundle Analysis**:

```bash
npm install -D @next/bundle-analyzer

# Em next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

# Rodar análise
ANALYZE=true npm run build
```

4. **Cache**: Vercel faz cache automático de static files

---

## 🔄 CI/CD

### GitHub Actions (Opcional)

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Deploy to Vercel
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 📝 Checklist de Deploy

Antes de fazer deploy:

- [ ] Variáveis de ambiente configuradas
- [ ] Supabase Realtime ativado
- [ ] n8n webhook testado
- [ ] Build local funcionando (`npm run build`)
- [ ] Código commitado no Git
- [ ] Testes básicos realizados
- [ ] Documentação atualizada
- [ ] Domínio configurado (se aplicável)

Após deploy:

- [ ] Testar criação de nova conversa
- [ ] Testar envio de mensagem
- [ ] Verificar Realtime/Polling
- [ ] Testar página de leads
- [ ] Verificar indicadores visuais
- [ ] Monitorar logs por 24h

---

## 🆘 Suporte

Em caso de problemas:

1. Consulte logs: `vercel logs`
2. Veja TROUBLESHOOTING.md
3. Revise NOVA_CONVERSA_FEATURE.md

---

**Deploy realizado com sucesso! 🎉**
