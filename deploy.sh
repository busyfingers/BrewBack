# Clean deploy dir
rm -r deploy/BrewBack

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
cp -r dist/bin deploy/BrewBack
cp -r dist/config/config.js deploy/BrewBack/config
cp -r dist/database deploy/BrewBack
cp -r dist/helpers deploy/BrewBack
cp -r dist/models deploy/BrewBack
cp -r dist/routes deploy/BrewBack
cp -r dist/app.js deploy/BrewBack
cp -r package*.json deploy/BrewBack

# Copy files to server
scp -r deploy/BrewBack 192.168.1.249:/home/niklas
# Install packages
ssh 192.168.1.249 npm install --prefix /home/niklas/BrewBack