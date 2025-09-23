/**
 * Simplified Database Service for Browser-Only Storage
 * Uses localStorage and IndexedDB for local data storage
 * Fallback from sql.js to avoid webpack issues
 */
export class DatabaseService {
  constructor() {
    this.isInitialized = false;
    this.dbName = 'BayesianABDatabase';
    this.version = 1;
  }

  /**
   * Initialize the database
   */
  async initialize() {
    try {
      // Initialize IndexedDB
      await this.initIndexedDB();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Fallback to localStorage
      this.isInitialized = true;
    }
  }

  /**
   * Initialize IndexedDB
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('testConfigs')) {
          db.createObjectStore('testConfigs', { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains('testResults')) {
          db.createObjectStore('testResults', { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains('userPreferences')) {
          db.createObjectStore('userPreferences', { keyPath: 'key' });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
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
    
    const configWithId = {
      ...config,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    try {
      if (this.db) {
        const transaction = this.db.transaction(['testConfigs'], 'readwrite');
        const store = transaction.objectStore('testConfigs');
        await store.add(configWithId);
      } else {
        // Fallback to localStorage
        const configs = this.getFromLocalStorage('testConfigs') || [];
        configs.push(configWithId);
        this.saveToLocalStorage('testConfigs', configs);
      }
      
      return configWithId.id;
    } catch (error) {
      console.error('Failed to save test config:', error);
      return null;
    }
  }

  /**
   * Get all test configurations
   */
  async getTestConfigs() {
    if (!this.isInitialized) await this.initialize();
    
    try {
      if (this.db) {
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction(['testConfigs'], 'readonly');
          const store = transaction.objectStore('testConfigs');
          const request = store.getAll();
          
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      } else {
        // Fallback to localStorage
        return this.getFromLocalStorage('testConfigs') || [];
      }
    } catch (error) {
      console.error('Failed to get test configs:', error);
      return [];
    }
  }

  /**
   * Save test result
   */
  async saveTestResult(result) {
    if (!this.isInitialized) await this.initialize();
    
    const resultWithId = {
      ...result,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    try {
      if (this.db) {
        const transaction = this.db.transaction(['testResults'], 'readwrite');
        const store = transaction.objectStore('testResults');
        await store.add(resultWithId);
      } else {
        // Fallback to localStorage
        const results = this.getFromLocalStorage('testResults') || [];
        results.push(resultWithId);
        this.saveToLocalStorage('testResults', results);
      }
    } catch (error) {
      console.error('Failed to save test result:', error);
    }
  }

  /**
   * Update user preference
   */
  async updatePreference(key, value) {
    if (!this.isInitialized) await this.initialize();
    
    const preference = {
      key,
      value,
      updatedAt: new Date().toISOString()
    };
    
    try {
      if (this.db) {
        const transaction = this.db.transaction(['userPreferences'], 'readwrite');
        const store = transaction.objectStore('userPreferences');
        await store.put(preference);
      } else {
        // Fallback to localStorage
        const preferences = this.getFromLocalStorage('userPreferences') || {};
        preferences[key] = value;
        this.saveToLocalStorage('userPreferences', preferences);
      }
    } catch (error) {
      console.error('Failed to update preference:', error);
    }
  }

  /**
   * Get user preference
   */
  async getPreference(key, defaultValue = null) {
    if (!this.isInitialized) await this.initialize();
    
    try {
      if (this.db) {
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction(['userPreferences'], 'readonly');
          const store = transaction.objectStore('userPreferences');
          const request = store.get(key);
          
          request.onsuccess = () => {
            const result = request.result;
            resolve(result ? result.value : defaultValue);
          };
          request.onerror = () => reject(request.error);
        });
      } else {
        // Fallback to localStorage
        const preferences = this.getFromLocalStorage('userPreferences') || {};
        return preferences[key] || defaultValue;
      }
    } catch (error) {
      console.error('Failed to get preference:', error);
      return defaultValue;
    }
  }

  /**
   * Export data as JSON
   */
  async exportData() {
    if (!this.isInitialized) await this.initialize();
    
    const configs = await this.getTestConfigs();
    const results = this.getFromLocalStorage('testResults') || [];
    
    return {
      configs,
      results,
      exportDate: new Date().toISOString()
    };
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    if (!this.isInitialized) await this.initialize();
    
    try {
      if (this.db) {
        const transaction = this.db.transaction(['testConfigs', 'testResults', 'userPreferences'], 'readwrite');
        transaction.objectStore('testConfigs').clear();
        transaction.objectStore('testResults').clear();
        transaction.objectStore('userPreferences').clear();
      } else {
        // Fallback to localStorage
        localStorage.removeItem('testConfigs');
        localStorage.removeItem('testResults');
        localStorage.removeItem('userPreferences');
      }
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  // Helper methods for localStorage fallback
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  getFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get from localStorage:', error);
      return null;
    }
  }
}

// Create singleton instance
export const dbService = new DatabaseService();
