
const { DeepClient } = require("@deep-foundation/deeplinks/imports/client.js");
const { generateApolloClient } = require('@deep-foundation/hasura/client.js');
const { createSerialOperation } = require("@deep-foundation/deeplinks/imports/gql/serial.js");
const dotenv = require("dotenv")
dotenv.config();

const PACKAGE_NAME = "@romanxz/discord-bot"
const NEXT_PUBLIC_GQL_PATH = "3006-deepfoundation-dev-kdbih18knts.ws-eu94.gitpod.io/gql"
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsiYWRtaW4iXSwieC1oYXN1cmEtZGVmYXVsdC1yb2xlIjoiYWRtaW4iLCJ4LWhhc3VyYS11c2VyLWlkIjoiMzc2In0sImlhdCI6MTY4MDk3NzQ0NH0.87w7nB1H3v35FDNjaMZJ_sc6uIiu564lrQ5oWJy2HD8"
const PACKAGE_TYPES = ["DiscordBotToken", "Active"]

const apolloClient = generateApolloClient({
  path: NEXT_PUBLIC_GQL_PATH || '', // <<= HERE PATH TO UPDATE
  ssl: !!~NEXT_PUBLIC_GQL_PATH.indexOf('localhost')
    ? false
    : true,
  // admin token in prealpha deep secret key
  token: TOKEN
});

const deep = new DeepClient({ apolloClient });

