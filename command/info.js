const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('顯示當前 Python 專案的 .env 設定 (僅自己可見)'),
    
    async execute(interaction) {
        const envPath = path.join(__dirname, '..', 'resource_transfer', '.env');
        
        try {
            if (!fs.existsSync(envPath)) {
                // 🚩 ephemeral: true 確保只有發送者看得到
                return await interaction.reply({ content: '❌ 找不到設定檔。', ephemeral: true });
            }

            const envContent = fs.readFileSync(envPath, 'utf8');

            if (!envContent.trim()) {
                return await interaction.reply({ content: '⚠️ 設定檔目前是空的。', ephemeral: true });
            }

            const formattedContent = `###當前 ERTS 參數設定：\n\`\`\`env\n${envContent}\n\`\`\``;

            // 🚩 回覆訊息並設定為只有本人可見
            await interaction.reply({
                content: formattedContent,
                ephemeral: true 
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ 讀取設定時發生錯誤。', ephemeral: true });
        }
    },
};