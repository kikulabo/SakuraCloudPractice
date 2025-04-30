#!/bin/bash

if [ ! -z "$MACKEREL_APIKEY" ]; then
    echo "Initializing Mackerel agent..."
    mackerel-agent init -apikey=$MACKEREL_APIKEY
    echo 'display_name = "my-app-kikulabo"' >> /etc/mackerel-agent/mackerel-agent.conf
    mackerel-agent -conf /etc/mackerel-agent/mackerel-agent.conf &
    echo "Mackerel agent started"
fi

echo "Starting application..."
node dist/app.js 
