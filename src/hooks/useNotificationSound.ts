import { useEffect, useRef, useState, useCallback } from 'react'

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [isEnabled, setIsEnabled] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    // Carregar preferência do localStorage
    const saved = localStorage.getItem('notification_sound_enabled')
    if (saved !== null) {
      setIsEnabled(saved === 'true')
    }

    // Inicializar AudioContext
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContextClass()
      console.log('🎵 AudioContext inicializado')
    } catch (error) {
      console.error('❌ Erro ao criar AudioContext:', error)
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const playSound = useCallback(() => {
    if (!isEnabled) {
      console.log('🔇 Som desativado pelo usuário')
      return
    }

    if (!audioContextRef.current) {
      console.error('❌ AudioContext não inicializado')
      return
    }

    try {
      const audioContext = audioContextRef.current

      // Retomar contexto se suspenso
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }

      // Criar oscilador (gera o som)
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Conectar: Oscilador -> Gain -> Saída
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Configurar tom (frequência)
      oscillator.frequency.value = 800 // Hz (tom médio-alto)
      oscillator.type = 'sine' // Onda senoidal (som suave)

      // Configurar volume com fade
      const now = audioContext.currentTime
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01) // Fade in
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1)  // Sustain
      gainNode.gain.linearRampToValueAtTime(0, now + 0.2)    // Fade out

      // Tocar som
      oscillator.start(now)
      oscillator.stop(now + 0.2) // Duração: 200ms

      setIsPlaying(true)
      console.log('🔔 Som tocado!')

      // Reset flag após som terminar
      setTimeout(() => {
        setIsPlaying(false)
      }, 250)

      // Limpar oscilador após uso
      oscillator.onended = () => {
        oscillator.disconnect()
        gainNode.disconnect()
      }

    } catch (error) {
      console.error('❌ Erro ao tocar som:', error)
    }
  }, [isEnabled])

  const toggleSound = () => {
    const newState = !isEnabled
    setIsEnabled(newState)
    localStorage.setItem('notification_sound_enabled', String(newState))

    // Tocar som de teste ao ativar
    if (newState) {
      setTimeout(() => playSound(), 100)
    }

    console.log(newState ? '🔊 Som ativado' : '🔇 Som desativado')
  }

  return {
    playSound,
    isEnabled,
    toggleSound,
    isPlaying
  }
}
