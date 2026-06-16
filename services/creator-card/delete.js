/* eslint-disable camelcase */
const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const creatorCardMessages = require('@app/messages').CreatorCardMessages;
const creatorCardRepo = require('@app/repository/creator-card');
const { serializeCard } = require('./helpers');

const deleteSpec = `root {
  creator_reference string<length:20>
}`;

const parsedDeleteSpec = validator.parse(deleteSpec);

async function deleteCreatorCard({ slug, creator_reference }) {
  validator.validate({ creator_reference }, parsedDeleteSpec);

  const card = await creatorCardRepo.findOne({ query: { slug, creator_reference } });

  if (!card) {
    throwAppError(creatorCardMessages.CARD_NOT_FOUND, 'NF01');
  }

  const deletedAt = Date.now();

  await creatorCardRepo.updateOne({
    query: { _id: card._id },
    updateValues: { deleted: deletedAt },
  });

  return serializeCard({ ...card, deleted: deletedAt }, { includeAccessCode: true });
}

module.exports = deleteCreatorCard;
