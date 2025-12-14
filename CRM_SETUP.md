# 📊 CRM Kanban - Guia de Instalação

## 🎯 O que foi implementado

Um sistema completo de CRM Kanban integrado ao painel de atendimento WhatsApp, permitindo gerenciar leads visualmente através de um quadro estilo Trello.

### ✨ Funcionalidades

- **6 estágios do funil de vendas:**
  - 🆕 Novo Lead
  - 💬 Em Contato
  - ⭐ Interessado
  - 🤝 Negociação
  - ✅ Fechado
  - ❌ Perdido

- **Drag & Drop:** Arraste cards entre colunas para mudar o estágio
- **Estatísticas em tempo real:** Dashboard com métricas de conversão
- **Clique para conversar:** Clique em um lead para ir direto para a conversa
- **Indicadores visuais:**
  - Status de trava (agente pausado/ativo)
  - Número de followups
  - Última interação
  - Interesse/produto

---

## 📋 Passo 1: Executar Migration no Supabase

### **1.1 Acessar SQL Editor no Supabase**
1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**

### **1.2 Executar o SQL**

Copie e cole o seguinte SQL no editor:

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

### **1.3 Clicar em "RUN"**

Aguarde a confirmação: ✅ Success. No rows returned

---

## 📋 Passo 2: Fazer Deploy das Mudanças

### **Opção A: Desenvolvimento Local**

Se estiver testando localmente:

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Acessar: http://localhost:3000/crm
```

### **Opção B: Deploy em Produção (Vercel)**

```bash
# Commitar mudanças
git add .
git commit -m "Adicionar CRM Kanban"

# Fazer push (deploy automático na Vercel)
git push origin sharp-murdock
```

Aguarde alguns minutos e acesse: `https://seu-dominio.vercel.app/crm`

---

## 🎨 Como Usar o CRM Kanban

### **Acessar o CRM:**
1. No menu lateral, clique em **CRM Kanban**
2. Você verá 6 colunas com os estágios do funil

### **Mover leads entre estágios:**
1. **Clique e segure** um card de lead
2. **Arraste** para a coluna desejada
3. **Solte** o card
4. O sistema salva automaticamente no banco de dados

### **Ver detalhes de um lead:**
- **Clique no card** para ir direto para a conversa do lead

### **Estatísticas no topo:**
- **Total de Leads:** Todos os leads cadastrados
- **Em Andamento:** Leads nos estágios Novo, Contato, Interessado, Negociação
- **Fechados:** Leads que viraram clientes
- **Taxa de Conversão:** % de leads fechados

---

## 🔧 Estrutura de Arquivos Criados

```
src/
├── app/
│   ├── crm/
│   │   └── page.tsx              # Página principal do CRM
│   └── api/
│       └── update-stage/
│           └── route.ts          # API para atualizar stage
│
├── components/
│   ├── kanban-board.tsx          # Componente Kanban com Drag & Drop
│   └── sidebar.tsx               # Atualizado com link do CRM
│
└── lib/
    └── types.ts                  # Atualizado com campo stage

KANBAN_MIGRATION.sql              # SQL para executar no Supabase
CRM_SETUP.md                      # Este arquivo (documentação)
```

---

## 📊 Schema do Banco de Dados

### **Tabela: leads**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | ID único do lead |
| telefone | text | Número do WhatsApp |
| nome | text | Nome do lead |
| trava | boolean | Se agente está pausado |
| interesse | text | Produto/serviço de interesse |
| interessado | boolean | Demonstrou interesse |
| followup | integer | Número de followups |
| last_followup | timestamp | Última interação |
| created_at | timestamp | Data de criação |
| **stage** | text | **NOVO:** Estágio no funil |

### **Valores possíveis para `stage`:**
- `'novo'` - Novo Lead
- `'contato'` - Em Contato
- `'interessado'` - Interessado
- `'negociacao'` - Negociação
- `'fechado'` - Fechado (venda realizada)
- `'perdido'` - Perdido (não converteu)

---

## 🎨 Cores dos Estágios

Cada estágio tem uma cor única para fácil identificação:

| Estágio | Cor | Significado |
|---------|-----|-------------|
| Novo Lead | 🔵 Azul | Leads recém-chegados |
| Em Contato | 🟣 Roxo | Primeira interação feita |
| Interessado | 🟡 Amarelo | Demonstrou interesse |
| Negociação | 🟠 Laranja | Em processo de fechamento |
| Fechado | 🟢 Verde | Venda realizada |
| Perdido | 🔴 Vermelho | Não converteu |

---

## 🔄 Integração com o Sistema Existente

O CRM Kanban está **totalmente integrado** com:

✅ **Página de Conversas:** Clique em um lead → vai para a conversa
✅ **Status de Trava:** Mostra se agente está pausado/ativo
✅ **Followups:** Contabiliza número de interações
✅ **Última Interação:** Mostra quando foi o último contato
✅ **Dados em Tempo Real:** Sincronizado com Supabase

---

## 🚀 Próximos Passos (Melhorias Futuras)

### **Automações Possíveis:**

1. **Mover automaticamente para "Em Contato"** quando agente responder primeira vez
2. **Alertas de followup:** Notificar quando lead está sem contato há X dias
3. **Pipeline de vendas:** Metas por estágio
4. **Relatórios:** Tempo médio em cada estágio
5. **Filtros avançados:** Por período, produto, vendedor
6. **Tags personalizadas:** Segmentação de leads
7. **Histórico de mudanças:** Quem moveu o lead e quando

### **Integrações:**

- **n8n:** Mover leads automaticamente baseado em keywords
- **Webhooks:** Notificar CRM externo quando lead fechar
- **Google Sheets:** Exportar relatórios automaticamente
- **Email:** Notificar time de vendas em mudanças importantes

---

## ❓ Troubleshooting

### **Problema: Erro ao executar SQL**
**Solução:** Verifique se a tabela `leads` existe. Execute:
```sql
SELECT * FROM leads LIMIT 1;
```

### **Problema: Cards não aparecem no Kanban**
**Solução:**
1. Verifique se o campo `stage` foi criado: `SELECT stage FROM leads LIMIT 1;`
2. Verifique se há leads cadastrados: `SELECT COUNT(*) FROM leads;`

### **Problema: Drag & Drop não funciona**
**Solução:**
1. Verifique se está usando um navegador moderno (Chrome, Firefox, Edge)
2. Limpe o cache do navegador (Ctrl+Shift+R)

### **Problema: Erro ao mover lead**
**Solução:**
1. Abra o console do navegador (F12)
2. Verifique se há erros de API
3. Confirme que a API `/api/update-stage` está acessível

---

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Verifique os logs no console do navegador (F12)
2. Verifique os logs do Supabase (Database > Logs)
3. Revise este guia de instalação

---

## ✅ Checklist de Instalação

- [ ] Executei o SQL no Supabase SQL Editor
- [ ] Campo `stage` foi criado com sucesso
- [ ] Fiz commit e push das mudanças
- [ ] Deploy foi realizado (Vercel ou local)
- [ ] Acessei `/crm` e vi o Kanban
- [ ] Testei arrastar um lead entre colunas
- [ ] Cliquei em um lead e fui para a conversa
- [ ] Verifiquei as estatísticas no topo

---

**Pronto! Seu CRM Kanban está configurado e funcionando! 🎉**
