'use client'

/**
 * 檢查是否在瀏覽器環境下
 */
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * 驗證並處理上傳的圖片，包括大小和尺寸的檢查
 */
export const validateAndProcessImage = (file: File): Promise<string> => {
  if (!isBrowser) {
    return Promise.reject(new Error('此函數只能在瀏覽器環境中執行'));
  }

  return new Promise((resolve, reject) => {
    // 檢查檔案大小（限制為 5MB）
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('圖片大小不能超過 5MB'));
      return;
    }

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      reject(new Error('請上傳有效的圖片檔案'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // 檢查圖片尺寸（建議最小尺寸為 300x300）
        if (img.width < 300 || img.height < 300) {
          reject(new Error('圖片尺寸太小，建議至少 300x300 像素'));
          return;
        }

        // 如果圖片太大，進行壓縮
        const maxDimension = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // 創建 canvas 進行壓縮
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('無法處理圖片'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // 轉換為 base64，使用較低的品質以減少檔案大小
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('圖片載入失敗'));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error('無法讀取檔案'));
    reader.readAsDataURL(file);
  });
};

/**
 * 將圖片切割成拼圖片段
 */
export const cutImageIntoPieces = (imageUrl: string, rows: number, cols: number): Promise<string[]> => {
  if (!isBrowser) {
    return Promise.resolve(Array(rows * cols).fill(''));
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const pieces: string[] = [];
        const pieceWidth = img.width / cols;
        const pieceHeight = img.height / rows;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('無法創建畫布上下文');
        }

        // 設置每個拼圖片段的大小
        canvas.width = pieceWidth;
        canvas.height = pieceHeight;

        // 切割圖片
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(
              img,
              x * pieceWidth, y * pieceHeight,
              pieceWidth, pieceHeight,
              0, 0,
              pieceWidth, pieceHeight
            );
            pieces.push(canvas.toDataURL('image/jpeg', 0.8));
          }
        }

        resolve(pieces);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('處理圖片時發生錯誤'));
      }
    };

    img.onerror = () => reject(new Error('圖片載入失敗'));
    
    // 設置圖片來源
    img.src = imageUrl;
  });
};

