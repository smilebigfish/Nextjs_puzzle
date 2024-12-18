import { useCallback, useEffect, useRef } from 'react'

export const useSound = (soundUrl: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio(soundUrl)
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [soundUrl])

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(error => {
        console.error('播放音效失敗:', error)
      })
    }
  }, [])

  return play
}

