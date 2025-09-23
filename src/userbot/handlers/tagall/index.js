const { NewMessage } = require("telegram/events");

const tagall = {
  name: "tagall",
  command: ".tagall",
  description: "Tag all members in the group",

  async handler(event) {
    try {
      const message = event.message?.message;

      if (message !== tagall.command) return;

      const chat = await event.message.getChat();
      const participants = await event.client.getParticipants(chat);

      let mentions = participants.map((user) =>
        user.username
          ? `@${user?.username}`
          : `<a href="tg://user?id=${user?.id}">${
              user?.firstName || "User"
            }</a>`
      );

      const chunkSize = 1;
      for (let i = 0; i < mentions.length; i += chunkSize) {
        const chunk = mentions.slice(i, i + chunkSize).join(" ");
        await event.client.sendMessage(chat, {
          message: chunk,
          parseMode: "html",
        });
      }
    } catch (error) {
      console.error("Error in tagall handler:", error);
    }
  },

  event: new NewMessage({}),
};

module.exports = tagall;
