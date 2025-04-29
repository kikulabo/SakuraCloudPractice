FROM node:20-slim

RUN apt-get update && \
    apt-get install -y wget sudo && \
    wget -q -O - https://mackerel.io/file/script/setup-apt-v2.sh | sh && \
    apt-get install -y mackerel-agent

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080

COPY entry.sh /app/entry.sh
RUN chmod +x /app/entry.sh

CMD ["/app/entry.sh"]
