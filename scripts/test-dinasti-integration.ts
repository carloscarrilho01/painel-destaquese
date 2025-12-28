/**
 * Script de Teste: Integração com API Dinasti
 *
 * Este script testa a conexão e funcionalidades da API Dinasti.
 *
 * Uso:
 *   npx tsx scripts/test-dinasti-integration.ts
 */

import { dinastiClient } from '../src/lib/dinasti-client'

async function testDinastiIntegration() {
  console.log('🧪 Testando Integração com API Dinasti\n')
  console.log('=' .repeat(60))

  // 1. Testar status da instância
  console.log('\n1️⃣ Testando status da instância...')
  try {
    const status = await dinastiClient.getInstanceStatus()
    console.log('✅ Status:', JSON.stringify(status, null, 2))
  } catch (error) {
    console.error('❌ Erro ao obter status:', error)
    console.error('\n⚠️ Verifique se as variáveis de ambiente estão configuradas:')
    console.error('   - DINASTI_API_URL')
    console.error('   - DINASTI_API_TOKEN')
    console.error('   - DINASTI_INSTANCE_NAME')
    process.exit(1)
  }

  // 2. Testar busca de conversas
  console.log('\n2️⃣ Testando busca de conversas...')
  try {
    const startTime = Date.now()
    const chats = await dinastiClient.findChats()
    const fetchTime = Date.now() - startTime

    console.log(`✅ ${chats.length} conversas encontradas em ${fetchTime}ms`)

    if (chats.length > 0) {
      const firstChat = chats[0]
      console.log('\n   Exemplo de conversa:')
      console.log(`   - ID: ${firstChat.id}`)
      console.log(`   - Nome: ${firstChat.name || 'Sem nome'}`)
      console.log(`   - Mensagens: ${firstChat.messages?.length || 0}`)
    }
  } catch (error) {
    console.error('❌ Erro ao buscar conversas:', error)
  }

  // 3. Testar busca de mensagens (se houver conversas)
  console.log('\n3️⃣ Testando busca de mensagens...')
  try {
    const chats = await dinastiClient.findChats()

    if (chats.length > 0) {
      const firstChatId = chats[0].id
      const phone = firstChatId.replace('@s.whatsapp.net', '').replace('@c.us', '')

      const messages = await dinastiClient.findMessages(phone, 10)
      console.log(`✅ ${messages.length} mensagens encontradas para ${phone}`)

      if (messages.length > 0) {
        console.log('\n   Última mensagem:')
        const lastMsg = messages[messages.length - 1]
        console.log(`   - ID: ${lastMsg.key.id}`)
        console.log(`   - De mim: ${lastMsg.key.fromMe}`)
        console.log(`   - Conteúdo: ${JSON.stringify(lastMsg.message).substring(0, 100)}...`)
      }
    } else {
      console.log('⚠️ Nenhuma conversa ativa para testar')
    }
  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error)
  }

  // 4. Testar API de conversas ativas (se servidor estiver rodando)
  console.log('\n4️⃣ Testando API /api/active-conversations...')
  try {
    const response = await fetch('http://localhost:3000/api/active-conversations')

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ API retornou ${data.count} conversas`)
      console.log(`   - Tempo de fetch: ${data.totalTime}ms`)
      console.log(`   - Fonte: ${data.source}`)
    } else {
      console.log('⚠️ Servidor não está rodando ou API retornou erro')
      console.log(`   Status: ${response.status}`)
    }
  } catch (error) {
    console.log('⚠️ Servidor não está rodando em http://localhost:3000')
    console.log('   Execute: npm run dev')
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Testes concluídos!\n')
}

// Executar testes
testDinastiIntegration().catch((error) => {
  console.error('\n❌ Erro fatal:', error)
  process.exit(1)
})
