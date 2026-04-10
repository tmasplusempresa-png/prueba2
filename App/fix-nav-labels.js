const fs = require('fs');

const filePath = 'app/(tabs)/index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix corrupted "Vehículo" text - remove any unicode corruption
content = content.replace(/Veh.?culo/g, 'Vehiculo');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Fixed vehicle text in driver navigation bar');
