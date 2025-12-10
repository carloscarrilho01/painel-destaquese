# Troubleshooting - Painel WhatsApp v3

Guia rápido para resolver problemas comuns.

---

## 🔍 Atualização Automática Não Funciona

### Verificar Status da Conexão

Quando você abre `/conversas`, deve ver um badge no canto superior esquerdo:

- 🟢 **"Tempo real ativo"** = Realtime funcionando perfeitamente
- 🟡 **"Atualizando (5s)"** = Usando polling (atualiza a cada 5 segundos)
- 🔵 **"Conectando..."** = Tentando conectar

### Abrir Console do Navegador

Pressione `F12` e vá na aba **Console**. Você deve ver logs assim:

```
📡 [Realtime] Status: SUBSCRIBED
✅ [Realtime] Conectado com sucesso!
```

Ou, se falhar:

```
⚠️ [Realtime] Erro na conexão. Usando polling como fallback.
🔄 [Polling] Verificando novas mensagens...
```

### Solução 1: Ativar Realtime no Supabase

Se você vê o status **"Atualizando (5s)"** amarelo:

1. Acesse https://supabase.com
2. Selecione seu projeto
3. Vá em **Database** > **Replication**
4. Ative o toggle **Enable Realtime** na tabela `chats`
5. Recarregue a página do painel

Depois disso, o badge deve ficar verde.

### Solução 2: Polling já funciona!

Se você vê o badge amarelo, **já está funcionando**! O sistema atualiza automaticamente a cada 5 segundos. É mais lento que Realtime, mas funciona.

---

## ❌ Campo de Envio Não Aparece

### Verificar se está na página correta

O campo de envio só aparece em `/conversas` quando você **seleciona uma conversa**.

1. Acesse `/conversas`
2. Clique em uma conversa na lista lateral
3. O campo deve aparecer na parte inferior

### Limpar cache do navegador

`Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac)

### Verificar console

Abra o console (F12) e procure por erros em vermelho.

---

## 📤 Erro ao Enviar Mensagem

### Erro: "Webhook n8n não configurado"

**Causa**: Variável `N8N_WEBHOOK_URL` não está definida.

**Solução**:

1. **Desenvolvimento local**: Crie `.env.local` na raiz:
   ```env
   N8N_WEBHOOK_URL=https://seu-n8n.app.n8n.cloud/webhook/send-whatsapp
   ```

2. **Produção (Vercel)**:
   - Acesse Vercel > Settings > Environment Variables
   - Adicione `N8N_WEBHOOK_URL` com a URL do seu webhook
   - Redeploy o projeto

### Erro: "Timeout ao conectar com webhook n8n"

**Causa**: URL do webhook está incorreta ou o n8n não está respondendo.

**Solução**:

1. Verifique se a URL está correta
2. Teste a URL no navegador ou Postman
3. Verifique se o workflow n8n está ativo
4. Aumente o timeout (padrão: 10 segundos) em `src/app/api/send-message/route.ts`

### Erro: "Falha ao enviar mensagem via webhook"

**Causa**: O webhook retornou erro (status 400, 500, etc).

**Solução**:

1. Veja os logs do n8n (aba Executions)
2. Verifique se o payload está correto
3. Teste o endpoint do Evolution API ou WhatsApp diretamente

---

## 🗄️ Erro: "Configuracao Necessaria" (Supabase)

### Sintoma

Ao acessar qualquer página, aparece um alerta amarelo.

### Solução

1. Crie `.env.local` na raiz do projeto:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
   ```

2. Reinicie o servidor:
   ```bash
   npm run dev
   ```

3. **Na Vercel**: Configure as mesmas variáveis em Settings > Environment Variables

---

## 🔄 Conversas Não Carregam

### Verificar se as tabelas existem

No Supabase:

1. Vá em **Database** > **Tables**
2. Verifique se existem as tabelas:
   - `chats` (com colunas: id, session_id, message)
   - `leads` (com colunas: id, telefone, nome, etc.)

