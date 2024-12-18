'use client'

import { useDrag, useDrop } from 'react-dnd'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface PuzzlePieceProps {
  index: number
  image: string
  onDrop: (fromIndex: number, x?: number, y?: number) => void
  isInTarget?: boolean
}

export default function PuzzlePiece({ index, image, onDrop, isInTarget = false }: PuzzlePieceProps) {
  const [dragImage, setDragImage] = useState<HTMLDivElement | null>(null)
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'puzzle',
    item: { index, type: 'puzzle' },
    end: (item, monitor) => {
      const clientOffset = monitor.getClientOffset()
      if (clientOffset) {
        onDrop(item.index, clientOffset.x, clientOffset.y)
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [index, onDrop])

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'puzzle',
    drop: (item: { index: number }) => {
      onDrop(item.index)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  useEffect(() => {
    if (isDragging && !dragImage) {
      // 創建拖曳時的預覽圖
      const div = document.createElement('div')
      div.style.position = 'fixed'
      div.style.pointerEvents = 'none'
      div.style.left = '-1000px'
      div.style.top = '-1000px'
      
      const img = document.createElement('img')
      img.src = image
      img.style.width = '100px'
      img.style.height = '100px'
      img.style.objectFit = 'cover'
      img.style.borderRadius = '4px'
      img.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'
      
      div.appendChild(img)
      document.body.appendChild(div)
      setDragImage(div)
    } else if (!isDragging && dragImage) {
      // 清理預覽圖
      document.body.removeChild(dragImage)
      setDragImage(null)
    }
  }, [isDragging, image, dragImage])

  useEffect(() => {
    const updateDragImage = (e: MouseEvent) => {
      if (isDragging && dragImage) {
        dragImage.style.left = `${e.clientX - 50}px`
        dragImage.style.top = `${e.clientY - 50}px`
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', updateDragImage)
    }

    return () => {
      window.removeEventListener('mousemove', updateDragImage)
    }
  }, [isDragging, dragImage])

  return (
    <motion.div
      ref={(node) => drag(drop(node))}
      className={`relative w-full h-full cursor-move transition-transform ${
        isInTarget ? 'hover:scale-105' : 'hover:scale-110'
      }`}
      initial={{ scale: 1 }}
      animate={{
        scale: isDragging ? 1.1 : 1,
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isOver ? '0 0 0 2px #4CAF50' : 'none',
      }}
      transition={{ duration: 0.2 }}
      style={{
        touchAction: 'none',
      }}
    >
      <img
        src={image}
        alt={`拼圖片段 ${index + 1}`}
        className="w-full h-full object-cover select-none rounded-sm"
        draggable={false}
        style={{
          aspectRatio: '1/1',
        }}
      />
    </motion.div>
  )
}

