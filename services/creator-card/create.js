/* eslint-disable camelcase */
const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const { randomBytes } = require('@app-core/randomness');
const creatorCardMessages = require('@app/messages').CreatorCardMessages;
const creatorCardRepo = require('@app/repository/creator-card');
const { serializeCard } = require('./helpers');

const createSpec = `root {
  title string<minLength:3|maxLength:100>
  description? string
  slug? string<minLength:5|maxLength:50>
  creator_reference string<length:20>
  links[]? {
    title string
    url string
  }
  service_rates? object
  status string(draft|published)
  access_type string(public|private)
  access_code? string<length:6>
}`;

const parsedCreateSpec = validator.parse(createSpec);

function isAlphanumeric(str) {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (
      !((code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122))
    ) {
      return false;
    }
  }
  return true;
}

function isValidSlugChar(code, ch) {
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    ch === '-' ||
    ch === '_'
  );
}

function isValidSlug(slug) {
  for (let i = 0; i < slug.length; i++) {
    if (!isValidSlugChar(slug.charCodeAt(i), slug[i])) return false;
  }
  return true;
}

function generateSlugFromTitle(title) {
  const lower = title.toLowerCase();
  let slug = '';
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    const code = lower.charCodeAt(i);
    if ((code >= 97 && code <= 122) || (code >= 48 && code <= 57) || ch === '_') {
      slug += ch;
    } else if (ch === ' ' || ch === '-') {
      slug += '-';
    }
  }
  return slug;
}

async function createCreatorCard(payload) {
  const validated = validator.validate(payload, parsedCreateSpec);

  const {
    title,
    description,
    slug: providedSlug,
    creator_reference,
    links,
    service_rates,
    status,
    access_type,
    access_code,
  } = validated;

  if (access_type === 'private' && !access_code) {
    throwAppError(creatorCardMessages.MISSING_ACCESS_CODE, 'AC01');
  }

  if (access_type === 'public' && access_code) {
    throwAppError(creatorCardMessages.UNEXPECTED_ACCESS_CODE, 'AC05');
  }

  if (access_code && !isAlphanumeric(access_code)) {
    throwAppError(creatorCardMessages.INVALID_ACCESS_CODE_FORMAT, 'AC01');
  }

  let slug;

  if (providedSlug) {
    if (!isValidSlug(providedSlug)) {
      throwAppError(creatorCardMessages.INVALID_SLUG_FORMAT, 'SL02');
    }
    const existing = await creatorCardRepo.findOne({ query: { slug: providedSlug } });
    if (existing) {
      throwAppError(creatorCardMessages.DUPLICATE_SLUG, 'SL02');
    }
    slug = providedSlug;
  } else {
    const baseSlug = generateSlugFromTitle(title);
    const existing = await creatorCardRepo.findOne({ query: { slug: baseSlug } });
    if (existing) {
      slug = `${baseSlug}-${randomBytes(6)}`;
    } else {
      slug = baseSlug;
    }
  }

  const cardData = {
    title,
    description: description || null,
    slug,
    creator_reference,
    links: links || [],
    service_rates: service_rates || null,
    status,
    access_type,
    deleted: 0,
  };

  if (access_code) {
    cardData.access_code = access_code;
  }

  const created = await creatorCardRepo.create(cardData);

  return serializeCard(created, { includeAccessCode: true });
}

module.exports = createCreatorCard;
