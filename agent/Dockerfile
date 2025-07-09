FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install --only=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

CMD ["npm", "start"] 