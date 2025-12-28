# 🚀 Como Configurar Variáveis de Ambiente na Vercel

## ⚠️ ERRO ATUAL

```
Error 500: The service was not able to process your request
Falha ao enviar mensagem via WhatsApp
API Dinasti Error [404]: 404 page not found
```

**Causa:** Variáveis de ambiente `DINASTI_API_TOKEN` e `DINASTI_INSTANCE_NAME` não configuradas na Vercel.

---

## ✅ SOLUÇÃO: Configurar Variáveis na Vercel

### **Passo 1: Acesse o Painel da Vercel**

1. Vá para: https://vercel.com/dashboard
2. Faça login com sua conta
3. Selecione o projeto **painel-destaquese**

---

### **Passo 2: Abra as Configurações**

1. Clique em **Settings** (no menu superior)
2. No menu lateral esquerdo, clique em **Environment Variables**

---

### **Passo 3: Adicione as Variáveis**

Adicione as seguintes variáveis:

#### **Variável 1: DINASTI_API_TOKEN**

| Campo | Valor |
|-------|-------|
| **Name** | `DINASTI_API_TOKEN` |
| **Value** | `seu_token_da_evolution_api` |
| **Environment** | ✅ Production<br>✅ Preview<br>✅ Development |

> **Onde encontrar?**
> - No painel da Evolution API (Dinasti)
> - URL: https://dinastiapi.destaquese.uk
> - Geralmente em Settings → API Key ou Token

---

#### **Variável 2: DINASTI_INSTANCE_NAME**

| Campo | Valor |
|-------|-------|
| **Name** | `DINASTI_INSTANCE_NAME` |
| **Value** | `nome_da_sua_instancia` |
| **Environment** | ✅ Production<br>✅ Preview<br>✅ Development |

> **Onde encontrar?**
> - No painel da Evolution API
> - Nome da instância WhatsApp conectada
> - Exemplo: `whatsapp-prod`, `destaquese`, etc.

---

#### **Variável 3: DINASTI_API_URL** (Opcional)

| Campo | Valor |
|-------|-------|
| **Name** | `DINASTI_API_URL` |
| **Value** | `https://dinastiapi.destaquese.uk/api` |
| **Environment** | ✅ Production<br>✅ Preview<br>✅ Development |

> **Nota:** Esta já tem valor padrão no código, mas é bom configurar.

---

### **Passo 4: Salvar e Redesployar**

1. Clique em **Save** em cada variável
2. Após adicionar todas, clique em **Deployments** (menu superior)
3. No último deployment, clique nos 3 pontinhos **`...`**
4. Selecione **Redeploy**
5. Confirme marcando **"Use existing Build Cache"** (mais rápido)
6. Clique em **Redeploy**

---

## 📋 Checklist de Configuração

- [ ] Acessei https://vercel.com/dashboard
- [ ] Selecionei o projeto **painel-destaquese**
- [ ] Fui em **Settings** → **Environment Variables**
- [ ] Adicionei `DINASTI_API_TOKEN` com o token correto
- [ ] Adicionei `DINASTI_INSTANCE_NAME` com o nome da instância
- [ ] Adicionei `DINASTI_API_URL` (opcional)
- [ ] Salvei todas as variáveis
- [ ] Fiz **Redeploy** do último deployment
- [ ] Aguardei o deploy finalizar (~2-3 minutos)
- [ ] Testei novamente o envio de mensagem no n8n

---

## 🧪 Como Testar Depois

### **Teste 1: Health Check**

Abra no navegador:
```
https://painel-destaquese.vercel.app/api/send-message-dinasti
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "message": "API de envio de mensagens Dinasti funcionando",
  "instance": {
    "state": "open",
    "status": "connected"
  },
  "timestamp": "2025-12-28T..."
}
```

---

### **Teste 2: Enviar Mensagem via cURL**

```bash
curl -X POST https://painel-destaquese.vercel.app/api/send-message-dinasti \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "Teste de mensagem via API!",
    "clientName": "Teste"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso",
  "response": {...},
  "sessionId": "5511999999999",
  "timestamp": "2025-12-28T..."
}
```

---

### **Teste 3: Enviar via n8n**

Execute o workflow no n8n novamente. Deve funcionar sem erros.

---

## 🔐 Onde Encontrar os Valores

### **DINASTI_API_TOKEN e DINASTI_INSTANCE_NAME**

1. **Acesse o painel Evolution API:**
   - URL: https://dinastiapi.destaquese.uk
   - Ou o URL do seu servidor Evolution API

2. **Faça login**

3. **Vá em "Instances"** ou "Instâncias"
   - Você verá a lista de instâncias WhatsApp

4. **Clique na sua instância**
   - **Nome da instância** = `DINASTI_INSTANCE_NAME`

5. **Procure por "API Key" ou "Token"**
   - Pode estar em: Settings, Configurações, API
   - **Token** = `DINASTI_API_TOKEN`

---

## ❓ Ainda com Dúvidas?

### **Se não souber o token:**
- Entre em contato com o administrador do Evolution API
- Ou acesse o painel administrativo do Evolution API

### **Se não souber a instância:**
- Liste todas as instâncias no painel
- Use o nome da instância conectada ao WhatsApp

### **Se ainda der erro:**
1. Verifique se as variáveis foram salvas corretamente
2. Confirme que fez o redeploy
3. Aguarde 2-3 minutos para o deploy finalizar
4. Teste o health check primeiro

---

## 📊 Resumo Visual

```
┌─────────────────────────────────────────┐
│   VERCEL DASHBOARD                       │
│                                          │
│  Settings → Environment Variables        │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ DINASTI_API_TOKEN              │     │
│  │ seu_token_aqui                 │     │
│  │ ✅ Prod ✅ Preview ✅ Dev       │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ DINASTI_INSTANCE_NAME          │     │
│  │ sua_instancia                  │     │
│  │ ✅ Prod ✅ Preview ✅ Dev       │     │
│  └────────────────────────────────┘     │
│                                          │
│  [Save]                                  │
│                                          │
└─────────────────────────────────────────┘
              ↓
    Deployments → Redeploy
              ↓
         Aguardar 2-3min
              ↓
        ✅ Funcionando!
```

---

**Depois de configurar, o n8n vai funcionar perfeitamente!** 🚀
