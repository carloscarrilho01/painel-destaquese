# ✅ Checklist de Implementação

## 📋 Use este checklist para garantir que tudo está funcionando perfeitamente

---

## Fase 1: Preparação (5 min)

### ☐ 1.1 Backup do Sistema Atual

```bash
# Criar backup do componente atual
cp src/components/realtime-conversations.tsx src/components/realtime-conversations-backup.tsx
```

**Status**: ⬜ Não feito | ✅ Concluído

---

### ☐ 1.2 Verificar Dependências

```bash
# Verificar se está na versão correta do Node
node --version  # Deve ser >= 18.0.0

# Verificar se pacotes estão instalados
npm list next react react-dom
```

**Status**: ⬜ Não feito | ✅ Concluído

---

### ☐ 1.3 Obter Credenciais da API Dinasti

- [ ] Acessar https://dinastiapi.destaquese.uk/api
- [ ] Fazer login no admin
- [ ] Copiar token de autenticação (`DINASTI_API_TOKEN`)
- [ ] Identificar nome da instância (`DINASTI_INSTANCE_NAME`)

**Token**: ________________________

**Instância**: ________________________

**Status**: ⬜ Não feito | ✅ Concluído

---

## Fase 2: Configuração (3 min)

### ☐ 2.1 Configurar Variáveis de Ambiente

Editar arquivo `.env.local`:

```env
# API Dinasti (ADICIONAR)
DINASTI_API_URL=https://dinastiapi.destaquese.uk/api
DINASTI_API_TOKEN=seu_token_aqui
DINASTI_INSTANCE_NAME=sua_instancia
```

**Verificação**:
- [ ] `DINASTI_API_URL` configurado
- [ ] `DINASTI_API_TOKEN` configurado (não vazio)
- [ ] `DINASTI_INSTANCE_NAME` configurado

**Status**: ⬜ Não feito | ✅ Concluído

---

### ☐ 2.2 Verificar Arquivos Criados

Confirme que estes arquivos existem:

- [ ] `src/lib/dinasti-client.ts`
- [ ] `src/app/api/active-conversations/route.ts`
- [ ] `src/app/api/conversation-history/route.ts`
- [ ] `src/app/api/send-message-dinasti/route.ts`
- [ ] `src/hooks/use-dinasti-polling.ts`
- [ ] `src/components/realtime-conversations-optimized.tsx`

**Status**: ⬜ Não feito | ✅ Concluído

---

## Fase 3: Ativação (2 min)

### ☐ 3.1 Ativar Componente Otimizado

```bash
# Renomear versão antiga
mv src/components/realtime-conversations.tsx src/components/realtime-conversations-old.tsx

# Ativar versão otimizada
mv src/components/realtime-conversations-optimized.tsx src/components/realtime-conversations.tsx
```

**Status**: ⬜ Não feito | ✅ Concluído

---

### ☐ 3.2 (Opcional) Usar API Dinasti para Envio

Se quiser enviar mensagens direto pela API Dinasti:

Editar `src/components/chat-view.tsx`:

```typescript
// Procurar (aproximadamente linha 150):
const response = await fetch('/api/send-message', {

// Substituir por:
const response = await fetch('/api/send-message-dinasti', {
```

**Status**: ⬜ Não aplicável | ⬜ Não feito | ✅ Concluído

---

## Fase 4: Teste (10 min)

### ☐ 4.1 Iniciar Servidor

```bash
npm run dev
```

**Verificações**:
- [ ] Servidor iniciou sem erros
- [ ] Nenhum erro de TypeScript
- [ ] Nenhum aviso de variáveis faltando

**Status**: ⬜ Não feito | ✅ Concluído

---

### ☐ 4.2 Executar Script de Teste

```bash
npx tsx scripts/test-dinasti-integration.ts
```

**Verificações**:
- [ ] ✅ Status da instância obtido
- [ ] ✅ Conversas encontradas
- [ ] ✅ Mensagens encontradas
- [ ] ✅ API /api/active-conversations funcionando

**Status**: ⬜ Não feito | ✅ Concluído

---

### ☐ 4.3 Testar Painel no Navegador

Acessar: http://localhost:3000/conversas

**Verificações visuais**:
- [ ] Conversas aparecem rapidamente (< 1s)
- [ ] Status de conexão aparece no canto superior esquerdo
- [ ] Tempo de fetch é exibido (~200-500ms)
- [ ] Badge verde de "Mensagem nova recebida!" funciona
- [ ] Conversas se atualizam a cada 5 segundos

**Status**: ⬜ Não feito | ✅ Concluído

---

### ☐ 4.4 Testar Funcionalidades

**Teste 1: Receber Mensagem**
1. Envie mensagem do WhatsApp para seu número
2. Aguarde até 5 segundos
3. Verifique se badge verde aparece
4. Verifique se conversa atualiza

**Status**: ⬜ Não feito | ✅ Concluído

---

**Teste 2: Enviar Mensagem**
1. Selecione uma conversa
2. Digite uma mensagem
3. Clique em "Enviar"
4. Verifique se mensagem aparece instantaneamente
5. Verifique se mensagem chega no WhatsApp

**Status**: ⬜ Não feito | ✅ Concluído

---

**Teste 3: Mudar de Aba (Polling Pausa)**
1. Abra DevTools → Console (F12)
2. Veja mensagens de polling: `🔄 [Dinasti Polling]`
3. Mude para outra aba (ex: Gmail)
4. Aguarde 10 segundos
5. Volte para aba do painel
6. Verifique se refresh foi feito imediatamente

