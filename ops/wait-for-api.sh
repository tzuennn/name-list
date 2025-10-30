#!/bin/bash

# Wait for API to be ready and responding
# Usage: ./ops/wait-for-api.sh

MAX_ATTEMPTS=50
ATTEMPT=0

echo "Waiting for API to be ready..."

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -f -s http://localhost/api/names > /dev/null 2>&1; then
        echo "✅ API is ready!"
        exit 0
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 1
done

echo ""
echo "❌ API did not become ready after $MAX_ATTEMPTS seconds"
exit 1
