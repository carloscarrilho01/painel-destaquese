# 🔐 Sistema de Autenticação - Guia Completo

## 📋 O que foi implementado

Sistema completo de autenticação com Supabase Auth, incluindo:
- ✅ Página de login moderna e responsiva
- ✅ Middleware para proteger rotas privadas
- ✅ Botão de logout na sidebar
- ✅ Redirecionamento automático
- ✅ Validação de sessão
- ✅ Mensagens de erro amigáveis

---

## 🚀 Configuração no Supabase

### **Passo 1: Ativar Authentication**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** (menu lateral)
4. A autenticação já vem ativada por padrão

### **Passo 2: Criar Primeiro Usuário**

#### **Opção A: Via Dashboard (Recomendado)**

1. Vá em **Authentication > Users**
2. Clique em **Add user** (botão verde)
3. Selecione **Create new user**
4. Preencha:
   - **Email:** seu@email.com
   - **Password:** sua-senha-segura
   - ✅ **Auto Confirm User** (marcar esta opção!)
5. Clique em **Create user**

#### **Opção B: Via SQL**

```sql
-- Criar usuário e confirmar email automaticamente
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@painel.com',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  ''
);
```

**Credenciais de exemplo:**
- Email: `admin@painel.com`
- Senha: `senha123`

**⚠️ IMPORTANTE:** Troque a senha após o primeiro login!

---

## 🎯 Como Usar

### **1. Fazer Login**

1. Acesse: `https://seu-dominio.vercel.app/login`
2. Digite email e senha
3. Clique em **Entrar**
4. Será redirecionado para o Dashboard

### **2. Fazer Logout**

1. Clique no botão **Sair** (vermelho) na sidebar
2. Será redirecionado para a página de login

### **3. Sessão Automática**

- Se já estiver logado, não precisa fazer login novamente
- A sessão permanece ativa mesmo fechando o navegador
- Para sair, use o botão de logout

---

## 🔒 Proteção de Rotas

### **Rotas Protegidas (Requerem Login):**
- `/` - Dashboard
- `/conversas` - Conversas
- `/crm` - CRM Kanban
- `/leads` - Gerenciamento de Leads
- `/configuracoes` - Configurações

### **Rotas Públicas (Não Requerem Login):**
- `/login` - Página de login

### **Como Funciona:**

```
┌─────────────────────────────────────┐
│ Usuário tenta acessar /conversas    │
└────────────┬────────────────────────┘
             │
             ▼
      ┌──────────────┐
      │ Middleware   │
      └──────┬───────┘
             │
      ┌──────┴────────┐
      │               │
  Autenticado?    Não autenticado
      │               │
      ▼               ▼
   Permite      Redireciona
   Acesso       para /login
```

---

## 📁 Arquivos Criados

```
src/
├── app/
│   └── login/
│       └── page.tsx              # Página de login
│
├── middleware.ts                  # Proteção de rotas
│
└── components/
    └── sidebar.tsx                # Atualizado com botão logout
```

---

## 🎨 Design da Página de Login

### **Elementos:**
- 🔒 **Ícone de cadeado** centralizado
- 📧 **Campo de email** com ícone
- 🔑 **Campo de senha** com botão mostrar/ocultar
- ✅ **Botão de login** com loading state
- ❌ **Mensagens de erro** com ícone de alerta
- 🔗 **Link "Esqueceu sua senha?"** (funcional se ativar no Supabase)

### **Cores:**
- Fundo: `var(--background)`
- Card: `var(--card)` com borda
- Primary: `var(--primary)` (verde WhatsApp)
- Erro: vermelho com fundo semi-transparente

---

## 🔧 Configurações Opcionais

### **1. Ativar "Esqueceu a Senha"**

No Supabase Dashboard:
1. **Authentication > Email Templates**
2. **Reset Password** template
3. Configure o template de email
4. Ative a funcionalidade

### **2. Adicionar Mais Usuários**

