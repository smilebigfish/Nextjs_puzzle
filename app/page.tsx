'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Volume2, VolumeX } from "lucide-react"
import { imageCategories } from '@/config/images'
import { validateAndProcessImage } from '@/utils/imageUtils'

interface GameSettings {
  difficulty: string
  soundEnabled: boolean
  selectedImage: string | null
  customImage: File | null
  isCustomImage: boolean
}

export default function Home() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedCategory, setSelectedCategory] = useState(imageCategories[0].id)
  const [settings, setSettings] = useState<GameSettings>(() => {
    // 從 localStorage 讀取音效設定
    const savedSettings = localStorage.getItem('gameSettings')
    const parsedSettings = savedSettings ? JSON.parse(savedSettings) : null
    
    return {
      difficulty: '9',
      soundEnabled: parsedSettings?.soundEnabled ?? true,
      selectedImage: imageCategories[0].images[0].src,
      customImage: null,
      isCustomImage: false
    }
  })

  // 當音效設定改變時，立即更新 localStorage
  const handleSoundToggle = () => {
    const newSoundEnabled = !settings.soundEnabled
    setSettings(prev => ({
      ...prev,
      soundEnabled: newSoundEnabled
    }))
    localStorage.setItem('gameSettings', JSON.stringify({
      soundEnabled: newSoundEnabled
    }))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const processedImage = await validateAndProcessImage(file)
        console.log('圖片處理成功:', processedImage.substring(0, 50) + '...')  // 除錯用
        
        setSettings(prev => ({
          ...prev,
          selectedImage: processedImage,
          customImage: file,
          isCustomImage: true
        }))
      } catch (error) {
        console.error('圖片處理錯誤:', error)
        alert((error as Error).message)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
  }

  const handleSelectDefaultImage = (imageSrc: string) => {
    setSettings(prev => ({
      ...prev,
      selectedImage: imageSrc,
      customImage: null,
      isCustomImage: false
    }))
  }

  const handleStart = () => {
    if (!settings.selectedImage) {
      alert('請選擇一張圖片')
      return
    }

    // 將音效設定存儲到 localStorage
    localStorage.setItem('gameSettings', JSON.stringify({
      soundEnabled: settings.soundEnabled
    }))

    try {
      // 如果是自訂圖片，將圖片數據存儲到 sessionStorage
      if (settings.isCustomImage && settings.selectedImage) {
        // 確保圖片數據是有效的 base64 字串
        if (!settings.selectedImage.startsWith('data:image')) {
          throw new Error('無效的圖片數據')
        }
        
        // 先清除舊的圖片數據
        sessionStorage.removeItem('customPuzzleImage')
        // 存儲新的圖片數據
        sessionStorage.setItem('customPuzzleImage', settings.selectedImage)
        console.log('自訂圖片已保存到 sessionStorage')  // 除錯用
        
        // URL 中只傳遞標記
        const params = new URLSearchParams({
          difficulty: settings.difficulty,
          imageType: 'custom',
          timestamp: Date.now().toString()  // 添加時間戳以避免快取問題
        })
        router.push(`/game?${params.toString()}`)
      } else {
        // 如果是預設圖片，直接傳遞圖片路徑
        const params = new URLSearchParams({
          difficulty: settings.difficulty,
          imageType: 'default',
          image: settings.selectedImage || ''
        })
        router.push(`/game?${params.toString()}`)
      }
    } catch (error) {
      console.error('圖片處理錯誤:', error)
      alert('圖片處理失敗，請重新選擇圖片')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">互動拼圖遊戲</h1>
          <p className="text-gray-600 mb-8">自訂遊戲設定</p>
        </div>

        <div className="space-y-6">
          {/* 難度選擇 */}
          <div className="space-y-2">
            <Label>難度設定</Label>
            <Select
              value={settings.difficulty}
              onValueChange={(value) => setSettings(prev => ({ ...prev, difficulty: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="選擇難度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">簡單 (2 x 2)</SelectItem>
                <SelectItem value="9">普通 (3 x 3)</SelectItem>
                <SelectItem value="16">困難 (4 x 4)</SelectItem>
                <SelectItem value="25">專家 (5 x 5)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 音效控制 */}
          <div className="flex items-center justify-between">
            <Label>遊戲音效</Label>
            <div 
              className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={handleSoundToggle}
            >
              {settings.soundEnabled ? (
                <Volume2 className="h-6 w-6 text-green-500" />
              ) : (
                <VolumeX className="h-6 w-6 text-gray-400" />
              )}
            </div>
          </div>

          {/* 圖片分類選擇 */}
          <div className="space-y-4">
            <Label>圖片分類</Label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {imageCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* 圖片選擇 */}
          <div className="space-y-4">
            <Label>選擇圖片</Label>
            <div className="grid grid-cols-3 gap-4">
              {imageCategories
                .find(c => c.id === selectedCategory)
                ?.images.map((img) => (
                  <div
                    key={img.id}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                      settings.selectedImage === img.src ? 'border-blue-500' : 'border-transparent'
                    }`}
                    onClick={() => handleSelectDefaultImage(img.src)}
                  >
                    <img
                      src={img.src}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* 上傳自訂圖片 */}
          <div className="space-y-2">
            <Label>上傳自訂圖片</Label>
            <div className="flex gap-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                選擇圖片
              </Button>
            </div>
            {settings.isCustomImage && settings.selectedImage && (
              <div className="relative aspect-video rounded-lg overflow-hidden mt-2">
                <img
                  src={settings.selectedImage}
                  alt="自訂圖片預覽"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* 開始遊戲按鈕 */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleStart}
          >
            開始遊戲
          </Button>
        </div>
      </div>
    </main>
  )
}

