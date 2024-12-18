'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const difficulties = [
  { value: '2x2', label: '簡單 (2x2)', pieces: 4 },
  { value: '3x3', label: '中等 (3x3)', pieces: 9 },
  { value: '4x4', label: '困難 (4x4)', pieces: 16 },
  { value: '5x5', label: '專家 (5x5)', pieces: 25 },
]

export default function GameSetup() {
  const [difficulty, setDifficulty] = useState(difficulties[0].value)
  const router = useRouter()

  const handleStart = () => {
    const selectedDifficulty = difficulties.find(d => d.value === difficulty)
    router.push(`/game?difficulty=${selectedDifficulty?.pieces}`)
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <Select value={difficulty} onValueChange={setDifficulty}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="選擇難度" />
        </SelectTrigger>
        <SelectContent>
          {difficulties.map((d) => (
            <SelectItem key={d.value} value={d.value}>
              {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleStart}>開始遊戲</Button>
    </div>
  )
}

