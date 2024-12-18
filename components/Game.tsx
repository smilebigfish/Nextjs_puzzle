'use client'

import { useState, useEffect, useRef } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TouchBackend } from 'react-dnd-touch-backend'
import { isMobile } from 'react-device-detect'
import PuzzlePiece from './PuzzlePiece'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { loadRandomImage, cutImageIntoPieces } from '../utils/imageUtils'
import { useSound } from '../hooks/useSound'
import { useRouter } from 'next/navigation'

interface GameProps {
  difficulty: number
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

export default function Game({ difficulty }: GameProps) {
  const router = useRouter()
  const targetAreaRef = useRef<HTMLDivElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [pieces, setPieces] = useState<GamePiece[]>([])
  const [completed, setCompleted] = useState(false)
  const [piecePositions, setPiecePositions] = useState<PiecePosition[]>([])
  const [time, setTime] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const playDropSound = useSound('/sounds/drop.mp3')
  const playCompleteSound = useSound('/sounds/complete.mp3')

  useEffect(() => {
    loadGame()
  }, [difficulty])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isActive) {
      interval = setInterval(() => {
        setTime((time) => time + 1)
      }, 1000)
    } else if (!isActive && time !== 0) {
      if (interval) clearInterval(interval)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, time])

  const generateRandomPositions = (count: number): PiecePosition[] => {
    return Array(count).fill(null).map(() => ({
      x: Math.random() * 80 - 40, // -40% to +40% from center
      y: Math.random() * 80 - 40, // -40% to +40% from center
      rotation: Math.random() * 40 - 20 // -20deg to +20deg
    }))
  }

  const loadGame = async () => {
    try {
      setError(null)
      const imageUrl = await loadRandomImage()
      setImage(imageUrl)
      const rows = Math.sqrt(difficulty)
      const cols = rows
      const cutPieces = await cutImageIntoPieces(imageUrl, rows, cols)
      
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
  }

  const findClosestTargetPosition = (x: number, y: number): number | null => {
    if (!targetAreaRef.current) return null

    const targetArea = targetAreaRef.current
    const rect = targetArea.getBoundingClientRect()
    
    // 檢查是否在目標區域內
    if (
      x < rect.left ||
      x > rect.right ||
      y < rect.top ||
      y > rect.bottom
    ) {
      return null
    }

    const rows = Math.sqrt(difficulty)
    const cellWidth = rect.width / rows
    const cellHeight = rect.height / rows

    // 計算最近的格子
    const col = Math.floor((x - rect.left) / cellWidth)
    const row = Math.floor((y - rect.top) / cellHeight)
    
    // 確保在有效範圍內
    if (
      row >= 0 && row < rows &&
      col >= 0 && col < rows
    ) {
      return row * rows + col
    }

    return null
  }

  const handlePieceDrop = (pieceId: number, x?: number, y?: number, targetPosition?: number | null) => {
    let finalTargetPosition = targetPosition

    // 如果提供了座標，嘗試找到最近的目標位置
    if (x !== undefined && y !== undefined) {
      finalTargetPosition = findClosestTargetPosition(x, y)
    }

    const newPieces = [...pieces]
    
    // 如果有其他片段在目標位置，將其移出
    if (finalTargetPosition !== null) {
      const pieceAtTarget = newPieces.find(p => p.currentPosition === finalTargetPosition)
      if (pieceAtTarget) {
        pieceAtTarget.currentPosition = null
      }
    }
    
    // 更新當前片段的位置
    const piece = newPieces.find(p => p.id === pieceId)
    if (piece) {
      piece.currentPosition = finalTargetPosition
    }
    
    setPieces(newPieces)
    playDropSound()
    checkCompletion(newPieces)
  }

  const checkCompletion = (currentPieces: GamePiece[]) => {
    const isCompleted = currentPieces.every(piece => piece.currentPosition === piece.id)
    if (isCompleted) {
      setCompleted(true)
      setIsActive(false)
      playCompleteSound()
    }
  }

  const handleRestart = () => {
    loadGame()
  }

  const handleBack = () => {
    router.push('/')
  }

  const Backend = isMobile ? TouchBackend : HTML5Backend

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="flex flex-col items-center space-y-4 p-4">
        <div className="text-red-500">{error}</div>
        <Button onClick={handleRestart}>重新開始</Button>
      </div>
    )
  }

  return (
    <DndProvider backend={Backend}>
      <div className="flex flex-col items-center space-y-4 p-4">
        <div className="flex items-center justify-between w-full max-w-7xl">
          <Button variant="outline" onClick={handleBack}>
            返回選擇難度
          </Button>
          <div className="text-xl font-bold">時間: {formatTime(time)}</div>
        </div>
        
        <div className="flex flex-col lg:flex-row justify-between w-full max-w-7xl gap-8">
          <div className="flex flex-col w-full lg:w-1/3 gap-4">
            {/* 預覽圖 */}
            <div className="w-full">
              <h2 className="text-lg font-semibold mb-2">預覽圖</h2>
              {image && (
                <div className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg">
                  <img
                    src={image}
                    alt="完整圖片"
                    className="w-full h-full object-cover opacity-50"
                  />
                </div>
              )}
            </div>

            {/* 拼圖區域 */}
            <div className="w-full">
              <h2 className="text-lg font-semibold mb-2">拼圖片段</h2>
              <div className="relative aspect-square w-full bg-gray-50 rounded-lg overflow-hidden border-2 border-dashed border-gray-200">
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
                          width: `${90 / Math.sqrt(difficulty)}%`,
                          height: `${90 / Math.sqrt(difficulty)}%`,
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
          <div className="w-full lg:w-2/3">
            <h2 className="text-lg font-semibold mb-2">目標區域</h2>
            <div 
              ref={targetAreaRef}
              className="relative aspect-square w-full bg-white rounded-lg shadow-lg border border-gray-200"
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
                      className="relative border border-dashed border-gray-300 bg-gray-50/50"
                      style={{
                        aspectRatio: '1/1',
                      }}
                      onClick={() => {
                        if (piece) {
                          handlePieceDrop(piece.id)
                        }
                      }}
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
            className="text-2xl font-bold text-green-500"
          >
            恭喜你完成拼圖！用時：{formatTime(time)}
          </motion.div>
        )}
        <Button onClick={handleRestart}>重新開始</Button>
      </div>
    </DndProvider>
  )
}

