/**
 * Database Configuration
 * This file handles connecting to the PostgreSQL database and defines the schema
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Create a database connection pool using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection and initialize if needed
const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_login TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS nodes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        hostname VARCHAR(100) NOT NULL,
        username VARCHAR(100) NOT NULL,
        password VARCHAR(100) NOT NULL,
        port INTEGER DEFAULT 8006,
        ssl_verify BOOLEAN DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_seen TIMESTAMP,
        node_status VARCHAR(20) DEFAULT 'unknown'
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(50) UNIQUE NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS vm_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        profile_type VARCHAR(20) NOT NULL,
        cores INTEGER NOT NULL,
        memory INTEGER NOT NULL,
        disk INTEGER NOT NULL,
        template_description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS lxc_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        profile_type VARCHAR(20) NOT NULL,
        cores INTEGER NOT NULL,
        memory INTEGER NOT NULL,
        swap INTEGER NOT NULL,
        disk INTEGER NOT NULL,
        template_description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Check if admin user exists, create if it doesn't
    const adminCheck = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await client.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
        ['admin', hashedPassword, 'admin']
      );
      console.log('Admin user created');
    }

    // Insert default VM templates if they don't exist
    const vmTemplateCheck = await client.query('SELECT * FROM vm_templates');
    if (vmTemplateCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO vm_templates (name, profile_type, cores, memory, disk, template_description) VALUES
        ('Minimal', 'minimal', 1, 1024, 10, 'Minimal resources suitable for small services'),
        ('Small', 'small', 1, 2048, 20, 'Small VM suitable for basic workloads'),
        ('Medium', 'medium', 2, 4096, 40, 'Medium resources suitable for most applications'),
        ('Large', 'large', 4, 8192, 80, 'Large resources for demanding applications'),
        ('Extra Large', 'xlarge', 8, 16384, 160, 'Extra large resources for intensive workloads')
      `);
      console.log('Default VM templates created');
    }

    // Insert default LXC templates if they don't exist
    const lxcTemplateCheck = await client.query('SELECT * FROM lxc_templates');
    if (lxcTemplateCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO lxc_templates (name, profile_type, cores, memory, swap, disk, template_description) VALUES
        ('Micro', 'micro', 1, 256, 0, 4, 'Micro resources for minimal containers'),
        ('Minimal', 'minimal', 1, 512, 0, 8, 'Minimal resources for basic containers'),
        ('Small', 'small', 1, 1024, 512, 10, 'Small resources for lightweight services'),
        ('Medium', 'medium', 2, 2048, 1024, 20, 'Medium resources for standard applications'),
        ('Large', 'large', 4, 4096, 2048, 40, 'Large resources for demanding services')
      `);
      console.log('Default LXC templates created');
    }

    // Insert default settings if they don't exist
    const settingsCheck = await client.query('SELECT * FROM settings');
    if (settingsCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO settings (setting_key, setting_value) VALUES
        ('theme', 'dark'),
        ('session_timeout', '30'),
        ('default_node', ''),
        ('refresh_interval', '10'),
        ('log_level', 'info'),
        ('allow_registration', 'false'),
        ('email_notifications', 'false'),
        ('smtp_server', ''),
        ('smtp_port', '587'),
        ('smtp_user', ''),
        ('smtp_password', ''),
        ('smtp_from', '')
      `);
      console.log('Default settings created');
    }

    client.release();
    console.log('Database initialization complete');
    return true;
  } catch (err) {
    console.error('Database initialization failed', err);
    return false;
  }
};

// Database operations for users
const userDB = {
  // Get all users
  getAllUsers: async () => {
    try {
      const result = await pool.query('SELECT id, username, email, role, created_at, last_login FROM users');
      return result.rows;
    } catch (err) {
      console.error('Error getting all users', err);
      throw err;
    }
  },
  
  // Get user by ID
  getUserById: async (id) => {
    try {
      const result = await pool.query('SELECT id, username, email, role, created_at, last_login FROM users WHERE id = $1', [id]);
      return result.rows[0];
    } catch (err) {
      console.error('Error getting user by ID', err);
      throw err;
    }
  },
  
  // Get user by username
  getUserByUsername: async (username) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      return result.rows[0];
    } catch (err) {
      console.error('Error getting user by username', err);
      throw err;
    }
  },
  
  // Create new user
  createUser: async (username, password, email, role = 'user') => {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
        [username, hashedPassword, email, role]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error creating user', err);
      throw err;
    }
  },
  
  // Update user
  updateUser: async (id, userData) => {
    try {
      const updates = [];
      const values = [];
      let counter = 1;
      
      // Build dynamic update query
      for (const [key, value] of Object.entries(userData)) {
        if (key !== 'id' && key !== 'password') {
          updates.push(`${key} = $${counter}`);
          values.push(value);
          counter++;
        }
      }
      
      // Handle password separately if provided
      if (userData.password) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        updates.push(`password = $${counter}`);
        values.push(hashedPassword);
        counter++;
      }
      
      // Add ID as the last parameter
      values.push(id);
      
      // Execute update query
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${counter} RETURNING id, username, email, role`;
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (err) {
      console.error('Error updating user', err);
      throw err;
    }
  },
  
  // Delete user
  deleteUser: async (id) => {
    try {
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
      return true;
    } catch (err) {
      console.error('Error deleting user', err);
      throw err;
    }
  },
  
  // Authenticate user
  authenticateUser: async (username, password) => {
    try {
      const user = await userDB.getUserByUsername(username);
      if (!user) return null;
      
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) return null;
      
      // Update last login time
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };
    } catch (err) {
      console.error('Error authenticating user', err);
      throw err;
    }
  }
};

// Database operations for nodes
const nodeDB = {
  // Get all nodes
  getAllNodes: async () => {
    try {
      const result = await pool.query('SELECT * FROM nodes ORDER BY name');
      return result.rows;
    } catch (err) {
      console.error('Error getting all nodes', err);
      throw err;
    }
  },
  
  // Get node by ID
  getNodeById: async (id) => {
    try {
      const result = await pool.query('SELECT * FROM nodes WHERE id = $1', [id]);
      return result.rows[0];
    } catch (err) {
      console.error('Error getting node by ID', err);
      throw err;
    }
  },
  
  // Create new node
  createNode: async (nodeData) => {
    try {
      const { name, hostname, username, password, port = 8006, ssl_verify = true } = nodeData;
      const result = await pool.query(
        'INSERT INTO nodes (name, hostname, username, password, port, ssl_verify) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, hostname, username, password, port, ssl_verify]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error creating node', err);
      throw err;
    }
  },
  
  // Update node
  updateNode: async (id, nodeData) => {
    try {
      const updates = [];
      const values = [];
      let counter = 1;
      
      // Build dynamic update query
      for (const [key, value] of Object.entries(nodeData)) {
        if (key !== 'id') {
          updates.push(`${key} = $${counter}`);
          values.push(value);
          counter++;
        }
      }
      
      // Add ID as the last parameter
      values.push(id);
      
      // Execute update query
      const query = `UPDATE nodes SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${counter} RETURNING *`;
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (err) {
      console.error('Error updating node', err);
      throw err;
    }
  },
  
  // Delete node
  deleteNode: async (id) => {
    try {
      await pool.query('DELETE FROM nodes WHERE id = $1', [id]);
      return true;
    } catch (err) {
      console.error('Error deleting node', err);
      throw err;
    }
  },
  
  // Update node status
  updateNodeStatus: async (id, status) => {
    try {
      await pool.query('UPDATE nodes SET node_status = $1, last_seen = NOW() WHERE id = $2', [status, id]);
      return true;
    } catch (err) {
      console.error('Error updating node status', err);
      throw err;
    }
  }
};

// Database operations for settings
const settingsDB = {
  // Get all settings
  getAllSettings: async () => {
    try {
      const result = await pool.query('SELECT * FROM settings');
      // Convert to key-value object
      const settings = {};
      result.rows.forEach(row => {
        settings[row.setting_key] = row.setting_value;
      });
      return settings;
    } catch (err) {
      console.error('Error getting all settings', err);
      throw err;
    }
  },
  
  // Get setting by key
  getSetting: async (key) => {
    try {
      const result = await pool.query('SELECT setting_value FROM settings WHERE setting_key = $1', [key]);
      return result.rows.length > 0 ? result.rows[0].setting_value : null;
    } catch (err) {
      console.error('Error getting setting by key', err);
      throw err;
    }
  },
  
  // Update setting
  updateSetting: async (key, value) => {
    try {
      await pool.query(
        'UPDATE settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = $2',
        [value, key]
      );
      return true;
    } catch (err) {
      console.error('Error updating setting', err);
      throw err;
    }
  },
  
  // Update multiple settings
  updateSettings: async (settingsObject) => {
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        for (const [key, value] of Object.entries(settingsObject)) {
          await client.query(
            'UPDATE settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = $2',
            [value, key]
          );
        }
        
        await client.query('COMMIT');
        return true;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Error updating multiple settings', err);
      throw err;
    }
  }
};

// Database operations for VM templates
const vmTemplateDB = {
  // Get all VM templates
  getAllVMTemplates: async () => {
    try {
      const result = await pool.query('SELECT * FROM vm_templates ORDER BY cores, memory, disk');
      return result.rows;
    } catch (err) {
      console.error('Error getting all VM templates', err);
      throw err;
    }
  },
  
  // Get VM template by ID
  getVMTemplateById: async (id) => {
    try {
      const result = await pool.query('SELECT * FROM vm_templates WHERE id = $1', [id]);
      return result.rows[0];
    } catch (err) {
      console.error('Error getting VM template by ID', err);
      throw err;
    }
  },
  
  // Create VM template
  createVMTemplate: async (templateData) => {
    try {
      const { name, profile_type, cores, memory, disk, template_description } = templateData;
      const result = await pool.query(
        'INSERT INTO vm_templates (name, profile_type, cores, memory, disk, template_description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, profile_type, cores, memory, disk, template_description]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error creating VM template', err);
      throw err;
    }
  },
  
  // Update VM template
  updateVMTemplate: async (id, templateData) => {
    try {
      const { name, profile_type, cores, memory, disk, template_description } = templateData;
      const result = await pool.query(
        'UPDATE vm_templates SET name = $1, profile_type = $2, cores = $3, memory = $4, disk = $5, template_description = $6 WHERE id = $7 RETURNING *',
        [name, profile_type, cores, memory, disk, template_description, id]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error updating VM template', err);
      throw err;
    }
  },
  
  // Delete VM template
  deleteVMTemplate: async (id) => {
    try {
      await pool.query('DELETE FROM vm_templates WHERE id = $1', [id]);
      return true;
    } catch (err) {
      console.error('Error deleting VM template', err);
      throw err;
    }
  }
};

// Database operations for LXC templates
const lxcTemplateDB = {
  // Get all LXC templates
  getAllLXCTemplates: async () => {
    try {
      const result = await pool.query('SELECT * FROM lxc_templates ORDER BY cores, memory, disk');
      return result.rows;
    } catch (err) {
      console.error('Error getting all LXC templates', err);
      throw err;
    }
  },
  
  // Get LXC template by ID
  getLXCTemplateById: async (id) => {
    try {
      const result = await pool.query('SELECT * FROM lxc_templates WHERE id = $1', [id]);
      return result.rows[0];
    } catch (err) {
      console.error('Error getting LXC template by ID', err);
      throw err;
    }
  },
  
  // Create LXC template
  createLXCTemplate: async (templateData) => {
    try {
      const { name, profile_type, cores, memory, swap, disk, template_description } = templateData;
      const result = await pool.query(
        'INSERT INTO lxc_templates (name, profile_type, cores, memory, swap, disk, template_description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [name, profile_type, cores, memory, swap, disk, template_description]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error creating LXC template', err);
      throw err;
    }
  },
  
  // Update LXC template
  updateLXCTemplate: async (id, templateData) => {
    try {
      const { name, profile_type, cores, memory, swap, disk, template_description } = templateData;
      const result = await pool.query(
        'UPDATE lxc_templates SET name = $1, profile_type = $2, cores = $3, memory = $4, swap = $5, disk = $6, template_description = $7 WHERE id = $8 RETURNING *',
        [name, profile_type, cores, memory, swap, disk, template_description, id]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error updating LXC template', err);
      throw err;
    }
  },
  
  // Delete LXC template
  deleteLXCTemplate: async (id) => {
    try {
      await pool.query('DELETE FROM lxc_templates WHERE id = $1', [id]);
      return true;
    } catch (err) {
      console.error('Error deleting LXC template', err);
      throw err;
    }
  }
};

module.exports = {
  pool,
  initializeDatabase,
  userDB,
  nodeDB,
  settingsDB,
  vmTemplateDB,
  lxcTemplateDB
};