/* eslint-disable camelcase */
const { throwAppError } = require('@app-core/errors');
const creatorCardMessages = require('@app/messages').CreatorCardMessages;
const creatorCardRepo = require('@app/repository/creator-card');
const { serializeCard } = require('./helpers');

async function getCreatorCard({ slug, access_code }) {
  const card = await creatorCardRepo.findOne({ query: { slug } });

  if (!card) {
    throwAppError(creatorCardMessages.CARD_NOT_FOUND, 'NF01');
  }

  if (card.status === 'draft') {
    throwAppError(creatorCardMessages.CARD_IS_DRAFT, 'NF02');
  }

  if (card.access_type === 'private') {
    if (!access_code) {
      throwAppError(creatorCardMessages.PRIVATE_NO_CODE, 'AC03');
    }
    if (access_code !== card.access_code) {
      throwAppError(creatorCardMessages.PRIVATE_WRONG_CODE, 'AC04');
    }
  }

  return serializeCard(card);
}

module.exports = getCreatorCard;
