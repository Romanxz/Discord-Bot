const Discord = require("discord.js");
const { DeepClient } = require("@deep-foundation/deeplinks/imports/client.js");
const { generateApolloClient } = require('@deep-foundation/hasura/client.js');
const dotenv = require("dotenv")
dotenv.config();

const PACKAGE_NAME = "@romanxz/discord-bot"
const NEXT_PUBLIC_GQL_PATH = "3006-deepfoundation-dev-th7pn276c2v.ws-eu94.gitpod.io/gql"
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsiYWRtaW4iXSwieC1oYXN1cmEtZGVmYXVsdC1yb2xlIjoiYWRtaW4iLCJ4LWhhc3VyYS11c2VyLWlkIjoiMzc2In0sImlhdCI6MTY4MDk3NzQ0NH0.87w7nB1H3v35FDNjaMZJ_sc6uIiu564lrQ5oWJy2HD8"

const apolloClient = generateApolloClient({
	path: NEXT_PUBLIC_GQL_PATH || '', // <<= HERE PATH TO UPDATE
	ssl: !!~NEXT_PUBLIC_GQL_PATH.indexOf('localhost')
		? false
		: true,
	// admin token in prealpha deep secret key
	token: TOKEN
});

const deep = new DeepClient({ apolloClient });

const discordClient = new Discord.Client({
	intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMessages],
});


const BOT_TOKEN = 'MTA5NDAzOTQ1MDE5Mjk3MzkzNQ.G60iyJ.55GU1bkJ8QRy0zM7kor2vYhjnpMor3PntGQ8uQ';

discordClient.on('ready', () => {
	console.log(`Logged in as ${discordClient.user.tag}!`);
});

discordClient.on(Discord.Events.MessageCreate, async (message) => {
	// Check if the bot is mentioned
	const mentionPrefix = `<@${discordClient.user.id}>`;
	if (message.content.includes(mentionPrefix) && !message.author.bot) {
		// message.channel.send("IIIIIIIIIIIIIIII");
		const messageContent = message.content;
		const channelName = ""+message.channel.id;
		const messageLink = {
			string: { data: { value: messageContent } },
			type_id: await deep.id("@deep-foundation/messaging", "Message"),
			in: {
				data: [{
					type_id: await deep.id("@deep-foundation/core", "Contain"),
					from_id: await deep.id("deep", "admin"),
				}]
			}
		};
		const { data } = await deep.insert({
			string: { data: { value: channelName } },
			type_id: await deep.id("@deep-foundation/chatgpt", "Conversation"),
			in: {
				data: [{
					type_id: await deep.id("@deep-foundation/core", "Contain"),
					from_id: await deep.id("deep", "admin"),
				},
				{
					type_id: await deep.id("@deep-foundation/messaging", 'Reply'),
					from: {
						data: messageLink
					},
					in: {
						data: [{
							type_id: await deep.id("@deep-foundation/core", "Contain"),
							from_id: await deep.id("deep", "admin"),
						}]
					}
				}]
			}
		});
	}
});

discordClient.login(BOT_TOKEN);
