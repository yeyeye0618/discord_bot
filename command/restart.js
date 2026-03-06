const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    // 🚩 定義斜線指令的數據結構
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('重啟 ERTS'),

    async execute(interaction) {
        const signalPath = path.join(__dirname, '..', 'resource_transfer', '.restart_signal');
        
        try {
            // 🚩 寫入重啟訊號檔，讓 monitor_bot.ps1 偵測到並重啟 Python
            if (fs.existsSync(path.dirname(signalPath))) {
                fs.writeFileSync(signalPath, Date.now().toString());
            }

            // 5. 回覆使用者 (ephemeral: true 確保只有本人看得見)
            await interaction.reply({
                content: `ERTS 已經重啟`,
                ephemeral: true 
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: ' ERTS 重啟時發生錯誤，請檢查', 
                ephemeral: true 
            });
        }
    },
};