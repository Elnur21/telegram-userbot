const { Api } = require("telegram");
const { NewMessage } = require("telegram/events");
const { validation, languageManager } = require("../../utils");
const { _parseMessageText } = require("telegram/client/messageParse");

const restriction = async (event) => {
  const { client, message } = event;

  let editMessage = new Api.messages.EditMessage({
    id: message.id,
    message: "",
    peer: message.peerId,
  });

  let isSupergroup = await validation.supergroup(client, message, editMessage);
  if (!isSupergroup) return;

  let isAdmin = await validation.admin(client, message.peerId, editMessage);
  if (!isAdmin) return;

  let [_, action, participant] = message.patternMatch;

  let target = participant;

  if (message.replyTo) {
    let replied = await message.getReplyMessage();
    participant = replied.fromId;

    let sender = await replied.getSender();
    target = sender?.username ? "@" + sender.username : sender.firstName;
  }

  let userId = message.peerId?.userId || message.fromId?.userId;
  if (!participant) {
    if (!userId) return;
    let text = languageManager.getText(userId, "restrictions.help");

    let [resText, entities] = await _parseMessageText(client, text, "html");
    editMessage.message = resText;
    editMessage.entities = entities;

    return await client.invoke(editMessage);
  }

  if (typeof participant === "string") {
    let expression = /^\d+$/;
    if (!participant.match(expression) && !participant.startsWith("@")) {
      participant = "@" + participant;
    }
  }

  let getParticipant = new Api.channels.GetParticipant({
    participant,
    channel: message.peerId,
  });

  let participantInfo;
  try {
    participantInfo = await client.invoke(getParticipant);
  } catch (err) {
    if (err.errorMessage !== "USER_NOT_PARTICIPANT") {
      editMessage.message = err.message;
      return await client.invoke(editMessage);
    }
  }

  if (
    action !== "unban" &&
    (!participantInfo || participantInfo.participant.left)
  ) {
    editMessage.message = languageManager.getText(
      userId,
      "restrictions.not_found_in_group",
      { target }
    );
    return await client.invoke(editMessage);
  }

  let isTargetAdmin = participantInfo?.participant?.adminRights;

  if (isTargetAdmin) {
    editMessage.message = languageManager.getText(
      userId,
      "restrictions.target_is_admin",
      { action }
    );

    return await client.invoke(editMessage);
  }

  let options;
  let perform;

  switch (action) {
    case "mute":
      perform = languageManager.getText(userId, "restrictions.muted");
      options = { sendMessages: true };
      break;
    case "unmute":
      perform = languageManager.getText(userId, "restrictions.can_speak");
      options = { sendMessages: false };
      break;
    case "ban":
      perform = languageManager.getText(userId, "restrictions.banned");
      options = { viewMessages: true, untilDate: 0 };
      break;
    case "unban":
      perform = languageManager.getText(userId, "restrictions.ban_lifted");
      options = { viewMessages: false };
      break;
    default:
      perform = languageManager.getText(userId, "restrictions.kicked");
      options = { viewMessages: true, untilDate: 0 };
      break;
  }

  let responses = `${target} ${perform}!`;
  let editBanned = new Api.channels.EditBanned({
    channel: message.peerId,
    participant,
    bannedRights: new Api.ChatBannedRights(options),
  });

  try {
    await client.invoke(editBanned);
    if (action === "kick") {
      editBanned.bannedRights.viewMessages = false;
      await client.invoke(editBanned);
    }
  } catch (err) {
    responses = err.message;
  } finally {
    editMessage.message = responses;
    await client.invoke(editMessage);
  }
};

module.exports = {
  handler: restriction,
  event: new NewMessage({
    fromUsers: ["me"],
    pattern: /^\.(mute|unmute|ban|unban|kick)\s*(@?\w*|\d*)$/,
  }),
};
