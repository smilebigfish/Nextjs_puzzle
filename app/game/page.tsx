'use client'

import { useEffect, useState } from 'react'
import Game from '../../components/Game'
import { useRouter } from 'next/navigation'

export default function GamePage({ 
  searchParams 
}: { 
  searchParams: { 
    difficulty: string, 
    imageType: string,
    image?: string,
    timestamp?: string
  } 
}) {
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState<string>('')
  const difficulty = parseInt(searchParams.difficulty) || 9

  useEffect(() => {
    const loadImage = () => {
      try {
        if (searchParams.imageType === 'custom') {
          // 確保在客戶端執行
          if (typeof window !== 'undefined') {
            const customImage = sessionStorage.getItem('customPuzzleImage')
            
            if (customImage && customImage.startsWith('data:image')) {
              setImageUrl(customImage)
            } else {
              console.error('找不到有效的自訂圖片')
              alert('圖片載入失敗，請重新選擇圖片')
              router.push('/')
              return
            }
          }
        } else if (searchParams.image) {
          setImageUrl(searchParams.image)
        } else {
          console.error('未提供圖片參數')
          alert('請選擇一張圖片')
          router.push('/')
          return
        }
      } catch (error) {
        console.error('載入圖片失敗:', error)
        alert('圖片載入失敗，請重試')
        router.push('/')
      }
    }

    loadImage()
  }, [searchParams.imageType, searchParams.image, searchParams.timestamp, router])

  if (!imageUrl) {
    return (
      <main className="h-[calc(100vh-1rem)] flex items-center justify-center bg-gray-50">
        <div className="text-lg font-medium">載入中...</div>
      </main>
    )
  }

  return (
    <main className="h-[calc(100vh-1rem)] flex flex-col items-center justify-center p-2 sm:p-4 bg-gray-50 overflow-hidden">
      <Game difficulty={difficulty} imageUrl={imageUrl} />
    </main>
  )
}

