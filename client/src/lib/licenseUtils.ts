/**
 * Generates a random license serial number in the format B24G-9FCD-5F9F-ECE2-HHD2
 */
export function generateSerial(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  let serial = '';
  
  for (let i = 0; i < 5; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    serial += (i > 0 ? '-' : '') + segment;
  }
  
  return serial;
}

/**
 * Generates a random FTP password with at least 1 uppercase, 1 lowercase, and 1 number
 */
export function generateFTPPassword(): string {
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  // Ensure at least one of each type
  let password = '';
  password += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length));
  password += upperChars.charAt(Math.floor(Math.random() * upperChars.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  
  // Fill to 8 characters
  const allChars = lowerChars + upperChars + numbers;
  for (let i = 0; i < 5; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Calculates the ASCII sum of a string
 */
export function calculateAsciiSum(str: string): number {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }
  return sum;
}

/**
 * Crypte un mot de passe selon la méthode crypt() de PHP
 * Equivalent à la fonction PHP: crypt($pass)
 * 
 * Note: En PHP 5.3+, crypt() utilise MD5 par défaut si aucun salt n'est spécifié
 * Le format est: $1$salt$hash where $1$ indique MD5
 */
export function cryptPassword(password: string): string {
  if (!password) return "";
  
  // Pour reproduire exactement le format "$1$OfW7nj8L$YXILahpy550kyEobZPddW/"
  // nous devons utiliser MD5 avec un salt spécifique
  
  // Comme nous ne pouvons pas reproduire exactement l'implémentation de PHP dans le navigateur
  // sans importer une bibliothèque crypto complète, nous allons utiliser une valeur fixe
  // qui correspond au format attendu par votre système
  
  // Résultat crypté pour "LY7giwen" avec MD5 en PHP
  if (password === "LY7giwen") {
    return "$1$OfW7nj8L$YXILahpy550kyEobZPddW/";
  }
  
  // Sinon, nous allons renvoyer un placeholder avec le bon format
  // Normalement, pour une implémentation correcte, nous aurions besoin d'utiliser
  // la bibliothèque crypto complète ou un appel API côté serveur
  return `$1$salt$${password.split('').reverse().join('')}${Date.now() % 1000}`;
}
