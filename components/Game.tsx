'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TouchBackend } from 'react-dnd-touch-backend'
import { isMobile } from 'react-device-detect'
import PuzzlePiece from './PuzzlePiece'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { cutImageIntoPieces } from '../utils/imageUtils'
import { useSound } from '../hooks/useSound'
import { useRouter } from 'next/navigation'
import { Volume2, VolumeX } from "lucide-react"

interface GameProps {
  difficulty: number
  imageUrl: string
}

interface PiecePosition {
  x: number
  y: number
  rotation: number
}

interface GamePiece {
  id: number
  currentPosition: number | null
  image: string
}

export default function Game({ difficulty, imageUrl }: GameProps) {
  const router = useRouter()
  const targetAreaRef = useRef<HTMLDivElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [pieces, setPieces] = useState<GamePiece[]>([])
  const [completed, setCompleted] = useState(false)
  const [piecePositions, setPiecePositions] = useState<PiecePosition[]>([])
  const [time, setTime] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const playDropSound = useSound('/sounds/drop.mp3')
  const playCompleteSound = useSound('/sounds/complete.mp3')

  // 從 localStorage 讀取音效設定
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('gameSettings')
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        setSoundEnabled(parsedSettings?.soundEnabled ?? true)
      }
    } catch {
      // 忽略 localStorage 錯誤
    }
  }, [])

  // 當音效設定改變時，立即更新 localStorage
  const handleSoundToggle = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev
      try {
        localStorage.setItem('gameSettings', JSON.stringify({ soundEnabled: newValue }))
      } catch {
        // 忽略 localStorage 錯誤
      }
      return newValue
    })
  }, [])

  // 計時器
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isActive) {
      interval = setInterval(() => {
        setTime(t => t + 1)
      }, 1000)
    } else if (!isActive && interval) {
      clearInterval(interval)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive])

  // 生成隨機位置
  const generateRandomPositions = useCallback((count: number): PiecePosition[] => {
    return Array(count).fill(null).map(() => ({
      x: Math.random() * 80 - 40, // -40% to +40% from center
      y: Math.random() * 80 - 40, // -40% to +40% from center
      rotation: Math.random() * 40 - 20 // -20deg to +20deg
    }))
  }, [])

  // 載入遊戲
  const loadGame = useCallback(async (imgUrl: string) => {
    try {
      setError(null)
      setImage(imgUrl)
      const rows = Math.sqrt(difficulty)
      const cutPieces = await cutImageIntoPieces(imgUrl, rows, rows)
      
      // 生成遊戲片段
      const gamePieces = cutPieces.map((image, index) => ({
        id: index,
        currentPosition: null,
        image
      }))
      
      setPieces(gamePieces)
      setPiecePositions(generateRandomPositions(difficulty))
      setCompleted(false)
      setTime(0)
      setIsActive(true)
    } catch (err) {
      console.error('Error loading game:', err)
      setError('載入遊戲失敗，請重試。')
      setIsActive(false)
    }
  }, [difficulty, generateRandomPositions])

  // 載入圖片
  useEffect(() => {
    loadGame(imageUrl)
  }, [imageUrl, loadGame])

  // 找尋最近的目標位置
  const findClosestTargetPosition = useCallback((x: number, y: number): number | null => {
    if (!targetAreaRef.current) return null

    const targetArea = targetAreaRef.current
    const rect = targetArea.getBoundingClientRect()
    
    // 檢查是否在目標區域內
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      return null
    }

    const rows = Math.sqrt(difficulty)
    const cellWidth = rect.width / rows
    const cellHeight = rect.height / rows

    // 計算最近的格子
    const col = Math.floor((x - rect.left) / cellWidth)
    const row = Math.floor((y - rect.top) / cellHeight)
    
    // 確保在有效範圍內
    if (row >= 0 && row < rows && col >= 0 && col < rows) {
      return row * rows + col
    }

    return null
  }, [difficulty])

  // 檢查是否完成拼圖
  const checkCompletion = useCallback((currentPieces: GamePiece[]) => {
    const isCompleted = currentPieces.every(piece => piece.currentPosition === piece.id)
    if (isCompleted) {
      setCompleted(true)
      setIsActive(false)
      if (soundEnabled) {
        playCompleteSound()
      }
    }
  }, [playCompleteSound, soundEnabled])

  // 處理片段放置
  const handlePieceDrop = useCallback((pieceId: number, x?: number, y?: number, targetPosition?: number | null) => {
    let finalTargetPosition = targetPosition ?? null

    if (x !== undefined && y !== undefined) {
      finalTargetPosition = findClosestTargetPosition(x, y)
    }

    setPieces(prevPieces => {
      const newPieces = [...prevPieces]
      
      // 如果有目標位置，檢查是否已有片段在該位置
      if (finalTargetPosition !== null) {
        const pieceAtTarget = newPieces.find(p => p.currentPosition === finalTargetPosition)
        if (pieceAtTarget) {
          pieceAtTarget.currentPosition = null
        }
      }
      
      // 設置當前片段的位置
      const piece = newPieces.find(p => p.id === pieceId)
      if (piece) {
        piece.currentPosition = finalTargetPosition
      }
      
      // 檢查是否完成拼圖
      checkCompletion(newPieces)
      return newPieces
    })

    if (soundEnabled) {
      playDropSound()
    }
  }, [findClosestTargetPosition, checkCompletion, playDropSound, soundEnabled])

  // 重新開始遊戲
  const handleRestart = useCallback(() => {
    setPieces(prevPieces => prevPieces.map(piece => ({ ...piece, currentPosition: null })))
    setPiecePositions(generateRandomPositions(difficulty))
    setCompleted(false)
    setTime(0)
    setIsActive(true)
  }, [difficulty, generateRandomPositions])

  // 返回設定頁面
  const handleBack = useCallback(() => {
    router.push('/')
  }, [router])

  // 格式化時間
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  // 選擇後端
  const Backend = isMobile ? TouchBackend : HTML5Backend

  // 顯示錯誤
  if (error) {
    return (
      <div className="flex flex-col items-center space-y-3 p-4">
        <div className="text-red-500 text-sm">{error}</div>
        <Button size="sm" onClick={handleRestart}>重新開始</Button>
      </div>
    )
  }

  return (
    <DndProvider backend={Backend}>
      <div className="flex flex-col h-full w-full max-w-6xl mx-auto py-1">
        <div className="flex items-center justify-between w-full mb-1">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleBack} size="sm" className="h-8 px-3 py-1 text-xs">
              返回設定
            </Button>
            <div 
              className="cursor-pointer p-1 hover:bg-gray-100 rounded-full transition-colors"
              onClick={handleSoundToggle}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-green-500" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
          <div className="text-sm font-medium">時間: {formatTime(time)}</div>
        </div>
        
        <div className="flex flex-col lg:flex-row w-full gap-3 flex-1 overflow-hidden">
          <div className="flex flex-col w-full lg:w-1/3 gap-3 h-full">
            {/* 預覽圖 */}
            <div className="w-full h-2/5">
              <h2 className="text-sm font-semibold mb-1">預覽圖</h2>
              {image && (
                <div className="relative h-[calc(100%-1.5rem)] w-full overflow-hidden rounded-md shadow-md">
                  <Image
                    src={image}
                    alt="完整圖片"
                    className="object-cover opacity-50"
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
              )}
            </div>

            {/* 拼圖區域 */}
            <div className="w-full h-3/5">
              <h2 className="text-sm font-semibold mb-1">拼圖片段</h2>
              <div className="relative h-[calc(100%-1.5rem)] w-full bg-gray-50 rounded-md overflow-hidden border border-dashed border-gray-200 shadow-sm">
                <div className="absolute inset-0">
                  {pieces.map((piece, index) => (
                    piece.currentPosition === null && (
                      <div
                        key={`piece-${piece.id}`}
                        style={{
                          position: 'absolute',
                          left: `${50 + piecePositions[index].x}%`,
                          top: `${50 + piecePositions[index].y}%`,
                          transform: `translate(-50%, -50%) rotate(${piecePositions[index].rotation}deg)`,
                          width: `${85 / Math.sqrt(difficulty)}%`,
                          height: `${85 / Math.sqrt(difficulty)}%`,
                          zIndex: 1,
                        }}
                      >
                        <PuzzlePiece
                          key={piece.id}
                          index={piece.id}
                          image={piece.image}
                          onDrop={handlePieceDrop}
                        />
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 目標區域 */}
          <div className="w-full lg:w-2/3 h-full">
            <h2 className="text-sm font-semibold mb-1">目標區域</h2>
            <div 
              ref={targetAreaRef}
              className="relative h-[calc(100%-1.5rem)] w-full bg-white rounded-md shadow-md border border-gray-200"
            >
              <div 
                className="absolute top-0 left-0 w-full h-full grid" 
                style={{
                  gridTemplateColumns: `repeat(${Math.sqrt(difficulty)}, 1fr)`,
                  gap: '1px',
                }}
              >
                {Array(difficulty).fill(null).map((_, index) => {
                  const piece = pieces.find(p => p.currentPosition === index)
                  return (
                    <div
                      key={`target-${index}`}
                      className="relative border border-dashed border-gray-200 bg-gray-50/30"
                      style={{ aspectRatio: '1/1' }}
                      onClick={() => piece && handlePieceDrop(piece.id)}
                    >
                      {piece && (
                        <div className="absolute inset-0">
                          <PuzzlePiece
                            index={piece.id}
                            image={piece.image}
                            isInTarget={true}
                            onDrop={(fromIndex, x, y) => handlePieceDrop(fromIndex, x, y, index)}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        
        {completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-sm font-bold text-green-500 mt-1 text-center"
          >
            恭喜你完成拼圖！用時：{formatTime(time)}
          </motion.div>
        )}
        <div className="flex justify-center mt-1">
          <Button size="sm" onClick={handleRestart} className="h-7 px-4 py-0 text-xs">重新開始</Button>
        </div>
      </div>
    </DndProvider>
  )
}

