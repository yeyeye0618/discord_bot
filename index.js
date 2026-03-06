require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,              // 伺服器相關事件
        GatewayIntentBits.GuildMessages,        // 讀取訊息
        GatewayIntentBits.MessageContent,    // 讀取訊息內容 (這要在後台開啟)
    ],
});

const load_command = () => {
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, 'command');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        // 清除快取以便開發
        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);
        
        // 🚩 優先使用 data.name (斜線指令)，其次使用 name (訊息指令)
        const cmdName = command.data?.name || command.name;
        
        if (cmdName) {
            client.commands.set(cmdName, command);
        } else {
            console.warn(`⚠️ 指令檔案 ${file} 缺少 name 或 data.name，已跳過。`);
        }
    }
};


// 當機器人準備好時觸發
client.once('clientReady', async () => {
    console.log('--------------------------------------');
    console.log(`🚀 機器人連線成功！`);
    console.log(`🤖 帳號名稱：${client.user.tag}`);
    console.log('--------------------------------------');
    try {
        // 🚩 修正點：先過濾出具備 data 屬性的指令，再進行 map
        const commandsData = client.commands
            .filter(cmd => cmd.data) 
            .map(cmd => cmd.data.toJSON());

        if (commandsData.length > 0) {
            await client.application.commands.set(commandsData);
            console.log(`✅ 已成功更新 ${commandsData.length} 個斜線指令選單`);
        } else {
            console.log('ℹ️ 沒有偵測到任何斜線指令格式的檔案，跳過註冊。');
        }
		const channel = client.channels.cache.get(process.env.CHANNEL_ID);
		if (channel) {
			channel.send('機器人已上線！');
		}
    } catch (error) {
        console.error('❌ 註冊指令時出錯:', error);
    }
});

// 監聽訊息指令
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '執行指令時發生錯誤！', ephemeral: true });
        } else {
            await interaction.reply({ content: '執行指令時發生錯誤！', ephemeral: true });
        }
    }
});

load_command()

// 使用 Token 登入
client.login(process.env.DISCORD_TOKEN);

