FROM node:22-alpine

WORKDIR /app

# Install deps first (layer cached unless package.json changes)
COPY package.json package-lock.json* ./

# Copy local packages before npm install so file: links resolve
COPY core ./core
COPY messages ./messages
COPY middlewares ./middlewares
COPY models ./models
COPY mock-models ./mock-models
COPY notification ./notification
COPY repository ./repository
COPY services ./services
COPY workers ./workers

RUN npm pkg delete scripts.prepare && npm install --omit=dev

# Copy remaining app source
COPY . .

EXPOSE 3000

CMD ["node", "bootstrap.js"]
