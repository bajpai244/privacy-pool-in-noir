
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, TrendingUp, TrendingDown, Clock, Monitor } from 'lucide-react';
import { LocalStorage } from '@/lib/storage';
import type { Note, IMTNode } from '@/lib/types';
import { debugStorage } from '@/lib/debug';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  date: Date;
  description: string;
}

const BankingInterface = () => {
  const [accountBalance, setAccountBalance] = useState(1000.00);
  const [poolBalance, setPoolBalance] = useState(0.00);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [terminalText, setTerminalText] = useState('');
  const [storage] = useState(() => new LocalStorage());
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [treeRoot, setTreeRoot] = useState<string>('');
  const [wasReinitialized, setWasReinitialized] = useState<boolean>(false);

  // Initialize storage and load existing data with validation
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        console.log('Initializing storage with validation...');
        
        // Use the new validation-based initialization
        const { balances, note, tree, isReinitialized } = await storage.initializeWithValidation();
        
        if (isReinitialized) {
          console.log('System was reinitialized due to data inconsistencies');
          setWasReinitialized(true);
          // Show a brief notification that system was reset
          setTerminalText('SYSTEM RESET - DATA INCONSISTENCIES DETECTED');
          setTimeout(() => {
            setTerminalText('NOIR-PRIVACY-POOL TERMINAL v2.1 READY...');
          }, 2000);
        }
        
        // Set all state from validated data
        setAccountBalance(balances.accountBalance);
        setPoolBalance(balances.poolBalance);
        setCurrentNote(note);
        setTreeRoot(tree.root.toString());
        
        console.log('Storage initialized successfully:', {
          balances,
          note: note ? `$${note.value}` : 'None',
          treeRoot: tree.root.toString(),
          isReinitialized
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Critical error during storage initialization:', error);
        // Even if there's an error, we need to allow the UI to render
        setIsInitialized(true);
      }
    };

    initializeStorage();
  }, [storage]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const text = 'NOIR-PRIVACY-POOL TERMINAL v2.1 READY...';
    let i = 0;
    const typeWriter = () => {
      if (i < text.length) {
        setTerminalText(text.slice(0, i + 1));
        i++;
        setTimeout(typeWriter, 100);
      }
    };
    typeWriter();
  }, []);

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    if (depositAmount > 0 && depositAmount <= accountBalance) {
      try {
        // Generate a new note for the deposit
        const note = storage.generateNote(depositAmount);
        console.log('Generated note for deposit:', note);
        
        // Insert note into tree and update storage
        const tree = await storage.updateTreeWithNote(note);
        console.log('Tree root after deposit:', tree.root.toString());
        
        // Store the note
        await storage.setNote(note);
        setCurrentNote(note);
        setTreeRoot(tree.root.toString());
        
        // Update balances
        const newAccountBalance = accountBalance - depositAmount;
        const newPoolBalance = poolBalance + depositAmount;
        
        setAccountBalance(newAccountBalance);
        setPoolBalance(newPoolBalance);
        
        // Save balances to localStorage
        await storage.setBalances({
          accountBalance: newAccountBalance,
          poolBalance: newPoolBalance
        });
        
        // Validate the state after deposit
        const isValid = await storage.validateAllData();
        if (!isValid) {
          console.error('Data validation failed after deposit. This should not happen.');
          alert('Warning: Data inconsistency detected after deposit. Please refresh the page.');
        }
        
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          type: 'deposit',
          amount: depositAmount,
          date: new Date(),
          description: `Deposit to pool (Note: ${note.commitment.toString().slice(0, 8)}...)`
        };
        setTransactions(prev => [newTransaction, ...prev]);
        setAmount('');
        
        console.log('Deposit completed successfully');
      } catch (error) {
        console.error('Error during deposit:', error);
      }
    }
  };

  const handleWithdrawal = async () => {
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount > 0 && withdrawAmount <= poolBalance) {
      const newPoolBalance = poolBalance - withdrawAmount;
      const newAccountBalance = accountBalance + withdrawAmount;
      
      setPoolBalance(newPoolBalance);
      setAccountBalance(newAccountBalance);
      
      // Save to localStorage
      await storage.setBalances({
        accountBalance: newAccountBalance,
        poolBalance: newPoolBalance
      });
      
      // Validate the state after withdrawal
      const isValid = await storage.validateAllData();
      if (!isValid) {
        console.error('Data validation failed after withdrawal. This should not happen.');
        alert('Warning: Data inconsistency detected after withdrawal. Please refresh the page.');
      }
      
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'withdrawal',
        amount: withdrawAmount,
        date: new Date(),
        description: `Withdrawal from pool`
      };
      setTransactions(prev => [newTransaction, ...prev]);
      setAmount('');
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background retro-crt p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="terminal-text text-2xl text-primary mb-4">
            INITIALIZING PRIVACY POOL...
          </div>
          <div className="terminal-text text-lg text-accent animate-pulse">
            Loading storage and tree data<span className="blink">█</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background retro-crt p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="terminal-text text-4xl md:text-6xl font-bold text-primary mb-2 glitch">
          ░P░R░I░V░A░C░Y░-░P░O░O░L░
        </div>
        <div className="terminal-text text-lg md:text-2xl text-primary/80 mb-4 animate-pulse">
          &gt;&gt; your favorite privacy pools now in Noir &lt;&lt;
        </div>
        <div className="terminal-text text-lg text-accent">
          {terminalText}<span className="blink">█</span>
        </div>
        <div className="terminal-text text-sm text-muted-foreground mt-2">
          System Time: {formatTime(currentTime)}
        </div>
        <div className="terminal-text text-xs text-muted-foreground mt-1">
          Storage: Initialized | Tree: Ready
          {wasReinitialized && (
            <span className="text-yellow-500 ml-2">| SYSTEM RESET</span>
          )}
        </div>
        <div className="terminal-text text-xs text-muted-foreground mt-1">
          Tree Root: {treeRoot ? `${treeRoot.slice(0, 16)}...` : 'Loading...'}
        </div>
        {currentNote && (
          <div className="terminal-text text-xs text-muted-foreground mt-1">
            Current Note: ${currentNote.value} (Commitment: {currentNote.commitment.toString().slice(0, 8)}...)
          </div>
        )}
        <div className="mt-4 flex gap-2 flex-wrap">
          <Button
            onClick={() => debugStorage.inspectAll()}
            variant="outline"
            size="sm"
            className="terminal-text text-xs"
          >
            Debug Storage
          </Button>
          <Button
            onClick={() => debugStorage.getTree()}
            variant="outline"
            size="sm"
            className="terminal-text text-xs"
          >
            Debug Tree
          </Button>
          <Button
            onClick={() => debugStorage.validateData()}
            variant="outline"
            size="sm"
            className="terminal-text text-xs"
          >
            Validate Data
          </Button>
          <Button
            onClick={() => debugStorage.forceReinitialize()}
            variant="outline"
            size="sm"
            className="terminal-text text-xs"
          >
            Force Reset
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Account Balance */}
        <Card className="retro-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="terminal-text text-xl font-bold text-primary">ACCOUNT BALANCE</h2>
            <DollarSign className="text-accent" size={24} />
          </div>
          <div className="terminal-text text-3xl font-bold text-accent mb-2">
            {formatCurrency(accountBalance)}
          </div>
          <div className="text-sm text-muted-foreground">
            Available Funds
          </div>
        </Card>

        {/* Pool Balance */}
        <Card className="retro-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="terminal-text text-xl font-bold text-primary">POOL BALANCE</h2>
            <DollarSign className="text-accent" size={24} />
          </div>
          <div className="terminal-text text-3xl font-bold text-accent mb-2">
            {formatCurrency(poolBalance)}
          </div>
          <div className="text-sm text-muted-foreground">
            Pool Funds
          </div>
        </Card>

        {/* Transaction Interface */}
        <Card className="retro-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="terminal-text text-xl font-bold text-primary">TRANSACTION TERMINAL</h2>
            <Monitor className="text-accent" size={24} />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="terminal-text text-sm font-bold text-primary block mb-2">
                AMOUNT ($)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="retro-input terminal-text text-lg"
                step="0.01"
                min="0"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleDeposit}
                disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > accountBalance}
                className="retro-button bg-primary hover:bg-primary/90"
              >
                <TrendingUp className="mr-2" size={20} />
                DEPOSIT
              </Button>
              
              <Button
                onClick={handleWithdrawal}
                disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > poolBalance}
                className="retro-button bg-destructive hover:bg-destructive/90 border-destructive"
                style={{ 
                  boxShadow: '4px 4px 0px hsl(var(--destructive))',
                }}
              >
                <TrendingDown className="mr-2" size={20} />
                WITHDRAW
              </Button>
            </div>
          </div>
        </Card>

        {/* Transaction History */}
        <Card className="retro-card col-span-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="terminal-text text-xl font-bold text-primary">TRANSACTION HISTORY</h2>
            <Clock className="text-accent" size={24} />
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="terminal-text text-muted-foreground text-center py-8">
                NO TRANSACTIONS FOUND
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-input border border-border"
                >
                  <div className="flex items-center space-x-3">
                    {transaction.type === 'deposit' ? (
                      <TrendingUp className="text-primary" size={20} />
                    ) : (
                      <TrendingDown className="text-destructive" size={20} />
                    )}
                    <div>
                      <div className="terminal-text font-bold">
                        {transaction.type.toUpperCase()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`terminal-text font-bold ${
                      transaction.type === 'deposit' ? 'text-primary' : 'text-destructive'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(transaction.date)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center terminal-text text-sm text-muted-foreground">
        <div className="mb-2">
          ░░░ SECURE CONNECTION ESTABLISHED ░░░
        </div>
        <div>
          © 2024 NOIR-PRIVACY-POOL SYSTEMS • ALL TRANSACTIONS ENCRYPTED
        </div>
      </div>
    </div>
  );
};

export default BankingInterface;
