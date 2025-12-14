# Funcionalidade: Iniciar Nova Conversa pelo Painel

## Resumo

Implementação completa da funcionalidade de **iniciar novas conversas** diretamente pelo painel WhatsApp v3. Agora é possível criar conversas com leads existentes ou novos números de telefone através de uma interface intuitiva.

---

## Arquivos Criados

### 1. `/src/app/api/leads/route.ts`
API REST para criar leads no banco de dados.

**Funcionalidades:**
- ✅ Validação de telefone obrigatório
- ✅ Verifica se lead já existe antes de criar
- ✅ Retorna sucesso mesmo se lead já existir (idempotente)
- ✅ Suporta campos: telefone, nome, interesse

**Endpoint:**
```typescript
POST /api/leads
Body: {
  telefone: string (obrigatório)
  nome?: string
  interesse?: string
}
```

---

### 2. `/src/components/new-conversation-modal.tsx`
Modal completo para criar nova conversa.

**Funcionalidades:**
- ✅ Formulário com validação de telefone
- ✅ Campos: telefone (obrigatório), nome (opcional), primeira mensagem (opcional)
- ✅ Valida formato de telefone (mínimo 10 dígitos)
- ✅ Cria lead automaticamente se nome fornecido
- ✅ Envia primeira mensagem via `/api/send-message`
- ✅ Suporta valores pré-preenchidos (`initialPhone`, `initialName`)
- ✅ Feedback visual de erros
- ✅ Loading state durante processamento
- ✅ Design responsivo com dark mode

**Props:**
```typescript
interface NewConversationModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (sessionId: string) => void
  initialPhone?: string    // Novo: pré-preenche telefone
  initialName?: string     // Novo: pré-preenche nome
}
```

---

## Arquivos Modificados

### 3. `/src/components/conversation-list.tsx`
Adicionado botão "Nova Conversa" no topo da sidebar.

**Mudanças:**
- ✅ Importado `Plus` icon e `NewConversationModal`
- ✅ Adicionado state `showNewConversation`
- ✅ Adicionado prop `onNewConversation` (callback)
- ✅ Botão verde "Nova Conversa" com ícone +
- ✅ Modal integrado com callback para navegar

**Localização:** Linha ~33 (botão) e ~96 (modal)

---

### 4. `/src/components/leads-table.tsx`
Adicionada coluna "Ações" com botões contextuais.

**Mudanças:**
- ✅ Importados ícones `MessageCircle`, `Send` e componentes
- ✅ Adicionado prop `conversationSessions` (array de session_ids)
- ✅ Adicionado state `showNewConversation` e `selectedLead`
- ✅ Função `hasConversation()` - verifica se lead tem conversa ativa
- ✅ Função `handleStartConversation()` - abre modal com dados do lead
- ✅ Coluna "Ações" com botões:
  - **Ver Chat** (azul) - se conversa existe
  - **Iniciar** (verde) - se conversa não existe
- ✅ Modal integrado com redirecionamento automático

**Normalização de telefone:**
```typescript
// Tenta múltiplas variações:
- 5511999999999 (completo)
- 11999999999   (sem código país)
- 5511999999    (número antigo sem 9)
- 11999999      (reverso sem código país)
```

**Localização:**
- Linha ~118-124: Header da tabela (nova coluna)
- Linha ~48-58: Função `hasConversation()`
- Linha ~181-199: Botões de ação
- Linha ~208-222: Modal integrado

---

### 5. `/src/app/leads/page.tsx`
Carrega session_ids das conversas e passa para tabela.

**Mudanças:**
- ✅ Criada função `getConversationSessions()`
- ✅ Busca todos os `session_id` únicos da tabela `chats`
- ✅ Passa array para `LeadsTable` via prop `conversationSessions`

**Localização:** Linha ~22-37 (função) e ~70 (uso)

---

### 6. `/src/components/realtime-conversations.tsx`
Suporte a query parameter e navegação programática.

**Mudanças:**
- ✅ Importado `useRouter` e `useSearchParams` do Next.js
- ✅ useEffect monitora mudanças em `?session=...`
- ✅ Função `handleNewConversation()` - navega via router.push
- ✅ Prop `onNewConversation` passada para `ConversationList`
- ✅ Atualiza URL quando nova conversa é criada

**Localização:**
- Linha ~4: Imports
- Linha ~81-82: Hooks router/searchParams
- Linha ~88-94: useEffect para query params
- Linha ~96-100: Função handleNewConversation
- Linha ~238: Prop onNewConversation

---

## Fluxo de Uso

### Cenário 1: Nova Conversa pela Sidebar

```
1. Usuário clica em "+ Nova Conversa" (sidebar)
2. Modal abre vazio
3. Usuário preenche:
   - Telefone: 5511999999999
   - Nome: João Silva (opcional)
   - Mensagem: "Olá!" (opcional)
4. Clica "Iniciar Conversa"
5. Sistema:
   - Cria lead (se nome fornecido)
   - Envia mensagem (se fornecida)
   - Navega para /conversas?session=5511999999999
6. Realtime/Polling atualiza automaticamente
```

---

### Cenário 2: Nova Conversa pela Tabela de Leads

```
1. Usuário acessa /leads
2. Identifica lead sem conversa
3. Clica botão "Iniciar" (verde)
4. Modal abre PRÉ-PREENCHIDO com:
   - Telefone: 5511988888888 (do lead)
   - Nome: Maria Santos (do lead)
5. Usuário digita mensagem (opcional)
6. Clica "Iniciar Conversa"
7. Sistema redireciona para /conversas?session=5511988888888
```

