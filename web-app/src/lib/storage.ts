import { poseidon1, poseidon2, poseidon3 } from "poseidon-lite";
import { IMT } from "@zk-kit/imt";
import type { IMTNode, Note, BalanceData } from "./types";
import { TREE_DEPTH, TREE_ZERO_VALUE, TREE_ARITY } from "./constants";

/**
 * LocalStorage class with comprehensive data validation and consistency checks.
 * 
 * This class provides the same API as the original storage.ts but with added
 * validation to ensure data integrity. If any inconsistencies are detected,
 * the system automatically reinitializes with clean state.
 * 
 * Validation checks include:
 * - Note commitment and nullifier hash verification
 * - Balance value validation (positive numbers, reasonable ranges)
 * - Tree configuration and structure validation
 * - Cross-system consistency (notes exist in tree, balances match notes)
 * 
 * Usage:
 * const storage = new LocalStorage();
 * const { balances, note, tree, isReinitialized } = await storage.initializeWithValidation();
 */
export class LocalStorage {
  private prefix: string;

  constructor(prefix: string = "privacy_pool") {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async clear() {
    const keys = Object.keys(localStorage);
    const prefixedKeys = keys.filter(key => key.startsWith(`${this.prefix}:`));
    prefixedKeys.forEach(key => localStorage.removeItem(key));
  }

  // Data validation methods
  private validateNote(note: Note): boolean {
    try {
      // Check if values are valid numbers
      if (typeof note.value !== 'number' || note.value <= 0) return false;
      if (typeof note.secret !== 'number' || note.secret <= 0) return false;
      if (typeof note.nullifier !== 'number' || note.nullifier <= 0) return false;

      // Verify commitment hash
      const expectedCommitment = poseidon3([note.value, note.secret, note.nullifier]);
      if (note.commitment !== expectedCommitment) {
        console.error('Note commitment mismatch:', {
          expected: expectedCommitment.toString(),
          actual: note.commitment.toString()
        });
        return false;
      }

      // Verify nullifier hash
      const expectedNullifierHash = poseidon1([note.nullifier]);
      if (note.nullifierHash !== expectedNullifierHash) {
        console.error('Note nullifier hash mismatch:', {
          expected: expectedNullifierHash.toString(),
          actual: note.nullifierHash.toString()
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating note:', error);
      return false;
    }
  }

  private validateBalances(balances: BalanceData): boolean {
    try {
      // Check if balances are valid numbers
      if (typeof balances.accountBalance !== 'number' || balances.accountBalance < 0) {
        console.error('Invalid account balance:', balances.accountBalance);
        return false;
      }
      if (typeof balances.poolBalance !== 'number' || balances.poolBalance < 0) {
        console.error('Invalid pool balance:', balances.poolBalance);
        return false;
      }

      // Check for reasonable maximum values (prevent overflow)
      const MAX_BALANCE = 1000000000; // 1 billion
      if (balances.accountBalance > MAX_BALANCE || balances.poolBalance > MAX_BALANCE) {
        console.error('Balance exceeds maximum allowed value');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating balances:', error);
      return false;
    }
  }

  private validateTree(tree: IMT): boolean {
    try {
      // Check tree configuration
      if (tree.depth !== TREE_DEPTH) {
        console.error('Tree depth mismatch:', tree.depth, 'expected:', TREE_DEPTH);
        return false;
      }
      if (tree.arity !== TREE_ARITY) {
        console.error('Tree arity mismatch:', tree.arity, 'expected:', TREE_ARITY);
        return false;
      }

      // Verify tree can calculate root without errors
      const root = tree.root;
      if (typeof root !== 'bigint' && typeof root !== 'number' && typeof root !== 'string') {
        console.error('Invalid tree root type:', typeof root);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating tree:', error);
      return false;
    }
  }

  private validateCrossSystemConsistency(note: Note | null, tree: IMT, balances: BalanceData): boolean {
    try {
      // If there's a note, verify it's in the tree
      if (note) {
        const noteIndex = tree.indexOf(note.commitment);
        if (noteIndex === -1) {
          console.error('Note commitment not found in tree');
          return false;
        }
      }

      // Check if balances make sense
      // If there's a note, pool balance should be at least the note value
      if (note && balances.poolBalance < note.value) {
        console.error('Pool balance is less than note value:', {
          poolBalance: balances.poolBalance,
          noteValue: note.value
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating cross-system consistency:', error);
      return false;
    }
  }

  async validateAllData(): Promise<boolean> {
    try {
      console.log('Validating all stored data...');

      // Load all data
      const balances = await this.getBalances();
      const note = await this.getNote();
      const tree = await this.getTree();

      // Validate balances
      if (balances && !this.validateBalances(balances)) {
        console.error('Balance validation failed');
        return false;
      }

      // Validate note
      if (note && !this.validateNote(note)) {
        console.error('Note validation failed');
        return false;
      }

      // Validate tree
      if (!this.validateTree(tree)) {
        console.error('Tree validation failed');
        return false;
      }

      // Validate cross-system consistency
      if (!this.validateCrossSystemConsistency(note, tree, balances || { accountBalance: 0, poolBalance: 0 })) {
        console.error('Cross-system consistency validation failed');
        return false;
      }

      console.log('All data validation passed');
      return true;
    } catch (error) {
      console.error('Error during data validation:', error);
      return false;
    }
  }

  async initializeWithValidation(): Promise<{ balances: BalanceData; note: Note | null; tree: IMT; isReinitialized: boolean }> {
    const isValid = await this.validateAllData();
    
    if (!isValid) {
      console.warn('Data validation failed. Reinitializing system...');
      await this.clear();
      
      // Set default balances
      const defaultBalances: BalanceData = {
        accountBalance: 1000.00,
        poolBalance: 0.00
      };
      await this.setBalances(defaultBalances);
      
      // Initialize empty tree
      const tree = new IMT(poseidon2, TREE_DEPTH, TREE_ZERO_VALUE, TREE_ARITY);
      await this.setLeaves(tree.leaves);
      
      console.log('System reinitialized with clean state');
      return {
        balances: defaultBalances,
        note: null,
        tree,
        isReinitialized: true
      };
    }

    // Data is valid, load existing state
    const balances = await this.getBalances() || { accountBalance: 1000.00, poolBalance: 0.00 };
    const note = await this.getNote();
    const tree = await this.getTree();

    return {
      balances,
      note,
      tree,
      isReinitialized: false
    };
  }

  async setLeaves(leaves: IMTNode[]) {
    const data = leaves.map(leaf => leaf.toString());
    localStorage.setItem(this.getKey("tree:leaves"), JSON.stringify(data));
  }

  async getLeaves(): Promise<bigint[] | undefined> {
    const data = localStorage.getItem(this.getKey("tree:leaves"));
    if (!data) return undefined;
    
    const parsed = JSON.parse(data) as string[];
    return parsed.map(v => BigInt(v));
  }

  async setNote(note: Note) {
    const data = {
      value: note.value,
      secret: note.secret,
      nullifier: note.nullifier,
    };
    localStorage.setItem(this.getKey("note"), JSON.stringify(data));
  }

  async getNote(): Promise<Note | null> {
    const data = localStorage.getItem(this.getKey("note"));
    if (!data) return null;

    const parsed = JSON.parse(data) as {
      value: number;
      secret: number;
      nullifier: number;
    };

    const commitment = poseidon3([parsed.value, parsed.secret, parsed.nullifier]);
    const nullifierHash = poseidon1([parsed.nullifier]);

    return {
      ...parsed,
      commitment,
      nullifierHash,
    };
  }

  async removeNote() {
    localStorage.removeItem(this.getKey("note"));
  }

  async insertNullifierHash(nullifierHash: bigint) {
    localStorage.setItem(
      this.getKey(`nullifierHashMap:${nullifierHash.toString()}`),
      "true"
    );
  }

  async nullifierHashExists(nullifierHash: bigint): Promise<boolean> {
    const data = localStorage.getItem(
      this.getKey(`nullifierHashMap:${nullifierHash.toString()}`)
    );
    return data === "true";
  }

  // Additional methods for managing balances
  async setBalances(balances: BalanceData) {
    localStorage.setItem(this.getKey("balances"), JSON.stringify(balances));
  }

  async getBalances(): Promise<BalanceData | null> {
    const data = localStorage.getItem(this.getKey("balances"));
    if (!data) return null;
    
    return JSON.parse(data) as BalanceData;
  }

  async updateAccountBalance(balance: number) {
    const currentBalances = await this.getBalances();
    const newBalances: BalanceData = {
      accountBalance: balance,
      poolBalance: currentBalances?.poolBalance || 0,
    };
    await this.setBalances(newBalances);
  }

  async updatePoolBalance(balance: number) {
    const currentBalances = await this.getBalances();
    const newBalances: BalanceData = {
      accountBalance: currentBalances?.accountBalance || 0,
      poolBalance: balance,
    };
    await this.setBalances(newBalances);
  }

  // Tree management methods
  async getTree(): Promise<IMT> {
    const leaves = await this.getLeaves();
    return new IMT(
      poseidon2,
      TREE_DEPTH,
      TREE_ZERO_VALUE,
      TREE_ARITY,
      leaves || []
    );
  }

  async updateTreeWithNote(note: Note): Promise<IMT> {
    const tree = await this.getTree();
    tree.insert(note.commitment);
    await this.setLeaves(tree.leaves);
    return tree;
  }

  // Note generation (using simple random for demo - in production use secure random)
  generateNote(value: number): Note {
    const secret = this.generateRandomInt();
    const nullifier = this.generateRandomInt();
    const commitment = poseidon3([value, secret, nullifier]);
    const nullifierHash = poseidon1([nullifier]);

    return {
      value,
      secret,
      nullifier,
      commitment,
      nullifierHash,
    };
  }

  private generateRandomInt(): number {
    return Math.floor(Math.random() * 2**31);
  }
} 