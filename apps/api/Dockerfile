FROM node:20-alpine
WORKDIR /app

# Copy only API app files
COPY package.json package-lock.json* ./
COPY . .

RUN npm install
RUN npm run build

EXPOSE 8000
CMD ["npm", "run", "serve"]