const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    name: 'restart',
    description: '僅重啟本機 Python 專案',
    execute(message, args) {
        const signalPath = path.join(__dirname, '..', 'resource_transfer', '.restart_signal');

        try {
            fs.writeFileSync(signalPath, Date.now().toString());
            message.reply('⏳ 已發送重啟訊號，本機 Python 專案重啟中...');
        } catch (error) {
            console.error(error);
            message.reply('❌ 無法寫入訊號檔，請檢查資料夾權限。');
        }
    },
};