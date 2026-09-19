'use client'

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react'

export interface AudioTrack {
  id: string
  title: string
  artist?: string | null
  streamUrl: string
  coverUrl?: string | null
}

interface AudioContextType {
  currentTrack: AudioTrack | null
  isPlaying: boolean
  isLoading: boolean
  progress: number // 0 to 1
  duration: number // seconds
  currentTime: number // seconds
  playTrack: (track: AudioTrack) => void
  pauseTrack: () => void
  togglePlay: () => void
  seek: (progress: number) => void
  closePlayer: () => void
}

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const audio = new Audio()
    audioRef.current = audio

    const handleTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setCurrentTime(audio.currentTime)
        setDuration(audio.duration)
        setProgress(audio.currentTime / audio.duration)
      }
    }

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    const handleLoadStart = () => {
      setIsLoading(true)
    }

    const handleWaiting = () => {
      setIsLoading(true)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    const handlePlaying = () => {
      setIsLoading(false)
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
      setIsLoading(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setIsLoading(false)
      setProgress(0)
      setCurrentTime(0)
    }

    const handleError = () => {
      setIsPlaying(false)
      setIsLoading(false)
      console.warn('[AudioPlayer] Media element playback error, falling back.')
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audioRef.current = null
    }
  }, [])

  const playTrack = useCallback(
    (track: AudioTrack) => {
      if (!audioRef.current) return
      if (!track.streamUrl || !track.streamUrl.trim()) {
        console.warn('[AudioPlayer] Track has no stream URL.')
        return
      }

      setIsLoading(true)

      if (currentTrack?.id === track.id) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true)
            setIsLoading(false)
          })
          .catch((err) => {
            console.warn('[AudioPlayer] Playback resume error:', err)
            setIsPlaying(false)
            setIsLoading(false)
          })
        return
      }

      setCurrentTrack(track)
      audioRef.current.src = track.streamUrl.trim()
      audioRef.current.load()
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true)
          setIsLoading(false)
        })
        .catch((err) => {
          console.warn('[AudioPlayer] Autoplay prevented or stream error:', err)
          setIsPlaying(false)
          setIsLoading(false)
        })
    },
    [currentTrack],
  )

  const pauseTrack = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
    setIsPlaying(false)
    setIsLoading(false)
  }, [])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      pauseTrack()
    } else if (currentTrack) {
      playTrack(currentTrack)
    }
  }, [isPlaying, currentTrack, pauseTrack, playTrack])

  const seek = useCallback((targetProgress: number) => {
    if (!audioRef.current || !audioRef.current.duration) return
    const newTime = targetProgress * audioRef.current.duration
    audioRef.current.currentTime = newTime
    setProgress(targetProgress)
    setCurrentTime(newTime)
  }, [])

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute('src')
      audioRef.current.load()
    }
    setCurrentTrack(null)
    setIsPlaying(false)
    setIsLoading(false)
    setProgress(0)
    setCurrentTime(0)
  }, [])

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        progress,
        duration,
        currentTime,
        playTrack,
        pauseTrack,
        togglePlay,
        seek,
        closePlayer,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  return context
}