Repita o **Passo 2** da configuração para cada usuário.

### **3. Roles e Permissões (Avançado)**

```sql
-- Adicionar role customizada
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@painel.com';
```

---

## 🐛 Troubleshooting

### **Problema: "Email ou senha incorretos"**

**Soluções:**
1. Verifique se o email está correto
2. Verifique se a senha está correta
3. Confirme que o usuário foi criado no Supabase
4. Vá em **Authentication > Users** e veja se o usuário aparece

### **Problema: "Email não confirmado"**

**Solução:**
1. Vá em **Authentication > Users**
2. Encontre o usuário
3. Clique nos 3 pontinhos
4. Clique em **Confirm email**

### **Problema: Não redireciona após login**

**Soluções:**
1. Abra o console do navegador (F12)
2. Veja se há erros em vermelho
3. Verifique se o Supabase está configurado corretamente
4. Teste com: `supabase.auth.getSession()` no console

### **Problema: Middleware não funciona**

**Soluções:**
1. Verifique se o arquivo `middleware.ts` está na raiz de `src/`
2. Limpe o cache: `npm run build`
3. Reinicie o servidor: `npm run dev`

---

## 📊 Mensagens de Erro

| Erro | Significado | Solução |
|------|-------------|---------|
| "Email ou senha incorretos" | Credenciais inválidas | Verifique email e senha |
| "Email não confirmado" | Email não verificado | Confirme email no Supabase |
| "Erro ao conectar com o servidor" | Problema de rede/API | Verifique conexão e Supabase |

---

## 🔐 Segurança

### **Boas Práticas Implementadas:**

✅ **Senhas criptografadas** - Supabase usa bcrypt
✅ **Tokens seguros** - JWT com assinatura
✅ **HTTPS obrigatório** - Em produção
✅ **Session management** - Cookies httpOnly
✅ **Proteção CSRF** - Tokens de sessão

### **Recomendações:**

1. **Use senhas fortes:**
   - Mínimo 8 caracteres
   - Letras maiúsculas e minúsculas
   - Números e símbolos

2. **Troque senhas padrão:**
   - Nunca use `senha123` em produção
   - Crie senhas únicas para cada usuário

3. **Monitore acessos:**
   - Veja logs em **Authentication > Logs**
   - Identifique tentativas suspeitas

---

## 🎓 Exemplos de Uso

### **Verificar se Usuário Está Logado (Cliente)**

```typescript
import { supabase } from '@/lib/supabase'

const { data: { session } } = await supabase.auth.getSession()

if (session) {
  console.log('Usuário logado:', session.user.email)
} else {
  console.log('Usuário não logado')
}
```

### **Pegar Informações do Usuário**

```typescript
const { data: { user } } = await supabase.auth.getUser()

console.log('Email:', user?.email)
console.log('ID:', user?.id)
console.log('Criado em:', user?.created_at)
```

### **Fazer Logout Programaticamente**

```typescript
await supabase.auth.signOut()
router.push('/login')
```

---

## ✅ Checklist de Configuração

- [ ] Supabase Auth está ativado
- [ ] Criou primeiro usuário administrador
- [ ] Marcou "Auto Confirm User" ao criar
- [ ] Testou fazer login
- [ ] Conseguiu acessar o dashboard
- [ ] Testou fazer logout
- [ ] Testou tentar acessar rota privada sem login
- [ ] Middleware está redirecionando corretamente
- [ ] Trocou senha padrão (se usou exemplo)

---

## 🚀 Deploy

### **Variáveis de Ambiente Necessárias:**

Já configuradas (não precisa fazer nada):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **Após Deploy na Vercel:**

1. Acesse: `https://seu-dominio.vercel.app/login`
2. Faça login com credenciais criadas
3. ✅ Pronto!

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do navegador (F12 > Console)
2. Verifique os logs do Supabase (Dashboard > Logs)
3. Revise este guia passo a passo

---

**Sistema de autenticação configurado e funcionando! 🎉**