async function installPackage() {

  const code = `async ({deep, require, data: {oldLink, newLink, triggeredByLinkId}}) => {
    const loadBotToken = async () => {
      const containTreeId = await deep.id('@deep-foundation/core', 'containTree');
      const tokenTypeId = await deep.id('@romanxz/discord-bot', 'BotToken');
      const { data: [{ value: { value: npmToken = undefined } = {} } = {}] = [] } = await deep.select({
        up: {
          tree_id: { _eq: containTreeId },
          parent: { id: { _eq: triggeredByLinkId } },
          link: { type_id: { _eq: tokenTypeId } }
        }
      });
      return npmToken;
    };
    const Discord = require("discord.js");
    const BOT_TOKEN = await loadBotToken();

    const client = new Discord.Client({
      intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMessages],
    });

    const data = await deep.select({id:newLink.id}, {returning:"id message:from {value} to {id out {id to {id channel:value}}}"});
    const replyText = data.data[0].message.value.value
    const channelId = data.data[0].to.out[0].to.channel.value
    
    client.on('ready', async () => {
    client.channels.fetch(channelId)
  .then(async (channel) => {await channel.send(replyText);
        await client.destroy();});
    });
  client.login(BOT_TOKEN);
  }`

  const code2 = `async ({ deep, require, data: { oldLink, newLink, triggeredByLinkId } }) => {
    const loadBotToken = async () => {
      const containTreeId = await deep.id('@deep-foundation/core', 'containTree');
      const tokenTypeId = await deep.id('@romanxz/discord-bot', 'BotToken');
      const { data: [{ value: { value: npmToken = undefined } = {} } = {}] = [] } = await deep.select({
        up: {
          tree_id: { _eq: containTreeId },
          parent: { id: { _eq: triggeredByLinkId } },
          link: { type_id: { _eq: tokenTypeId } }
        }
      });
      return npmToken;
    };
    const Discord = require("discord.js");
    const BOT_TOKEN = await loadBotToken();
  
    const discordClient = new Discord.Client({
      intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMessages],
    });
  
    discordClient.on('ready', () => {
      console.log(\`Logged in as \${discordClient.user.tag}!\`);
    });
  
    discordClient.on(Discord.Events.MessageCreate, async (message) => {
      // Check if the bot is mentioned
      const mentionPrefix = \`<@\${discordClient.user.id}>\`;
      if (message.content.includes(mentionPrefix) && !message.author.bot) {
        // message.channel.send("IIIIIIIIIIIIIIII");
        const messageContent = message.content;
        const channelName = "" + message.channel.id;
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
        const { data: [{ id: messageLinkId }] } = await deep.insert(messageLink);
        await deep.insert({
          type_id: await deep.id("@romanxz/discord-bot", "MessageId"),
          from_id: messageLinkId,
          to_id: messageLinkId,
          number:{
            data:{ value: message.id }
          }
        });
        await deep.insert({
          string: { data: { value: channelName } },
          type_id: await deep.id("@deep-foundation/chatgpt", "Conversation"),
          in: {
            data: [{
              type_id: await deep.id("@deep-foundation/core", "Contain"),
              from_id: await deep.id("deep", "admin"),
            },
            {
              type_id: await deep.id("@deep-foundation/messaging", 'Reply'),
              from_id: messageLinkId,
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
  }`

  const packageTypeLinkId = await deep.id('@deep-foundation/core', "Package")
  const containTypeLinkId = await deep.id("@deep-foundation/core", "Contain")
  const joinTypeLinkId = await deep.id("@deep-foundation/core", "Join")
  const typeTypeLinkId = await deep.id("@deep-foundation/core", "Type")
  const anyTypeLinkId = await deep.id("@deep-foundation/core", "Any")
  const valueTypeLinkId = await deep.id('@deep-foundation/core', 'Value');
  const stringTypeLinkId = await deep.id('@deep-foundation/core', 'String');
  const numberTypeLinkId = await deep.id('@deep-foundation/core', 'Number');
  const objectTypeLinkId = await deep.id('@deep-foundation/core', 'Object');

  const { data: [{ id: packageLinkId }] } = await deep.insert({
    type_id: packageTypeLinkId,
    string: { data: { value: PACKAGE_NAME } },
    in: {
      data: [{
        type_id: containTypeLinkId,
        from_id: 376,
      }]
    },
    out: {
      data: [{
        type_id: joinTypeLinkId,
        to_id: await deep.id('deep', 'users', 'packages')
      }, {
        type_id: joinTypeLinkId,
        to_id: await deep.id('deep', 'admin')
      }]
    },
  })

  // await deep.insert(PACKAGE_TYPES.map((TYPE) => ({
  //   type_id: typeTypeLinkId,
  //   in: {
  //     data: [{
  //       type_id: containTypeLinkId,
  //       from_id: packageLinkId,
  //       string: { data: { value: TYPE } },
  //     }]
  //   }
  // })));

  await deep.insert({
    type_id: typeTypeLinkId,
    in: {
      data: [{
        type_id: containTypeLinkId,
        from_id: packageLinkId,
        string: { data: { value: "BotToken" } },
      }]
    },
    out: {
      data: [{
        type_id: valueTypeLinkId,
        to_id: stringTypeLinkId,
        in: {
          data: [{
            type_id: containTypeLinkId,
            from_id: packageLinkId,
            string: { data: { value: "TOKEN" } },
          }]
        },
      }]
    }
  })

  await deep.insert({
    type_id: typeTypeLinkId,
    from_id: anyTypeLinkId,
    to_id: anyTypeLinkId,
    in: {
      data: [{
        type_id: containTypeLinkId,
        from_id: packageLinkId,
        string: { data: { value: "ActivateBot" } },
      }]
    }
  });

  await deep.insert({
    type_id: typeTypeLinkId,
    from_id: await deep.id("@deep-foundation/messaging", "Message"),
    to_id: await deep.id("@deep-foundation/messaging", "Message"),
    in: {
      data: [{
        type_id: containTypeLinkId,
        from_id: packageLinkId,
        string: { data: { value: "MessageId" } },
      }]
    },
    out: {
      data: [{
        type_id: valueTypeLinkId,
        to_id: numberTypeLinkId,
        in: {
          data: [{
            type_id: containTypeLinkId,
            from_id: packageLinkId,
            string: { data: { value: "ID" } },
          }]
        },
      }]
    }
  });

  const syncTextFileTypeLinkId = await deep.id("@deep-foundation/core", "SyncTextFile")
  const supportsJsLinkId = await deep.id("@deep-foundation/core", "dockerSupportsJs" /* | "plv8SupportsJs" */)
  const handlerTypeLinkId = await deep.id("@deep-foundation/core", "Handler")
  const handleOperationLinkId = await deep.id("@deep-foundation/core", "HandleInsert" /* | HandleUpdate | HandleDelete */);
  const triggerTypeLinkId = await deep.id("@deep-foundation/messaging", 'Reply');
  const trigger2TypeLinkId = await deep.id(PACKAGE_NAME, 'ActivateBot');
  const reservedIds = await deep.reserve(4);
  const syncTextFileLinkId = reservedIds.pop();
  const handlerLinkId = reservedIds.pop();

  await deep.serial({
    operations: [
      createSerialOperation({
        table: 'links',
        type: 'insert',
        objects:
        {
          id: syncTextFileLinkId,
          type_id: syncTextFileTypeLinkId,
          in: {
            data: {
              type_id: containTypeLinkId,
              from_id: packageLinkId,
              string: { data: { value: "BotReplyToServer" } },
            }
          }
        }
      }),
      createSerialOperation({
        table: 'strings',
        type: 'insert',
        objects: {
          link_id: syncTextFileLinkId,
          value: code
        }
      }),
      createSerialOperation({
        table: 'links',
        type: 'insert',
        objects: {
          id: handlerLinkId,
          type_id: handlerTypeLinkId,
          from_id: supportsJsLinkId,
          to_id: syncTextFileLinkId,
          in: {
            data: {
              type_id: containTypeLinkId,
              from_id: packageLinkId,
              string: { data: { value: "BotReplyHandler" } },
            }
          }
        }
      }),
      createSerialOperation({
        table: 'links',
        type: 'insert',
        objects: {
          type_id: handleOperationLinkId,
          from_id: triggerTypeLinkId,
          to_id: handlerLinkId,
          in: {
            data: {
              type_id: containTypeLinkId,
              from_id: packageLinkId,
              string: { data: { value: "HandleReply" } },
            }
          }
        }
      }),
    ]
  })

  const syncTextFile2LinkId = reservedIds.pop();
  const handler2LinkId = reservedIds.pop();

  await deep.serial({
    operations: [
      createSerialOperation({
        table: 'links',
        type: 'insert',
        objects:
        {
          id: syncTextFile2LinkId,
          type_id: syncTextFileTypeLinkId,
          in: {
            data: {
              type_id: containTypeLinkId,
              from_id: packageLinkId,
              string: { data: { value: "BotListen" } },
            }
          }
        }
      }),
      createSerialOperation({
        table: 'strings',
        type: 'insert',
        objects: {
          link_id: syncTextFile2LinkId,
          value: code2
        }
      }),
      createSerialOperation({
        table: 'links',
        type: 'insert',
        objects: {
          id: handler2LinkId,
          type_id: handlerTypeLinkId,
          from_id: supportsJsLinkId,
          to_id: syncTextFile2LinkId,
          in: {
            data: {
              type_id: containTypeLinkId,
              from_id: packageLinkId,
              string: { data: { value: "BotListenHandler" } },
            }
          }
        }
      }),
      createSerialOperation({
        table: 'links',
        type: 'insert',
        objects: {
          type_id: handleOperationLinkId,
          from_id: trigger2TypeLinkId,
          to_id: handler2LinkId,
          in: {
            data: {
              type_id: containTypeLinkId,
              from_id: packageLinkId,
              string: { data: { value: "HandleListen" } },
            }
          }
        }
      }),
    ]
  })
}

installPackage();