const fs = require('fs');
const path = require('path');

// Función para limpiar caracteres corruptos
function cleanCorruptedChars(content) {
  // Caracteres corruptos comunes y sus reemplazos
  const replacements = {
    '▓': 'í', // Carácter corrupto común
    'ð': 'd',
    'ò': 'o',
    'Ò': 'O',
    'ù': 'u',
    'Ù': 'U',
    'û': 'u',
    'Û': 'U',
    'ü': 'ü', // mantener umlauts válidos
    'Ü': 'Ü',
    'ÿ': 'y',
    'Ÿ': 'Y',
    'ž': 'z',
    'Ž': 'Z',
    'ß': 'ss',
  };

  let cleaned = content;
  
  // Aplicar reemplazos específicos
  Object.entries(replacements).forEach(([corrupt, fix]) => {
    cleaned = cleaned.split(corrupt).join(fix);
  });

  // Arreglos específicos conocidos
  cleaned = cleaned.replace(/m[\s]*étodos/gi, 'métodos');
  cleaned = cleaned.replace(/Informaci[\s]*ón/gi, 'Información');
  cleaned = cleaned.replace(/veh[\s]*ículo/gi, 'vehículo');
  cleaned = cleaned.replace(/Veh[\s]*ículo/gi, 'Vehículo');
  cleaned = cleaned.replace(/aqu[\s]*í/gi, 'aquí');
  
  return cleaned;
}

// Limpiar archivos principales
const filesToClean = [
  'app/(tabs)/index.tsx',
  'app/(tabs)/WalletDetails.tsx',
  'components/TabNavigator.tsx',
];

filesToClean.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      const cleaned = cleanCorruptedChars(content);
      
      if (content !== cleaned) {
        fs.writeFileSync(file, cleaned, 'utf8');
        console.log(`✓ Limpiado: ${file}`);
      }
    }
  } catch (err) {
    console.error(`✗ Error limpiando ${file}:`, err.message);
  }
});

console.log('✅ Limpieza completa de caracteres corruptos');
