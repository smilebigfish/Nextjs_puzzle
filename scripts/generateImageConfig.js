const fs = require('fs');
const path = require('path');

// 圖片分類名稱對照表
const categoryNames = {
  'fruit': '水果',
  'animals': '可愛動物',
  'scenery': '風景',
  'food': '美食',
  // 可以根據需要添加更多分類
};

// 支援的圖片格式
const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

// 圖片名稱對照表
const imageNames = {
  // 水果
  'blueberry': '藍莓',
  'lemon': '檸檬',
  'mango': '芒果',
  'peach': '桃子',
  'pear': '梨子',
  'pineapple': '鳳梨',
  'strawberry': '草莓',
  'watermelon': '西瓜',
  // 動物
  'bear': '熊',
  'cat': '貓咪',
  'dog': '狗狗',
  'elephant': '大象',
  'fox': '狐狸',
  'giraffe': '長頸鹿',
  'lion': '獅子',
  'monkey': '猴子',
  'panda': '熊貓',
  'rabbit': '兔子',
  'tiger': '老虎',
  // 可以根據需要添加更多名稱對照
};

function generateImageConfig() {
  const imagesDir = path.join(process.cwd(), 'public', 'images');
  const categories = [];

  // 讀取 images 目錄下的所有資料夾
  const dirs = fs.readdirSync(imagesDir).filter(dir => 
    fs.statSync(path.join(imagesDir, dir)).isDirectory()
  );

  // 處理每個分類資料夾
  dirs.forEach(dir => {
    const categoryPath = path.join(imagesDir, dir);
    const files = fs.readdirSync(categoryPath)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return supportedExtensions.includes(ext);
      });

    if (files.length > 0) {
      const images = files.map(file => {
        const baseName = path.basename(file, path.extname(file));
        return {
          id: `${dir}${files.indexOf(file) + 1}`,
          src: `/images/${dir}/${file}`,
          name: imageNames[baseName] || baseName // 如果沒有對應的中文名稱，使用檔名
        };
      });

      categories.push({
        id: dir,
        name: categoryNames[dir] || dir, // 如果沒有對應的中文名稱，使用資料夾名
        images
      });
    }
  });

  // 生成 TypeScript 配置文件
  const configContent = `// 此檔案由 generateImageConfig.js 自動生成
// 請勿手動修改

export interface ImageCategory {
  id: string
  name: string
  images: {
    id: string
    src: string
    name: string
  }[]
}

export const imageCategories: ImageCategory[] = ${JSON.stringify(categories, null, 2)}
`;

  // 寫入配置文件
  const configPath = path.join(process.cwd(), 'config', 'images.ts');
  fs.writeFileSync(configPath, configContent);

  console.log('圖片配置已更新！');
  console.log(`共處理 ${categories.length} 個分類，${categories.reduce((sum, cat) => sum + cat.images.length, 0)} 張圖片`);
}

generateImageConfig(); 