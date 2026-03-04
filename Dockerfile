# 使用 Node.js 20 輕量版作為基底
FROM node:20-slim

# 設定容器內的工作目錄
WORKDIR /usr/src/app

# 先複製 package.json 與 package-lock.json
# 這樣可以在代碼變動但套件沒變時，利用 Docker 快取加速構建
COPY package*.json ./

# 只安裝生產環境所需的套件 (節省空間)
RUN npm install --production

# 複製其餘的所有程式碼 (包含 command 資料夾)
COPY . .

# 啟動機器人 (假設你的主程式檔名是 index.js)
CMD [ "node", "index.js" ]