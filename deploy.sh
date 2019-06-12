# Make sure necessary folders exist
if [ ! -d "deploy" ]
then
    mkdir deploy
fi

if [ ! -d "deploy/BrewBack" ]
then
    mkdir deploy/BrewBack
fi

if [ ! -d "deploy/BrewBack/config" ]
then
    mkdir deploy/BrewBack/config
fi

# Copy files to deploy folder
cp -r bin deploy/BrewBack
cp -r config/config.js deploy/BrewBack/config
cp -r database deploy/BrewBack
cp -r helpers deploy/BrewBack
cp -r models deploy/BrewBack
cp -r routes deploy/BrewBack
cp -r app.js deploy/BrewBack
cp -r package*.json deploy/BrewBack

# Copy files to server
scp -r deploy/BrewBack 192.168.1.249:/home/niklas
# Install packages
ssh 192.168.1.249 npm install --prefix /home/niklas/BrewBack