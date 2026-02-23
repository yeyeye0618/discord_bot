module.exports = {
    name: 'ping',
    description: '測試機器人延遲',
    execute(message, args) {
        message.reply('🏓 Pong!');
        // reponse the server ping
        message.channel.send(`⏱️ 延遲: ${Date.now() - message.createdTimestamp}ms`);
    },
};