# 使用 Node.js 官方輕量映像檔
FROM node:20-slim

# 設定工作目錄
WORKDIR /usr/src/app

# 先複製 package 檔案以利用快取
COPY package*.json ./

# 安裝依賴 (只安裝 production 所需)
RUN npm install --omit=dev

# 複製其餘程式碼
COPY . .

# 啟動指令
CMD [ "node", "index.js" ]