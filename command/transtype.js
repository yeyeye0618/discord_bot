const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    // 🚩 定義指令結構
    data: new SlashCommandBuilder()
        .setName('transtype')
        .setDescription('修改運送種類與功能開關'),

    async execute(interaction) {
        // 設定路徑 (根據你之前的結構)
        const projectRoot = path.join(__dirname, '..', 'resource_transfer');
        const envPath = path.join(projectRoot, '.env');
        const signalPath = path.join(projectRoot, '.restart_signal');

        // 1. 建立多選選單
        const select = new StringSelectMenuBuilder()
            .setCustomId('type_select')
            .setPlaceholder('請勾選要開啟的功能 (可多選)')
            .setMinValues(0) 
            .setMaxValues(3) 
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('自動回覆').setValue('AUTO_REPLY').setDescription('ENV: AUTO_REPLY'),
                new StringSelectMenuOptionBuilder().setLabel('日誌記錄').setValue('ENABLE_LOGGING').setDescription('ENV: ENABLE_LOGGING'),
                new StringSelectMenuOptionBuilder().setLabel('維護模式').setValue('MAINTENANCE_MODE').setDescription('ENV: MAINTENANCE_MODE')
            );

        // 2. 建立確認按鈕
        const confirmBtn = new ButtonBuilder()
            .setCustomId('confirm_config')
            .setLabel('確認修改並重啟')
            .setStyle(ButtonStyle.Success);

        const row1 = new ActionRowBuilder().addComponents(select);
        const row2 = new ActionRowBuilder().addComponents(confirmBtn);

        // 發送初始面板
        const response = await interaction.reply({
            content: '🔧 **配置中心**：請勾選選項後按下確認。',
            components: [row1, row2],
            ephemeral: true 
        });

        // 3. 建立收集器監聽 Component (選單與按鈕)
        let temporarySelection = [];
        const collector = response.createMessageComponentCollector({ 
            time: 60000 // 60秒後失效
        });

        collector.on('collect', async i => {
            if (i.customId === 'config_menu') {
                // 更新使用者目前的選擇，但不發送新訊息，保持介面乾淨
                temporarySelection = i.values;
                await i.deferUpdate(); 
            } 
            
            else if (i.customId === 'confirm_config') {
                await i.deferUpdate(); // 先回應 Discord 伺服器防止超時

                try {
                    // --- 4. 核心邏輯：讀取並修改 .env ---
                    if (!fs.existsSync(envPath)) {
                        return await interaction.followUp({ content: '❌ 找不到 .env 檔案', ephemeral: true });
                    }

                    let envContent = fs.readFileSync(envPath, 'utf8');
                    let envLines = envContent.split(/\r?\n/);

                    // 定義我們要處理的 Key 清單
                    const targetKeys = ['AUTO_REPLY', 'ENABLE_LOGGING', 'MAINTENANCE_MODE'];

                    const newLines = envLines.map(line => {
                        // 檢查這一行是否屬於我們要修改的 Key
                        for (const key of targetKeys) {
                            const regex = new RegExp(`^${key}\\s*=.*`, 'i');
                            if (regex.test(line)) {
                                // 如果 temporarySelection 包含這個 Key，設為 true，否則 false
                                const isEnabled = temporarySelection.includes(key);
                                return `${key} = ${isEnabled}`;
                            }
                        }
                        return line;
                    });

                    // 寫回檔案
                    fs.writeFileSync(envPath, newLines.join('\n'));

                    // --- 5. 發送重啟訊號 ---
                    fs.writeFileSync(signalPath, `RESTART_${Date.now()}`);

                    // 更新原始訊息告知成功
                    await interaction.editReply({
                        content: `✅ 配置已更新！\n**已開啟：** \`${temporarySelection.join(', ') || '無'}\`\n正在通知 PowerShell 重啟系統...`,
                        components: [] // 移除按鈕防止重複點擊
                    });

                    collector.stop(); // 結束收集

                } catch (error) {
                    console.error(error);
                    await interaction.followUp({ content: '❌ 寫入配置時出錯', ephemeral: true });
                }
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: '⏰ 操作超時，請重新輸入指令。', components: [] });
            }
        });
    },
};