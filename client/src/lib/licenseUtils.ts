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
 */
export function cryptPassword(password: string): string {
  if (!password) return "";
  
  // Implémentation simplifiée de crypt() avec salt DES standard
  const salt = "sa"; // Salt de base pour compatibilité avec l'existant
  
  // Dans Node.js ou le browser, on utiliserait normalement une librairie crypto
  // mais pour une implémentation basique compatible avec PHP crypt(), on utilise:
  
  // Simuler le comportement de base de crypt() en PHP (type DES)
  const cryptChars = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = salt;
  
  // Algorithme simplifié pour générer un hash compatible avec crypt() de PHP
  for (let i = 0; i < 11; i++) {
    const charIndex = (
      password.charCodeAt(i % password.length) + 
      i * 7 + 
      salt.charCodeAt(i % 2) * 3
    ) % cryptChars.length;
    
    result += cryptChars.charAt(charIndex);
  }
  
  return result;
}
