/**
 * Utilitários para limpeza e processamento de mensagens
 *
 * Centraliza a lógica de limpeza de tool calls e mensagens técnicas
 * para evitar duplicação entre componentes e rotas de API.
 */

/**
 * Limpa mensagens que contêm tool calls e extrai apenas o conteúdo real
 *
 * Exemplo:
 * Input: "[Used tools: Tool: atualiza_nome, Input: {}, Result: seminovo ou quer fazer avaliação do seu veículo?"
 * Output: "seminovo ou quer fazer avaliação do seu veículo?"
 *
 * @param content - Conteúdo da mensagem possivelmente com tool calls
 * @returns Conteúdo limpo sem informações técnicas
 */
export function cleanToolMessage(content: string): string {
  if (!content) return ''

  // Se não é uma mensagem de tool, retorna como está
  if (!content.startsWith('[Used tools:') && !content.startsWith('Used tools:')) {
    return content
  }

  // Remove o prefixo de tool call e extrai apenas o conteúdo real
  // Padrão: [Used tools: ... Resul_ ou Result: seguido do conteúdo real
  // Usa [\s\S] em vez de flag 's' para compatibilidade ES2018+
  const toolPattern = /\[?Used tools:[\s\S]*?(?:Resul[t_]|Result:)\s*/i
  let cleaned = content.replace(toolPattern, '').trim()

  // Remove dados de lead no formato : [[{"id":"...","telefone":"..."}]]
  // Pode estar com ou sem espaço antes dos dois pontos
  if (cleaned.startsWith(':')) {
    // Remove o ":" inicial e espaços
    cleaned = cleaned.substring(1).trim()

    // Se começa com [[{, remove até o final do array ]]
    if (cleaned.startsWith('[[{')) {
      const endIndex = cleaned.indexOf(']]')
      if (endIndex !== -1) {
        cleaned = cleaned.substring(endIndex + 2).trim()
      }
    }
  }

  // Remove dados técnicos de fotos (DISCOVERY, CIVIC, etc)
  // Padrão: [{"row_number":1,"Carros disponiveis":"","Fotos bmw":"https://..."...}]
  if (cleaned.startsWith('[{"row_number"')) {
    // Remove o array JSON completo e pega o que vem depois
    const endIndex = cleaned.lastIndexOf(']')
    if (endIndex !== -1) {
      cleaned = cleaned.substring(endIndex + 1).trim()
    }
  }

  // Remove objetos JSON que começam com {"row_number"
  if (cleaned.startsWith('{"row_number"')) {
    // Tenta encontrar o fim do objeto JSON
    let depth = 0
    let endIndex = -1
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === '{') depth++
      if (cleaned[i] === '}') {
        depth--
        if (depth === 0) {
          endIndex = i
          break
        }
      }
    }
    if (endIndex !== -1) {
      cleaned = cleaned.substring(endIndex + 1).trim()
    }
  }

  // Se após limpar não sobrou nada, significa que era apenas tool call sem conteúdo
  return cleaned || ''
}

/**
 * Verifica se uma mensagem é apenas um tool call sem conteúdo real
 *
 * @param content - Conteúdo da mensagem
 * @returns true se é apenas tool call, false se tem conteúdo real
 */
export function isToolMessage(content: string): boolean {
  // Verifica se é uma mensagem que APENAS contém tool call (sem conteúdo real)
  const cleaned = cleanToolMessage(content)
  return cleaned === ''
}