---

### Cenário 3: Ver Conversa Existente

```
1. Usuário acessa /leads
2. Identifica lead COM conversa
3. Clica botão "Ver Chat" (azul)
4. Redireciona direto para /conversas?session=5511977777777
5. Conversa carrega automaticamente
```

---

## Tecnologias Utilizadas

- **Next.js 16** (App Router + Server Actions)
- **React 19** (Client Components + Hooks)
- **TypeScript** (Tipagem completa)
- **Supabase** (PostgreSQL + Realtime)
- **Tailwind CSS v4** (Estilização)
- **Lucide React** (Ícones)

---

## Endpoints API

### POST /api/leads
Cria novo lead no banco.

**Request:**
```json
{
  "telefone": "5511999999999",
  "nome": "João Silva",
  "interesse": "Produto X"
}
```

**Response (Sucesso):**
```json
{
  "message": "Lead criado com sucesso",
  "lead": {
    "id": "uuid",
    "telefone": "5511999999999",
    "nome": "João Silva",
    "interesse": "Produto X",
    "created_at": "2025-12-14T10:00:00Z"
  }
}
```

**Response (Lead já existe):**
```json
{
  "message": "Lead já existe",
  "lead": { "id": "uuid" }
}
```

---

### POST /api/send-message
Envia mensagem WhatsApp via webhook n8n (já existia).

**Request:**
```json
{
  "phone": "5511999999999",
  "message": "Olá! Como posso ajudar?",
  "clientName": "João Silva"
}
```

---

## Validações

### Telefone
- ✅ Mínimo 10 dígitos (apenas números)
- ✅ Remove caracteres não numéricos automaticamente
- ✅ Suporta variações de formato

### Nome (Opcional)
- Usado para criar lead automaticamente
- Exibido na conversa

### Mensagem (Opcional)
- Se fornecida, envia via n8n
- Se vazia, apenas cria lead sem mensagem

---

## Componentes UI

### Botão "Nova Conversa" (Sidebar)
```tsx
<button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg">
  <Plus size={18} />
  Nova Conversa
</button>
```

### Botão "Ver Chat" (Leads)
```tsx
<Link href="/conversas?session=..." className="bg-blue-600 text-white">
  <MessageCircle size={16} />
  Ver Chat
</Link>
```

### Botão "Iniciar" (Leads)
```tsx
<button onClick={...} className="bg-green-600 text-white">
  <Send size={16} />
  Iniciar
</button>
```

---

## Integração com Sistema Existente

### Realtime/Polling
- ✅ Atualiza automaticamente quando mensagem enviada
- ✅ Detecta novas conversas via Supabase Realtime
- ✅ Fallback para polling (3s) se Realtime falhar

### Navegação
- ✅ Query parameter `?session=...` seleciona conversa
- ✅ `router.push()` atualiza URL sem reload
- ✅ `useSearchParams()` monitora mudanças

### Normalização de Telefone
- ✅ Mesmo sistema usado em `processConversations()`
- ✅ Liga leads a conversas automaticamente
- ✅ Suporta números com/sem código país

---

## Como Testar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
N8N_WEBHOOK_URL=...
```

### 3. Rodar em Desenvolvimento
```bash
npm run dev
```

### 4. Testar Fluxos
1. Acesse `/conversas`
2. Clique em "+ Nova Conversa"
3. Preencha formulário e envie
4. Verifique se conversa aparece na lista
5. Acesse `/leads`
6. Clique em "Iniciar" em lead sem conversa
7. Clique em "Ver Chat" em lead com conversa

---

## Possíveis Melhorias Futuras

- [ ] Validação de número brasileiro (DDD válido)
- [ ] Preview de mensagem antes de enviar
- [ ] Templates de mensagens prontas
- [ ] Histórico de mensagens enviadas
- [ ] Anexar arquivo na primeira mensagem
- [ ] Agendar mensagem para envio futuro
- [ ] Confirmação antes de criar conversa
- [ ] Busca de leads no modal
- [ ] Importação em massa de leads
- [ ] Exportação de conversas

---

## Arquitetura

```
┌─────────────────────────────────────────────┐
│           INTERFACE DO USUÁRIO              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │  Conversas   │      │     Leads       │ │
│  │              │      │                 │ │
│  │ [+ Nova]     │      │ [Iniciar] [Ver] │ │
│  └──────┬───────┘      └────────┬────────┘ │
│         │                       │          │
│         └───────┬───────────────┘          │
│                 ▼                          │
│      ┌──────────────────────┐              │
│      │ NewConversationModal │              │
│      └──────────┬───────────┘              │
└─────────────────┼──────────────────────────┘
                  ▼
         ┌────────────────┐
         │   API Routes   │
         ├────────────────┤
         │ POST /api/leads│
         │ POST /api/send │
         └────────┬───────┘
                  ▼
         ┌────────────────┐
         │   Supabase     │
         │   PostgreSQL   │
         └────────┬───────┘
                  │
         ┌────────▼───────┐
         │   n8n Webhook  │
         │   WhatsApp API │
         └────────────────┘
```

---

## Conclusão

✅ Funcionalidade **totalmente implementada** e integrada ao sistema existente.

✅ Zero breaking changes - código novo é 100% compatível.

✅ UX intuitiva - 2 pontos de entrada (sidebar + leads).

✅ Reaproveita infraestrutura - API send-message, Realtime, Polling.

✅ Pronto para produção - validações, error handling, feedback visual.

---

**Desenvolvido por:** Claude Code
**Data:** 2025-12-14
**Versão:** 1.0.0
