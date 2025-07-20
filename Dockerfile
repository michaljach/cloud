FROM node:22-alpine
WORKDIR /repo
COPY package.json ./
RUN npm install
COPY . .
RUN cd apps/account && npm install
RUN cd apps/dashboard && npm install
RUN cd apps/api && npm install
RUN cd apps/api && npm run prisma:generate
ARG APP
ENV APP=$APP
CMD ["sh", "-c", "npx turbo run dev --filter=$APP"]
