#!/bin/bash
set -e
source .env

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use
npm run build

rsync -avz --delete build/ $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_DIR