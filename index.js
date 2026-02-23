require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // 伺服器相關事件
    GatewayIntentBits.GuildMessages,    // 讀取訊息
    GatewayIntentBits.MessageContent,   // 讀取訊息內容 (這要在後台開啟)
  ],
});

// 當機器人準備好時觸發
client.once('ready', () => {
  console.log(`✅ 機器人已上線：${client.user.tag}`);
});

// 監聽訊息指令
client.on('messageCreate', async (message) => {
  // 排除機器人自己的訊息，避免無限迴圈
  if (message.author.bot) return;

  // 簡單的指令判斷
  if (message.content === '!ping') {
    await message.reply('🏓 Pong! 我正聽著你的指令呢！');
  }

  if (message.content === '!hello') {
    await message.channel.send(`你好 ${message.author.username}！準備好寫音樂機器人了嗎？`);
  }
});

// 使用 Token 登入
client.login(process.env.DISCORD_TOKEN);

