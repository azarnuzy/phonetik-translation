FROM node:latest

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/ui/package.json ./packages/ui/

RUN pnpm install

COPY . .

WORKDIR /app/packages/ui
RUN pnpm build

WORKDIR /app/apps/admin
RUN pnpm build

EXPOSE 4000

CMD ["pnpm", "preview", "--port", "4000", "--host"]
