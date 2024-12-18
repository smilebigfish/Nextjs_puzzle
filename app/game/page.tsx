import Game from '../../components/Game'

export default function GamePage({ searchParams }: { searchParams: { difficulty: string } }) {
  const difficulty = parseInt(searchParams.difficulty) || 9 // 默認為 3x3

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Game difficulty={difficulty} />
    </main>
  )
}