### Verificar políticas RLS

1. Vá em **Authentication** > **Policies**
2. Certifique-se de que há políticas permitindo SELECT:

```sql
-- Para tabela chats
CREATE POLICY "Enable read access for all users" ON "public"."chats"
FOR SELECT
USING (true);

-- Para tabela leads
CREATE POLICY "Enable read access for all users" ON "public"."leads"
FOR SELECT
USING (true);
```

---

## 🚀 Deploy na Vercel Falha

### Build error: TypeScript

Verifique os logs de build na Vercel. Erros comuns:

1. **Variáveis de ambiente faltando**: Adicione em Settings > Environment Variables
2. **Versão do Node**: Certifique-se de usar Node 18+

### Runtime error: 500

1. Verifique os logs em Vercel > Deployments > (clique no deployment) > Functions
2. Erros comuns:
   - Supabase credentials incorretas
   - Timeout em queries

---

## 🔧 Logs e Debug

### Ativar logs detalhados

Abra o console do navegador (F12) e execute:

```javascript
localStorage.setItem('debug', 'supabase:*')
```

Recarregue a página. Você verá logs detalhados de todas as operações do Supabase.

### Ver logs de Realtime

Os logs já aparecem automaticamente no console:

```
📡 [Realtime] Status: SUBSCRIBED
✅ [Realtime] Nova mensagem recebida: {...}
🔄 [Polling] Verificando novas mensagens...
```

### Ver logs de envio de mensagens

Quando você envia uma mensagem, veja no console:

```javascript
// Sucesso
Mensagem enviada com sucesso!

// Erro
Erro ao enviar mensagem: {...}
```

---

## 📊 Performance

### Conversas carregam lentamente

**Causa**: Muitas mensagens no banco.

**Solução**:

1. Adicionar paginação (TODO futuro)
2. Limitar quantidade de mensagens carregadas por padrão
3. Arquivar conversas antigas

### Polling consome muita rede

**Causa**: Atualização a cada 5 segundos.

**Solução**:

1. Ative o Realtime no Supabase (recomendado)
2. Ou aumente o intervalo de polling em `src/components/realtime-conversations.tsx`:

```typescript
// Mudar de 5000 para 10000 (10 segundos)
pollingInterval = setInterval(() => {
  fetchData()
}, 10000) // 10s em vez de 5s
```

---

## ✅ Checklist Geral

Antes de abrir um issue, verifique:

- [ ] Variáveis de ambiente configuradas (`.env.local` ou Vercel)
- [ ] Supabase conectado e tabelas criadas
- [ ] Realtime ativado no Supabase (opcional)
- [ ] Webhook n8n configurado (opcional, só para envio)
- [ ] Console do navegador sem erros
- [ ] Cache do navegador limpo (`Ctrl + Shift + R`)
- [ ] Versão mais recente do código (pull latest)

---

## 🆘 Ainda com Problemas?

### Informações úteis para debug:

1. **Console logs** (F12 > Console)
2. **Network tab** (F12 > Network) - veja requisições falhando
3. **Status badges** - qual cor está aparecendo?
4. **Versão do navegador**
5. **Ambiente** (desenvolvimento ou produção)

### Onde pedir ajuda:

- GitHub Issues: https://github.com/carloscarrilho01/painel-destaquese/issues
- Incluir: prints de tela, logs do console, passos para reproduzir

---

## 🎯 Dicas de Debug Rápido

```bash
# Verificar se .env.local existe
ls -la .env.local

# Ver variáveis de ambiente (Linux/Mac)
cat .env.local

# Reiniciar servidor Next.js
# Ctrl+C para parar, depois:
npm run dev

# Limpar cache do Next.js
rm -rf .next
npm run dev

# Verificar versão do Node
node --version  # Deve ser 18+
```

---

**💡 Lembre-se: O sistema funciona com ou sem Realtime! Se você vê o badge amarelo "Atualizando (5s)", já está funcionando.**
