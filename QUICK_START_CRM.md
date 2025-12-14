# 🚀 Quick Start - CRM Kanban

## ⚠️ ERRO: "Erro ao mover lead. Tente novamente"

### **Por que isso acontece?**
O campo `stage` ainda não foi criado na tabela `leads` do Supabase.

### **Solução (2 minutos):**

---

## 📋 Passo 1: Copiar o SQL

Copie este código SQL:

```sql
-- Adicionar coluna stage na tabela leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS stage text DEFAULT 'novo';

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);

-- Atualizar leads existentes baseado no campo interessado
UPDATE leads
SET stage = CASE
  WHEN interessado = true THEN 'interessado'
  ELSE 'novo'
END
WHERE stage = 'novo';
```

---

## 📋 Passo 2: Executar no Supabase

### **2.1 Acessar Supabase:**
🔗 https://supabase.com/dashboard

### **2.2 Selecionar seu projeto**

### **2.3 Ir em "SQL Editor":**
- Menu lateral esquerdo
- Clique em **"SQL Editor"**

### **2.4 Colar e Executar:**
1. Cole o SQL copiado no editor
2. Clique no botão **"RUN"** (ou pressione Ctrl+Enter)
3. Aguarde a mensagem: ✅ **Success. No rows returned**

---

## 📋 Passo 3: Recarregar a Página

1. Volte para a página do CRM: `/crm`
2. Recarregue a página (F5 ou Ctrl+R)
3. ✅ Agora você pode arrastar os cards!

---

## 🎯 Pronto!

Agora o CRM Kanban está 100% funcional:

✅ Arrastar cards entre colunas
✅ Clicar no card para ver a conversa
✅ Estatísticas atualizadas
✅ Dados salvos automaticamente

---

## 📊 Como Usar

### **Mover um lead:**
1. **Clique e segure** o card do lead
2. **Arraste** para a coluna desejada
3. **Solte** o card
4. ✅ Salvo automaticamente!

### **Ver a conversa de um lead:**
- **Clique no card** → redireciona para `/conversas`

---

## 🔍 Verificar se Funcionou

Execute este SQL para ver todos os stages:

```sql
SELECT telefone, nome, stage
FROM leads
ORDER BY created_at DESC
LIMIT 10;
```

Você deve ver a coluna `stage` com valores como:
- `novo`
- `contato`
- `interessado`
- `negociacao`
- `fechado`
- `perdido`

---

## ❌ Troubleshooting

### **Ainda dá erro após executar SQL?**

1. **Verifique se o SQL foi executado com sucesso:**
   ```sql
   SELECT stage FROM leads LIMIT 1;
   ```
   - Se retornar erro: O SQL não foi executado corretamente
   - Se retornar valor ou NULL: ✅ Campo criado

2. **Limpe o cache do navegador:**
   - Pressione `Ctrl + Shift + R` (Windows/Linux)
   - Ou `Cmd + Shift + R` (Mac)

3. **Recarregue o deploy:**
   - Aguarde o deploy da Vercel terminar
   - Acesse a URL de produção novamente

4. **Verifique os logs do navegador:**
   - Pressione `F12`
   - Vá na aba **Console**
   - Procure por erros em vermelho

---

## 📞 Ainda com Problemas?

Se após seguir todos os passos o erro persistir:

1. Abra o console do navegador (F12)
2. Vá na aba **Network**
3. Tente mover um card
4. Clique na requisição `update-stage`
5. Veja a resposta completa (Response tab)
6. Me envie o erro completo

---

## ✅ Checklist

- [ ] Copiei o SQL
- [ ] Acessei o Supabase Dashboard
- [ ] Fui em SQL Editor
- [ ] Colei e executei o SQL
- [ ] Vi a mensagem de sucesso
- [ ] Recarreguei a página do CRM
- [ ] Consegui arrastar um card
- [ ] O card mudou de coluna
- [ ] Cliquei em um card e fui para a conversa

---

**Pronto! Seu CRM Kanban está funcionando! 🎉**
