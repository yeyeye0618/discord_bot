const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    // 🚩 定義斜線指令的數據結構
    data: new SlashCommandBuilder()
        .setName('repeat')
        .setDescription('調整 env 的 repeat 設定')
        .addIntegerOption(option => 
            option.setName('times')
                .setDescription('要設定的重複次數')
                .setRequired(true)
                .setMinValue(1)), // 直接在選單層級限制最小值為 1

    async execute(interaction) {
        // 1. 取得參數 (斜線指令使用 options.getInteger)
        const new_repeat_times = interaction.options.getInteger('times');

        const envPath = path.join(__dirname, '..', 'resource_transfer', '.env');
        
        try {
            // 2. 檢查檔案
            if (!fs.existsSync(envPath)) {
                return await interaction.reply({ content: '❌ ERTS 配置錯誤：找不到 .env 檔案', ephemeral: true });
            }

            // 3. 讀取並修改內容
            let envContent = fs.readFileSync(envPath, 'utf8');
            const envLines = envContent.split(/\r?\n/);
            
            let found = false;
            const newLines = envLines.map(line => {
                // 使用容忍空格的 Regex
                const regex = /^repeat\s*=\s*.*/i;
                if (regex.test(line)) {
                    found = true;
                    return `repeat = ${new_repeat_times}`;
                }
                return line;
            });

            // 4. 寫回檔案
            fs.writeFileSync(envPath, newLines.join('\n'));

            // 5. 回覆使用者 (ephemeral: true 確保只有本人看得見)
            await interaction.reply({
                content: `✅ 已將 repeat 次數設定為 \`${new_repeat_times}\``,
                ephemeral: true 
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: '❌ 修改 .env 時發生錯誤，請檢查 Docker 權限設定。', 
                ephemeral: true 
            });
        }
    },
};