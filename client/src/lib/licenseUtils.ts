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
