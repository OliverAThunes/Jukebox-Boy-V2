#!/bin/sh
echo "Updating bot"
git pull
npm i
sleep 1
echo "Deploying commands"
node deploy-commands.js
echo "Running bot"
sleep 2
clear
node index.js