**Status**: ⬜ Não feito | ✅ Concluído

---

**Teste 4: Histórico**
1. Selecione uma conversa antiga
2. Clique em "Ver mensagens antigas" (se houver)
3. Verifique se mensagens antigas carregam

**Status**: ⬜ Não aplicável | ⬜ Não feito | ✅ Concluído

---

**Teste 5: Envio de Mídia**
1. Selecione uma conversa
2. Clique no ícone de anexo
3. Selecione uma imagem
4. Envie
5. Verifique se imagem aparece no painel
6. Verifique se imagem chega no WhatsApp

**Status**: ⬜ Não feito | ✅ Concluído

---

### ☐ 4.5 Verificar Logs

**Console do Navegador (DevTools)**:
- [ ] Nenhum erro vermelho
- [ ] Logs de polling aparecem: `🔄 [Dinasti Polling]`
- [ ] Tempo de fetch é razoável (< 1s)

**Terminal do Servidor**:
- [ ] Nenhum erro fatal
- [ ] Logs de API aparecem: `✅ [Active Conversations]`
- [ ] Tempo de resposta é rápido (< 500ms)

**Status**: ⬜ Não feito | ✅ Concluído

---

## Fase 5: Performance (5 min)

### ☐ 5.1 Medir Performance

**Antes da otimização** (usando `realtime-conversations-old.tsx`):

Tempo de carregamento: _______ segundos

**Depois da otimização** (usando nova versão):

Tempo de carregamento: _______ ms

**Melhoria**: _______ x mais rápido

**Status**: ⬜ Não feito | ✅ Concluído

---

### ☐ 5.2 Verificar Tempo de Resposta das APIs

```bash
# Testar API de conversas ativas
curl -w "\nTempo: %{time_total}s\n" http://localhost:3000/api/active-conversations
```

**Tempo esperado**: < 500ms

**Tempo obtido**: _______ ms

**Status**: ⬜ Não feito | ✅ Concluído

---

### ☐ 5.3 Verificar Uso de Recursos

Abrir DevTools → Performance → Memory:

- [ ] Uso de memória estável (não aumenta constantemente)
- [ ] CPU não fica em 100% constantemente
- [ ] Nenhum memory leak detectado

**Status**: ⬜ Não feito | ✅ Concluído

---

## Fase 6: Produção (Opcional, 10 min)

### ☐ 6.1 Build de Produção

```bash
npm run build
```

**Verificações**:
- [ ] Build completa sem erros
- [ ] Nenhum warning crítico
- [ ] Tamanho do bundle aceitável

**Status**: ⬜ Não aplicável | ⬜ Não feito | ✅ Concluído

---

### ☐ 6.2 Testar Build Localmente

```bash
npm start
```

Acessar: http://localhost:3000/conversas

**Verificações**:
- [ ] Funciona igual ao modo dev
- [ ] Performance igual ou melhor
- [ ] Nenhum erro no console

**Status**: ⬜ Não aplicável | ⬜ Não feito | ✅ Concluído

---

### ☐ 6.3 Deploy em Produção

**Plataforma**: _________________ (Vercel, Netlify, etc)

**Verificações**:
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy concluído com sucesso
- [ ] Aplicação acessível publicamente
- [ ] Todas as funcionalidades testadas

**URL de Produção**: _________________

**Status**: ⬜ Não aplicável | ⬜ Não feito | ✅ Concluído

---

## Fase 7: Monitoramento (Contínuo)

### ☐ 7.1 Configurar Alertas

- [ ] Monitorar erros 500 nas APIs
- [ ] Monitorar tempo de resposta > 1s
- [ ] Monitorar taxa de erro da API Dinasti
- [ ] Configurar notificações (email, Slack, etc)

**Status**: ⬜ Não aplicável | ⬜ Não feito | ✅ Concluído

---

### ☐ 7.2 Documentar para Equipe

- [ ] Compartilhar `SETUP_RAPIDO.md` com equipe
- [ ] Explicar mudanças no fluxo
- [ ] Treinar sobre novo sistema
- [ ] Criar guia de troubleshooting

**Status**: ⬜ Não aplicável | ⬜ Não feito | ✅ Concluído

---

## Resumo Final

### Performance Alcançada

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Carregamento | ___s | ___ms | ___x |
| Atualização | ___s | ___ms | ___x |
| Carga DB | Alta | Baixa | 90% ✅ |

### Checklist Geral

- [ ] **Fase 1**: Preparação concluída
- [ ] **Fase 2**: Configuração concluída
- [ ] **Fase 3**: Ativação concluída
- [ ] **Fase 4**: Testes concluídos
- [ ] **Fase 5**: Performance verificada
- [ ] **Fase 6**: Deploy em produção (opcional)
- [ ] **Fase 7**: Monitoramento configurado

---

## 🎉 Parabéns!

Se todos os itens estão marcados, você implementou com sucesso o sistema otimizado de conversas!

**Próximos passos**:
1. Monitorar performance nos primeiros dias
2. Coletar feedback dos usuários
3. Considerar implementar WebSocket (futuro)
4. Otimizar polling interval conforme necessidade

**Dúvidas?** Consulte `FAQ.md` ou `OTIMIZACAO_CONVERSAS.md`

---

**Data da Implementação**: ___/___/___

**Implementado por**: _________________

**Notas adicionais**:

_________________________________________________

_________________________________________________

_________________________________________________
