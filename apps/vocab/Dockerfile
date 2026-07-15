FROM node:latest

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/vocab/package.json ./apps/vocab/
COPY packages/ui/package.json ./packages/ui/

RUN pnpm install

COPY . .

WORKDIR /app/packages/ui
RUN pnpm build

WORKDIR /app/apps/vocab
RUN pnpm build

EXPOSE 3001

CMD ["pnpm", "preview", "--port", "3001", "--host"]
