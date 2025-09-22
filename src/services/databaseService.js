import initSqlJs from 'sql.js';

/**
 * Database Service for Browser-Only SQLite
 * Uses sql.js with IndexedDB persistence for local data storage
 */
export class DatabaseService {
  constructor() {
    this.db = null;
    this.SQL = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the SQLite database
   */
  async initialize() {
    try {
      this.SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });
      
      // Try to load existing database from IndexedDB
      const existingDb = await this.loadFromIndexedDB();
      
      if (existingDb) {
        this.db = new this.SQL.Database(existingDb);
      } else {
        this.db = new this.SQL.Database();
        await this.createTables();
      }
      
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Fallback to in-memory database
      this.db = new this.SQL.Database();
      await this.createTables();
      this.isInitialized = true;
    }
  }

  /**
   * Create database tables
   */
  async createTables() {
    const createTablesSQL = `
      -- Test configurations table
      CREATE TABLE IF NOT EXISTS test_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        variant_a_name TEXT DEFAULT 'Control',
        variant_b_name TEXT DEFAULT 'Treatment',
        prior_alpha REAL DEFAULT 1.0,
        prior_beta REAL DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Test results table
      CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_id INTEGER,
        variant_a_successes INTEGER DEFAULT 0,
        variant_a_trials INTEGER DEFAULT 0,
        variant_b_successes INTEGER DEFAULT 0,
        variant_b_trials INTEGER DEFAULT 0,
        probability_b_greater REAL,
        expected_loss_a REAL,
        expected_loss_b REAL,
        bayes_factor REAL,
        credible_interval_a_lower REAL,
        credible_interval_a_upper REAL,
        credible_interval_b_lower REAL,
        credible_interval_b_upper REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (config_id) REFERENCES test_configs (id)
      );

      -- Sequential test data table
      CREATE TABLE IF NOT EXISTS sequential_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_id INTEGER,
        step INTEGER,
        variant_a_successes INTEGER,
        variant_a_trials INTEGER,
        variant_b_successes INTEGER,
        variant_b_trials INTEGER,
        probability_b_greater REAL,
        should_stop BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (config_id) REFERENCES test_configs (id)
      );

      -- User preferences table
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Insert default preferences
      INSERT OR IGNORE INTO user_preferences (key, value) VALUES 
        ('default_prior_alpha', '1.0'),
        ('default_prior_beta', '1.0'),
        ('confidence_level', '0.95'),
        ('monte_carlo_samples', '10000'),
        ('theme', 'light');
    `;

    this.db.exec(createTablesSQL);
    await this.saveToIndexedDB();
  }

  /**
   * Save database to IndexedDB
   */
  async saveToIndexedDB() {
    try {
      const data = this.db.export();
      const request = indexedDB.open('BayesianABDatabase', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('database')) {
          db.createObjectStore('database');
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['database'], 'readwrite');
        const store = transaction.objectStore('database');
        store.put(data, 'main');
      };
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error);
    }
  }

  /**
   * Load database from IndexedDB
   */
  async loadFromIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BayesianABDatabase', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('database')) {
          db.createObjectStore('database');
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['database'], 'readonly');
        const store = transaction.objectStore('database');
        const getRequest = store.get('main');
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result);
        };
        
        getRequest.onerror = () => {
          reject(getRequest.error);
        };
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Save test configuration
   */
  async saveTestConfig(config) {
    if (!this.isInitialized) await this.initialize();
    
    const { name, description, variant_a_name, variant_b_name, prior_alpha, prior_beta } = config;
    
    const stmt = this.db.prepare(`
      INSERT INTO test_configs (name, description, variant_a_name, variant_b_name, prior_alpha, prior_beta)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([name, description, variant_a_name, variant_b_name, prior_alpha, prior_beta]);
    await this.saveToIndexedDB();
    
    return this.db.exec("SELECT last_insert_rowid()")[0].values[0][0];
  }

  /**
   * Save test result
   */
  async saveTestResult(result) {
    if (!this.isInitialized) await this.initialize();
    
    const {
      config_id,
      variant_a_successes,
      variant_a_trials,
      variant_b_successes,
      variant_b_trials,
      probability_b_greater,
      expected_loss_a,
      expected_loss_b,
      bayes_factor,
      credible_interval_a_lower,
      credible_interval_a_upper,
      credible_interval_b_lower,
      credible_interval_b_upper
    } = result;
    
    const stmt = this.db.prepare(`
      INSERT INTO test_results (
        config_id, variant_a_successes, variant_a_trials, variant_b_successes, variant_b_trials,
        probability_b_greater, expected_loss_a, expected_loss_b, bayes_factor,
        credible_interval_a_lower, credible_interval_a_upper,
        credible_interval_b_lower, credible_interval_b_upper
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      config_id, variant_a_successes, variant_a_trials, variant_b_successes, variant_b_trials,
      probability_b_greater, expected_loss_a, expected_loss_b, bayes_factor,
      credible_interval_a_lower, credible_interval_a_upper,
      credible_interval_b_lower, credible_interval_b_upper
    ]);
    
    await this.saveToIndexedDB();
  }

  /**
   * Get all test configurations
   */
  async getTestConfigs() {
    if (!this.isInitialized) await this.initialize();
    
    const result = this.db.exec(`
      SELECT * FROM test_configs 
      ORDER BY created_at DESC
    `);
    
    return result.length > 0 ? result[0].values.map(row => ({
      id: row[0],
      name: row[1],
      description: row[2],
      variant_a_name: row[3],
      variant_b_name: row[4],
      prior_alpha: row[5],
      prior_beta: row[6],
      created_at: row[7],
      updated_at: row[8]
    })) : [];
  }

  /**
   * Get test results for a configuration
   */
  async getTestResults(configId) {
    if (!this.isInitialized) await this.initialize();
    
    const result = this.db.exec(`
      SELECT * FROM test_results 
      WHERE config_id = ? 
      ORDER BY created_at DESC
    `, [configId]);
    
    return result.length > 0 ? result[0].values.map(row => ({
      id: row[0],
      config_id: row[1],
      variant_a_successes: row[2],
      variant_a_trials: row[3],
      variant_b_successes: row[4],
      variant_b_trials: row[5],
      probability_b_greater: row[6],
      expected_loss_a: row[7],
      expected_loss_b: row[8],
      bayes_factor: row[9],
      credible_interval_a_lower: row[10],
      credible_interval_a_upper: row[11],
      credible_interval_b_lower: row[12],
      credible_interval_b_upper: row[13],
      created_at: row[14]
    })) : [];
  }

  /**
   * Update user preference
   */
  async updatePreference(key, value) {
    if (!this.isInitialized) await this.initialize();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_preferences (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run([key, value]);
    await this.saveToIndexedDB();
  }

  /**
   * Get user preference
   */
  async getPreference(key, defaultValue = null) {
    if (!this.isInitialized) await this.initialize();
    
    const result = this.db.exec(`
      SELECT value FROM user_preferences WHERE key = ?
    `, [key]);
    
    return result.length > 0 ? result[0].values[0][0] : defaultValue;
  }

  /**
   * Export database as JSON
   */
  async exportData() {
    if (!this.isInitialized) await this.initialize();
    
    const configs = await this.getTestConfigs();
    const exportData = {
      configs: [],
      exportDate: new Date().toISOString()
    };
    
    for (const config of configs) {
      const results = await this.getTestResults(config.id);
      exportData.configs.push({
        ...config,
        results
      });
    }
    
    return exportData;
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    if (!this.isInitialized) await this.initialize();
    
    this.db.exec(`
      DELETE FROM test_results;
      DELETE FROM sequential_data;
      DELETE FROM test_configs;
      DELETE FROM user_preferences;
    `);
    
    await this.saveToIndexedDB();
  }
}

// Create singleton instance
export const dbService = new DatabaseService();
