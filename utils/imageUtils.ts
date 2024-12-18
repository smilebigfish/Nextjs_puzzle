'use client'

export const loadRandomImage = async (): Promise<string> => {
  const images = [
    '/images/puzzle1.jpg',
    '/images/puzzle2.jpg',
    '/images/puzzle3.jpg',
  ]
  const randomIndex = Math.floor(Math.random() * images.length)
  return images[randomIndex]
}

export const cutImageIntoPieces = async (
  imageUrl: string,
  rows: number,
  cols: number
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          const pieces: string[] = []
          const pieceWidth = Math.floor(img.width / cols)
          const pieceHeight = Math.floor(img.height / rows)

          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            throw new Error('無法創建 Canvas 上下文')
          }

          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              canvas.width = pieceWidth
              canvas.height = pieceHeight
              
              ctx.clearRect(0, 0, pieceWidth, pieceHeight)
              ctx.drawImage(
                img,
                x * pieceWidth,
                y * pieceHeight,
                pieceWidth,
                pieceHeight,
                0,
                0,
                pieceWidth,
                pieceHeight
              )
              
              const pieceDataUrl = canvas.toDataURL('image/png')
              if (!pieceDataUrl) {
                throw new Error('無法生成拼圖片段')
              }
              pieces.push(pieceDataUrl)
            }
          }
          
          resolve(pieces)
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = (error) => {
        reject(new Error(`圖片載入失敗: ${error}`))
      }

      img.src = imageUrl
    } catch (error) {
      reject(error)
    }
  })
}

