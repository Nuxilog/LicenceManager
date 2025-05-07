require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkApiTable() {
  let connection;
  try {
    console.log('Connecting to MySQL database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Connected to MySQL database');
    
    // Check if API table exists
    const [tables] = await connection.query('SHOW TABLES LIKE ?', ['API']);
    
    if (tables.length > 0) {
      console.log('API table exists, getting structure...');
      const [columns] = await connection.query('DESCRIBE API');
      console.log('API table structure:');
      console.log(JSON.stringify(columns, null, 2));
    } else {
      console.log('API table does not exist. Checking all tables...');
      const [allTables] = await connection.query('SHOW TABLES');
      console.log('Available tables:');
      console.log(JSON.stringify(allTables, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkApiTable();