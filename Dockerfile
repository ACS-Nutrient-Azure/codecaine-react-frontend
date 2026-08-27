FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_ENTRA_CLIENT_ID=dummy_client
ARG VITE_ENTRA_AUTHORITY=https://dummy.ciamlogin.com/dummy
ENV VITE_ENTRA_CLIENT_ID=$VITE_ENTRA_CLIENT_ID
ENV VITE_ENTRA_AUTHORITY=$VITE_ENTRA_AUTHORITY

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_ENTRA_CLIENT_ID
ARG VITE_ENTRA_AUTHORITY
ENV VITE_ENTRA_CLIENT_ID=$VITE_ENTRA_CLIENT_ID
ENV VITE_ENTRA_AUTHORITY=$VITE_ENTRA_AUTHORITY

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
