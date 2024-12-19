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
        // 根據圖片類型載入對應的圖片
        if (searchParams.imageType === 'custom') {
          console.log('正在載入自訂圖片...')  // 除錯用
          const customImage = sessionStorage.getItem('customPuzzleImage')
          console.log('從 sessionStorage 讀取的圖片:', customImage ? '有數據' : '無數據')  // 除錯用
          
          if (customImage && customImage.startsWith('data:image')) {
            console.log('圖片數據有效，設置圖片 URL')  // 除錯用
            setImageUrl(customImage)
          } else {
            console.error('找不到有效的自訂圖片')
            // 如果找不到自訂圖片或圖片無效，返回首頁
            alert('圖片載入失敗，請重新選擇圖片')
            router.push('/')
            return
          }
        } else if (searchParams.image) {
          console.log('載入預設圖片:', searchParams.image)  // 除錯用
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
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-xl">載入中...</div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Game difficulty={difficulty} imageUrl={imageUrl} />
    </main>
  )
}

