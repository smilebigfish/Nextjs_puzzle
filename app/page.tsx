'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function Home() {
  const router = useRouter()
  const [difficulty, setDifficulty] = useState('9')

  const handleStart = () => {
    router.push(`/game?difficulty=${difficulty}`)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">互動拼圖遊戲</h1>
          <p className="text-gray-600 mb-8">選擇難度開始遊戲</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">難度</label>
            <Select
              value={difficulty}
              onValueChange={setDifficulty}
            >
              <SelectTrigger>
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

