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

const load_command = (() => {
	client.commands = new Collection();
	const commandsPath = path.join(__dirname, 'command');
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// 以指令名稱作為 Key 存入 Collection
		client.commands.set(command.name, command);
	}
});


// 當機器人準備好時觸發
client.once('clientReady', () => {
    console.log('--------------------------------------');
    console.log(`🚀 機器人連線成功！`);
    console.log(`🤖 帳號名稱：${client.user.tag}`);
    console.log('--------------------------------------');
	const channel = client.channels.cache.get(process.env.CHANNEL_ID);
    if (channel) {
        channel.send('機器人已上線！');
    }
});

// 監聽訊息指令
client.on('messageCreate', async (message) => {
	const content = message.content;
	
	if (message.author.bot || !content.startsWith("!")) return;
    load_command()
    
	const args = content.slice(1).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();
	
	const command = client.commands.get(commandName);
	if (!command) return;

	try {
		command.execute(message, args);
		console.log(`[執行] 指令: ${commandName} | 執行者: ${message.author.tag}`);
	} catch (error) {
		console.error(error);
		message.reply('錯誤指令');
	}

});

load_command()

// 使用 Token 登入
client.login(process.env.DISCORD_TOKEN);

