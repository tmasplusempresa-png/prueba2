const fs = require('fs');

// Arreglar todos los caracteres corruptos (▓ que debería ser í, é, á, etc.)
const files = [
  'app/(tabs)/index.tsx',
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Reemplazar caracteres corruptos
  content = content.replace(/m▓todos/g, 'métodos');
  content = content.replace(/Informaci▓n/g, 'Información');
  content = content.replace(/aqu▓/g, 'aquí');
  content = content.replace(/veh▓culo/g, 'vehículo');
  content = content.replace(/Veh▓culo/g, 'Vehículo');
  content = content.replace(/Anima▓/g, 'Animación');
  content = content.replace(/m▓nsaje/g, 'mensaje');
  content = content.replace(/M▓todo/g, 'Método');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`✓ Arreglado: ${file}`);
});

console.log('✅ Todos los caracteres corruptos han sido arreglados');
