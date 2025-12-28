# ⚡ Setup Rápido - Sistema Otimizado de Conversas

## 🎯 Objetivo

Ativar o novo sistema de conversas que busca dados **direto da API Dinasti** em vez do banco de dados, tornando o painel **10-50x mais rápido**.

---

## ✅ Checklist de Ativação

### 1️⃣ Configurar Variáveis de Ambiente (2 min)

Edite o arquivo `.env.local` e adicione:

```env
# API Dinasti (WhatsApp)
DINASTI_API_URL=https://dinastiapi.destaquese.uk/api
DINASTI_API_TOKEN=SEU_TOKEN_AQUI
DINASTI_INSTANCE_NAME=SUA_INSTANCIA
```

**Como obter os valores:**

- **DINASTI_API_TOKEN**:
  1. Acesse https://dinastiapi.destaquese.uk/api
  2. Faça login no admin
  3. Copie o token de autenticação

- **DINASTI_INSTANCE_NAME**:
  1. Use o nome da sua instância ativa (ex: `minha-instancia`)

---

### 2️⃣ Ativar Componente Otimizado (1 min)

Renomeie o componente otimizado:

```bash
# Windows (PowerShell)
mv src/components/realtime-conversations.tsx src/components/realtime-conversations-old.tsx
mv src/components/realtime-conversations-optimized.tsx src/components/realtime-conversations.tsx

# Linux/Mac
mv src/components/realtime-conversations.tsx src/components/realtime-conversations-old.tsx
mv src/components/realtime-conversations-optimized.tsx src/components/realtime-conversations.tsx
```

---

### 3️⃣ Testar (1 min)

```bash
npm run dev
```

Acesse: http://localhost:3000/conversas

**Verifique:**
- ✅ Conversas carregam em menos de 1 segundo
- ✅ Status de conexão aparece no canto superior esquerdo
- ✅ Tempo de fetch é exibido (deve ser ~200-500ms)

---

### 4️⃣ (Opcional) Usar API Dinasti para Envio

Se quiser enviar mensagens direto pela API Dinasti (mais rápido):

Edite `src/components/chat-view.tsx`:

```typescript
// Encontre esta linha (aproximadamente linha 150):
const response = await fetch('/api/send-message', {

// Substitua por:
const response = await fetch('/api/send-message-dinasti', {
```

**Vantagem**: Envio mais rápido, sem passar por n8n.

---

## 🎉 Pronto!

Agora seu painel está otimizado e funcionando com a nova arquitetura!

**Performance esperada:**
- ✅ Carregamento inicial: **200-500ms** (antes: 5-10s)
- ✅ Atualizações: **Instantâneas** (antes: 0-3s)
- ✅ Polling inteligente: **Pausa quando você sai da página**

---

## 🔧 Solução Rápida de Problemas

### Erro: "DINASTI_API_TOKEN não configurado"

→ Adicione as variáveis no `.env.local` (passo 1)

### Conversas não aparecem

```bash
# Teste a API
curl http://localhost:3000/api/active-conversations
```

→ Verifique se token e nome da instância estão corretos

### Polling não funciona

→ Abra DevTools Console, procure por mensagens de erro

---

## 📖 Documentação Completa

Veja `OTIMIZACAO_CONVERSAS.md` para detalhes técnicos completos.

---

**Dúvidas?** Abra uma issue ou consulte os logs do servidor! 🚀
