# Configuração do Supabase Realtime

Este guia explica como ativar e configurar o Supabase Realtime para atualização automática de conversas.

## 🎯 O que é Realtime?

O Supabase Realtime permite que o painel receba atualizações instantâneas quando:
- Uma nova mensagem é adicionada ao banco
- Uma mensagem é atualizada
- Uma mensagem é deletada

**Sem precisar recarregar a página ou clicar no chat!**

---

## ⚙️ Ativar Realtime no Supabase

### 1. Acessar o Painel do Supabase

1. Acesse https://supabase.com
2. Selecione seu projeto
3. Vá em **Database** (ícone de cilindro na barra lateral)

### 2. Ativar Realtime na Tabela `chats`

1. Clique em **Replication** (no menu lateral de Database)
2. Procure pela tabela **`chats`**
3. Ative o toggle **Enable Realtime** para a tabela `chats`
4. Confirme a ativação

**Imagem de referência:**
```
Tables
  ├─ chats          [●] Enable Realtime  ← ATIVAR AQUI
  └─ leads          [ ] Enable Realtime
```

### 3. (Opcional) Ativar Realtime para `leads`

Se quiser atualizar automaticamente quando o nome de um lead mudar:

1. Ative também o toggle para a tabela **`leads`**

---

## 🔍 Verificar se está Funcionando

### 1. Abrir o Painel em Produção

Acesse seu painel na Vercel (ex: `https://painel-destaquese.vercel.app/conversas`)

### 2. Abrir Console do Navegador

Pressione `F12` e vá na aba **Console**

### 3. Enviar uma Mensagem de Teste

Use outro dispositivo ou o próprio banco de dados para inserir uma nova mensagem na tabela `chats`.

### 4. Verificar Logs

Você deve ver no console:
```
Nova mensagem recebida: {eventType: 'INSERT', new: {...}, ...}
```

E na tela deve aparecer:
- 🟢 Banner verde "Mensagem nova recebida" (por 2 segundos)
- A mensagem aparece automaticamente na conversa
- Scroll automático para a nova mensagem

---

## 🎨 Recursos Implementados

### 1. **Atualização Automática**
- Subscrição via Supabase Realtime
- Detecta INSERT, UPDATE e DELETE na tabela `chats`
- Recarrega conversas automaticamente

### 2. **Indicador Visual**
- Banner verde aparece quando nova mensagem chega
- Ícone pulsante para chamar atenção
- Desaparece automaticamente após 2 segundos

### 3. **Auto-scroll**
- Quando nova mensagem chega, o chat rola automaticamente para o final
- Scroll suave (smooth scroll)
- Mantém contexto se usuário estiver lendo mensagens antigas

---

## 🔧 Como Funciona Tecnicamente

### Arquivo: `src/components/realtime-conversations.tsx`

```typescript
// Subscrever a mudanças na tabela chats
const channel = supabase
  .channel('chats-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'chats'
    },
    (payload) => {
      console.log('Nova mensagem recebida:', payload)
      fetchData() // Recarregar conversas
    }
  )
  .subscribe()
```

### Arquivo: `src/components/chat-view.tsx`

```typescript
// Auto-scroll quando número de mensagens mudar
useEffect(() => {
  if (conversation && messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }
}, [conversation?.messages.length])
```

---

## 🚨 Troubleshooting

### Realtime não está funcionando

**Problema**: Mensagens novas não aparecem automaticamente

**Soluções**:
1. Verificar se Realtime está ativado no Supabase (passo 2 acima)
2. Verificar se há erros no console do navegador (F12)
3. Verificar se a chave `NEXT_PUBLIC_SUPABASE_ANON_KEY` está correta
4. Verificar se há políticas RLS (Row Level Security) bloqueando

### Erro: "Realtime connection failed"

**Causa**: Chave do Supabase incorreta ou política RLS muito restritiva

**Solução**:
1. Vá em Supabase > Authentication > Policies
2. Certifique-se de que há uma política permitindo SELECT na tabela `chats`
3. Exemplo de política:
   ```sql
   CREATE POLICY "Enable read access for all users" ON "public"."chats"
   FOR SELECT
   USING (true);
   ```

### Banner de "Mensagem nova" não aparece

**Causa**: CSS pode estar sendo sobrescrito

**Solução**: Verificar se o elemento está renderizando:
```javascript
// No console do navegador
document.querySelector('.absolute.top-4.right-4')
```

---

## 📊 Limites e Custos

### Plano Free do Supabase:
- ✅ **2 conexões simultâneas** de Realtime
- ✅ **500.000 mensagens/mês**
- ✅ **Grátis para sempre**

Para a maioria dos painéis de atendimento, isso é mais que suficiente!

### Plano Pro ($25/mês):
- ✅ **500 conexões simultâneas**
- ✅ **5 milhões de mensagens/mês**

---

## 🎯 Próximas Melhorias (Opcional)

### 1. Notificação de Áudio
Tocar um som quando nova mensagem chegar:

```typescript
const audio = new Audio('/notification.mp3')
audio.play()
```

### 2. Notificação de Desktop
Pedir permissão para notificações nativas:

```typescript
if (Notification.permission === 'granted') {
  new Notification('Nova mensagem', {
    body: 'Você recebeu uma nova mensagem no chat'
  })
}
```

### 3. Badge de Contador
Mostrar quantas mensagens não lidas:

```typescript
<span className="bg-red-500 rounded-full px-2 text-xs">
  {unreadCount}
</span>
```

---

## ✅ Checklist de Configuração

- [ ] Realtime ativado na tabela `chats` no Supabase
- [ ] Deploy do código com componente `RealtimeConversations`
- [ ] Testar envio de mensagem e ver atualização automática
- [ ] Verificar banner verde de "Mensagem nova recebida"
- [ ] Verificar auto-scroll funcionando
- [ ] Verificar logs no console (F12)

---

**🎉 Pronto! Agora seu painel atualiza automaticamente sem precisar recarregar a página!**
