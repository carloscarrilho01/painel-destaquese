# 🐛 Debug - Problemas de Login

## ❌ Problema: "Clico em Entrar mas nada acontece"

### **Passo 1: Abrir Console do Navegador**

1. Pressione **F12** (ou Ctrl+Shift+I)
2. Vá na aba **Console**
3. Tente fazer login novamente
4. Veja as mensagens que aparecem

### **Passo 2: Verificar Mensagens**

Procure por estas mensagens (com emojis):

```
🔐 Tentando fazer login...
📧 Email: seu@email.com
📊 Resposta do Supabase: {...}
```

### **Cenários Possíveis:**

#### **Cenário A: Email ou senha incorretos**
```
❌ Erro de autenticação: Invalid login credentials
```

**Solução:**
1. Vá no Supabase Dashboard
2. Authentication > Users
3. Verifique se o usuário existe
4. Confirme o email correto
5. Tente resetar a senha

#### **Cenário B: Email não confirmado**
```
❌ Erro de autenticação: Email not confirmed
```

**Solução:**
1. Vá no Supabase Dashboard
2. Authentication > Users
3. Encontre o usuário
4. Clique nos 3 pontinhos (...)
5. Clique em **Confirm email**

#### **Cenário C: Erro de conexão**
```
💥 Erro ao fazer login: Network Error
```

**Solução:**
1. Verifique sua conexão com internet
2. Verifique se o Supabase está online
3. Veja se NEXT_PUBLIC_SUPABASE_URL está correto

#### **Cenário D: Login bem-sucedido mas não redireciona**
```
✅ Login bem-sucedido!
👤 Usuário: seu@email.com
🔑 Session: Token criado
🔄 Redirecionando para dashboard...
```

**Solução:**
- Aguarde alguns segundos
- Se não redirecionar, tente acessar manualmente: `/`
- Limpe cache e cookies
- Tente em aba anônima

---

## 🔍 Verificar Configuração do Supabase

### **1. Verificar Variáveis de Ambiente**

Veja se estão configuradas:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

### **2. Testar Conexão com Supabase**

Abra o console (F12) e teste:

```javascript
const { data, error } = await supabase.auth.getSession()
console.log('Session:', data)
console.log('Error:', error)
```

Se retornar `null` → Supabase configurado corretamente
Se retornar erro → Problema de configuração

### **3. Verificar se Usuário Existe**

SQL para verificar:
```sql
SELECT email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'seu@email.com';
```

Deve retornar:
- email: seu@email.com
- email_confirmed_at: (data) ← **IMPORTANTE: Não pode ser NULL**
- created_at: (data)

---

## 🔧 Soluções Rápidas

### **Solução 1: Criar Usuário Manualmente**

```sql
-- Criar usuário com email confirmado
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
  NOW(),  -- ← Confirma email automaticamente
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  ''
);
```

### **Solução 2: Resetar Senha**

1. Authentication > Users
2. Clique no usuário
3. Clique em "Send password reset"
4. Ou use SQL:

```sql
-- Atualizar senha diretamente
UPDATE auth.users
SET encrypted_password = crypt('nova-senha', gen_salt('bf'))
WHERE email = 'seu@email.com';
```

### **Solução 3: Confirmar Email via SQL**

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'seu@email.com';
```

---

## 📱 Testar em Diferentes Navegadores

1. **Chrome** (recomendado)
2. **Firefox**
3. **Edge**
4. **Aba anônima** (para descartar cache)

---

## 🆘 Ainda Não Funciona?

### **Checklist Final:**

- [ ] Variáveis de ambiente estão corretas
- [ ] Usuário existe no Supabase
- [ ] Email está confirmado (email_confirmed_at não é NULL)
- [ ] Senha está correta
- [ ] Console não mostra erros em vermelho
- [ ] Supabase está online
- [ ] Deploy da Vercel terminou
- [ ] Cache foi limpo (Ctrl+Shift+R)

### **Última Tentativa:**

1. Delete o usuário existente
2. Crie novamente via Dashboard
3. ✅ **MARQUE "Auto Confirm User"**
4. Tente fazer login

---

## 📞 Informações Úteis

### **Ver Todos os Usuários:**
```sql
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
ORDER BY created_at DESC;
```

### **Ver Sessões Ativas:**
```sql
SELECT user_id, created_at, ip, user_agent
FROM auth.sessions
ORDER BY created_at DESC
LIMIT 10;
```

### **Ver Logs de Autenticação:**
Supabase Dashboard > Authentication > Logs

---

**Me envie os logs do console que vou te ajudar! 🚀**
