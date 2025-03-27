'use client'

import { useDrag, useDrop } from 'react-dnd'
import { motion } from 'framer-motion'
import Image from 'next/image'
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
      const div = document.createElement('div')
      div.style.position = 'fixed'
      div.style.pointerEvents = 'none'
      div.style.left = '-1000px'
      div.style.top = '-1000px'
      
      const img = document.createElement('img')
      img.src = image
      img.style.width = '80px'
      img.style.height = '80px'
      img.style.objectFit = 'cover'
      img.style.borderRadius = '4px'
      img.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
      
      div.appendChild(img)
      document.body.appendChild(div)
      setDragImage(div)
    } else if (!isDragging && dragImage) {
      document.body.removeChild(dragImage)
      setDragImage(null)
    }
  }, [isDragging, image, dragImage])

  useEffect(() => {
    const updateDragImage = (e: MouseEvent) => {
      if (isDragging && dragImage) {
        dragImage.style.left = `${e.clientX - 40}px`
        dragImage.style.top = `${e.clientY - 40}px`
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
      ref={(node) => {
        if (node) {
          drag(node);
          drop(node);
        }
      }}
      className={`relative w-full h-full cursor-move transition-transform ${
        isInTarget ? 'hover:scale-103' : 'hover:scale-105'
      }`}
      initial={{ scale: 1 }}
      animate={{
        scale: isDragging ? 1.08 : 1,
        opacity: isDragging ? 0.7 : 1,
        boxShadow: isOver 
          ? '0 0 0 2px #4CAF50, 0 4px 8px rgba(0, 0, 0, 0.1)' 
          : isDragging 
            ? '0 4px 8px rgba(0, 0, 0, 0.1)' 
            : '0 1px 3px rgba(0, 0, 0, 0.05)',
        zIndex: isDragging ? 10 : 1,
      }}
      transition={{ duration: 0.15 }}
      style={{ touchAction: 'none' }}
    >
      <div className="relative w-full h-full overflow-hidden rounded-sm" style={{ aspectRatio: '1/1' }}>
        <Image
          src={image}
          alt={`拼圖片段 ${index + 1}`}
          className="object-cover select-none"
          fill
          draggable={false}
          sizes="(max-width: 768px) 100vw, 150px"
          priority={isInTarget}
        />
      </div>
    </motion.div>
  )
}

