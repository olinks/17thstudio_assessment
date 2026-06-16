function serializeCard(card, opts = {}) {
  const obj = { ...card, id: card._id };
  delete obj._id;
  delete obj.__v;
  if (!opts.includeAccessCode) delete obj.access_code;
  // DB stores 0 as "not deleted" sentinel for paranoid queries; API surfaces null
  if (obj.deleted === 0) obj.deleted = null;
  return obj;
}

module.exports = { serializeCard };
