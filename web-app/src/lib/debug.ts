import { LocalStorage } from './storage';

// Debug utilities for localStorage inspection
export const debugStorage = {
  // Print all privacy pool related localStorage entries
  inspectAll: () => {
    console.log('=== Privacy Pool LocalStorage Debug ===');
    const keys = Object.keys(localStorage);
    const privacyPoolKeys = keys.filter(key => key.startsWith('privacy_pool:'));
    
    if (privacyPoolKeys.length === 0) {
      console.log('No privacy pool data found in localStorage');
      return;
    }
    
    privacyPoolKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`${key}:`, value);
    });
  },

  // Clear all privacy pool data
  clearAll: async () => {
    const storage = new LocalStorage();
    await storage.clear();
    console.log('All privacy pool data cleared from localStorage');
  },

  // Get current balances
  getBalances: async () => {
    const storage = new LocalStorage();
    const balances = await storage.getBalances();
    console.log('Current balances:', balances);
    return balances;
  },

  // Get current note
  getNote: async () => {
    const storage = new LocalStorage();
    const note = await storage.getNote();
    console.log('Current note:', note);
    return note;
  },

  // Get tree leaves
  getLeaves: async () => {
    const storage = new LocalStorage();
    const leaves = await storage.getLeaves();
    console.log('Tree leaves:', leaves);
    return leaves;
  },

  // Get tree state
  getTree: async () => {
    const storage = new LocalStorage();
    const tree = await storage.getTree();
    console.log('Tree root:', tree.root.toString());
    console.log('Tree leaves count:', tree.leaves.length);
    console.log('Tree depth:', tree.depth);
    return tree;
  },

  // Generate and inspect a test note
  generateTestNote: (value: number = 100) => {
    const storage = new LocalStorage();
    const note = storage.generateNote(value);
    console.log('Test note generated:', note);
    return note;
  },

  // Validate all data
  validateData: async () => {
    const storage = new LocalStorage();
    const isValid = await storage.validateAllData();
    console.log('Data validation result:', isValid);
    return isValid;
  },

  // Force reinitialization
  forceReinitialize: async () => {
    const storage = new LocalStorage();
    await storage.clear();
    const result = await storage.initializeWithValidation();
    console.log('Forced reinitialization completed:', result);
    return result;
  },

  // Corrupt data for testing (don't use in production!)
  corruptData: () => {
    console.warn('Corrupting data for testing purposes...');
    localStorage.setItem('privacy_pool:note', '{"value": "invalid", "secret": -1, "nullifier": "corrupt"}');
    localStorage.setItem('privacy_pool:balances', '{"accountBalance": -999, "poolBalance": "not_a_number"}');
    console.log('Data corrupted. Try validating or refreshing the page.');
  }
};

// Make it globally available in development
if (typeof window !== 'undefined') {
  (window as any).debugStorage = debugStorage;
} 