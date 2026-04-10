const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../app/config.ts');
const isPreview = process.argv.includes('--channel=preview');

fs.readFile(configPath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading config file:', err);
        return;
    }

    const newIdentifier = isPreview ? 'com.treasapp.treasapp' : 'com.treasapp.treas22';
    const updatedData = data.replace(/app_identifier: '.*?'/, `app_identifier: '${newIdentifier}'`);

    const newIcon = isPreview ? './assets/images/logo-Preview.png' : './assets/images/logo1024x1024.png';
    const updatedDataIcon = data.replace(/icon_app: '.*?'/, `icon_app: '${newIcon}'`);

    const newIdentifierIOS = isPreview ? 'com.treasapp' : 'com.treasapp.treas24';
    const updatedDataIOS = data.replace(/app_identifier_ios: '.*?'/, `app_identifier_ios: '${newIdentifier}'`);


    fs.writeFile(configPath, updatedData, 'utf8', (err) => {
        if (err) {
            console.error('Error writing config file:', err);
            return;
        }
        console.log(`Updated app_identifier to: ${newIdentifier}`);
    });

    fs.writeFile(configPath, updatedDataIOS, 'utf8', (err) => {
        if (err) {
            console.error('Error writing config file:', err);
            return;
        }
        console.log(`Updated app_identifier to: ${newIdentifierIOS}`);
    });

    fs.writeFile(configPath, updatedDataIcon, 'utf8', (err) => {
        if (err) {
            console.error('Error writing config file:', err);
            return;
        }
        console.log(`Updated icon_app to: ${newIcon}`);
    });
});