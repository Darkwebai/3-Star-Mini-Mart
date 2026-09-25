import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Item,
  CartItem,
  Sale,
  GCashTransaction,
  UtangRecord,
  CustomerDisplayState,
  POSUser,
  Expense,
} from './types';
import {
  INITIAL_ITEMS,
  INITIAL_SALES,
  INITIAL_GCASH,
  INITIAL_UTANG,
  INITIAL_USERS,
  INITIAL_EXPENSES,
} from './data/initialData';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebaseAuth';
import {
  GoogleSheetsService,
  DEFAULT_SHEET_ID,
} from './services/googleSheets';
import { displaySync } from './services/broadcastChannel';
import { sound } from './services/soundEffects';

// Components
import { Navbar } from './components/Navbar';
import { CashierPOS } from './components/CashierPOS';
import { CustomerDisplay } from './components/CustomerDisplay';
import { DailySalesView } from './components/DailySalesView';
import { InventoryView } from './components/InventoryView';
import { GCashView } from './components/GCashView';
import { UtangLedgerView } from './components/UtangLedgerView';
import { ExpensesView } from './components/ExpensesView';
import { CheckoutModal } from './components/CheckoutModal';
import { CalculatorModal } from './components/CalculatorModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { PromotionalPosterModal } from './components/PromotionalPosterModal';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { OwnerAdminDashboard } from './components/OwnerAdminDashboard';
import { ScreenLinksModal } from './components/ScreenLinksModal';

export default function App() {
  // Check URL query parameters: ?view=owner | ?view=admin | ?view=dashboard | ?view=display | ?view=pos
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlView = urlParams ? urlParams.get('view') : null;
  const isCustomerDisplayMode = urlView === 'display';
  const isOwnerDashboardUrl = urlView === 'owner' || urlView === 'dashboard' || urlView === 'admin';

  // Staff & User Accounts System
  const [users, setUsers] = useState<POSUser[]>(() => {
    try {
      const saved = localStorage.getItem('3stars_users');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<POSUser | null>(() => {
    try {
      const saved = localStorage.getItem('3stars_current_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_USERS[0]; // Default: Dennis De Jesus (Owner)
  });

  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState<boolean>(false);
  const [showPosterModal, setShowPosterModal] = useState<boolean>(false);
  const [showScreenLinksModal, setShowScreenLinksModal] = useState<boolean>(false);

  // Active Tab View: Default to 'dashboard' if URL param is ?view=owner, else 'pos'
  const [activeTab, setActiveTab] = useState<
    'pos' | 'sales' | 'inventory' | 'expenses' | 'gcash' | 'utang' | 'dashboard'
  >(isOwnerDashboardUrl ? 'dashboard' : 'pos');

  const [showCustomerDisplayModal, setShowCustomerDisplayModal] =
    useState<boolean>(isCustomerDisplayMode);

  // Last scanned item for real-time receipt highlight
  const [lastScannedItem, setLastScannedItem] = useState<{
    barcode: string;
    name: string;
    price: number;
    qty: number;
    mode: 'unit' | 'piece';
    image?: string;
    timestamp: number;
  } | null>(null);

  // Core Data with localStorage persistence
  const [items, setItems] = useState<Item[]>(() => {
    try {
      const saved = localStorage.getItem('3stars_items');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_ITEMS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('3stars_cart');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem('3stars_sales');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SALES;
  });

  const [gcash, setGcash] = useState<GCashTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('3stars_gcash');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_GCASH;
  });

  const [utang, setUtang] = useState<UtangRecord[]>(() => {
    try {
      const saved = localStorage.getItem('3stars_utang');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_UTANG;
  });

  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('3stars_sheet_id') || DEFAULT_SHEET_ID
      );
    } catch {
      return DEFAULT_SHEET_ID;
    }
  });

  // UI Modals
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Auth & Sync State
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    state: 'idle' | 'syncing' | 'success' | 'error';
    message?: string;
  }>({ state: 'idle' });

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setSyncStatus({
          state: 'success',
          message: `Connected as ${currentUser.displayName || currentUser.email}`,
        });
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('3stars_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('3stars_current_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('3stars_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('3stars_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('3stars_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('3stars_gcash', JSON.stringify(gcash));
  }, [gcash]);

  useEffect(() => {
    localStorage.setItem('3stars_utang', JSON.stringify(utang));
  }, [utang]);

  useEffect(() => {
    localStorage.setItem('3stars_sheet_id', spreadsheetId);
  }, [spreadsheetId]);

  // Push cart updates to Customer Display in real-time
  useEffect(() => {
    const total = cart.reduce(
      (sum, item) => sum + item.qty * item.unitPrice,
      0
    );

    const displayState: CustomerDisplayState = {
      items: cart,
      total,
      tendered: 0,
      change: 0,
      paymentMethod: 'Cash',
      customer: currentUser?.name,
      lastScanned: lastScannedItem
        ? {
            barcode: lastScannedItem.barcode,
            name: lastScannedItem.name,
            price: lastScannedItem.price,
            qty: lastScannedItem.qty,
            image: lastScannedItem.image,
            timestamp: lastScannedItem.timestamp,
          }
        : undefined,
      status: cart.length > 0 ? 'scanning' : 'idle',
      updatedAt: Date.now(),
    };

    displaySync.publish(displayState);
  }, [cart, lastScannedItem, currentUser]);

  // Cart operations
  const handleAddToCart = (item: Item, mode: 'unit' | 'piece') => {
    const unitPrice = mode === 'piece' ? item.piecePrice || item.price : item.price;
    const existing = cart.find(
      (c) => c.barcode === item.barcode && c.mode === mode
    );
    const newQty = (existing?.qty || 0) + 1;

    setLastScannedItem({
      barcode: item.barcode,
      name: item.name + (mode === 'piece' ? ' (per pc)' : ''),
      price: unitPrice,
      qty: newQty,
      mode,
      image: item.image,
      timestamp: Date.now(),
    });

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (c) => c.barcode === item.barcode && c.mode === mode
      );
      if (existingIdx >= 0) {
        const next = [...prevCart];
        next[existingIdx] = {
          ...next[existingIdx],
          qty: next[existingIdx].qty + 1,
        };
        return next;
      } else {
        return [
          ...prevCart,
          {
            barcode: item.barcode,
            name: item.name,
            mode,
            qty: 1,
            unitPrice,
            image: item.image,
            category: item.category,
          },
        ];
      }
    });
  };

  const handleUpdateQty = (
    barcode: string,
    mode: 'unit' | 'piece',
    delta: number
  ) => {
    setCart((prevCart) => {
      return prevCart
        .map((c) => {
          if (c.barcode === barcode && c.mode === mode) {
            return { ...c, qty: c.qty + delta };
          }
          return c;
        })
        .filter((c) => c.qty > 0);
    });
  };

  const handleClearCart = () => {
    setCart([]);
    setLastScannedItem(null);
  };

  // Record Sale and Sync with Automatic Stock Deduction
  const handleConfirmSale = async (newSale: Sale) => {
    // 1. Update local sales list
    setSales((prev) => [newSale, ...prev]);

    // 2. Deduct inventory stock automatically
    setItems((prevItems) => {
      return prevItems.map((it) => {
        const soldInThis = newSale.items.filter((sIt) => sIt.barcode === it.barcode);
        if (soldInThis.length === 0 || it.stock === null) return it;
        const totalSold = soldInThis.reduce((acc, curr) => acc + curr.qty, 0);
        return {
          ...it,
          stock: Math.max(0, it.stock - totalSold),
        };
      });
    });

    // 3. If Utang, add to Utang records
    if (newSale.paymentMethod === 'Utang' && newSale.customer) {
      const newUtangRecords: UtangRecord[] = newSale.items.map((it, idx) => ({
        id: `UT-${Date.now()}-${idx}`,
        date: newSale.date,
        customer: newSale.customer || '',
        description: it.name,
        qty: it.qty,
        amount: Math.round(it.qty * it.price * 100) / 100,
        saleId: newSale.id,
        cashier: newSale.cashier,
        status: 'Unpaid',
      }));
      setUtang((prev) => [...newUtangRecords, ...prev]);
    }

    // 4. Background Sync to Google Sheets if user is authenticated
    const token = await getAccessToken();
    if (token) {
      GoogleSheetsService.recordSale(spreadsheetId, token, newSale).catch(
        (err) => console.warn('Background sheets sync:', err)
      );
    }

    // 5. Clear cart
    setCart([]);
    setLastScannedItem(null);
  };

  // GCash transaction handler
  const handleAddGCash = async (tx: GCashTransaction) => {
    setGcash((prev) => [tx, ...prev]);
    const token = await getAccessToken();
    if (token) {
      GoogleSheetsService.recordGCash(spreadsheetId, token, tx).catch(
        () => {}
      );
    }
  };

  // Utang settle handler
  const handleMarkUtangPaid = (id: string) => {
    setUtang((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Paid' } : r))
    );
  };

  // Inventory Save Item
  const handleSaveItem = (item: Item) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.barcode === item.barcode);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [item, ...prev];
    });
  };

  const handleDeleteItem = (barcode: string) => {
    setItems((prev) => prev.filter((i) => i.barcode !== barcode));
  };

  // Staff Account Management Handlers
  const handleSaveUser = async (userToSave: POSUser) => {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === userToSave.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = userToSave;
        return next;
      }
      return [...prev, userToSave];
    });

    if (currentUser?.id === userToSave.id) {
      setCurrentUser(userToSave);
    }

    // Attempt background sync to Google Sheets Users tab
    const token = await getAccessToken();
    if (token) {
      GoogleSheetsService.recordUser(spreadsheetId, token, userToSave).catch(() => {});
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // Tab navigation with Role-Based Access Control
  const handleSelectTab = (tab: 'pos' | 'sales' | 'inventory' | 'gcash' | 'utang' | 'dashboard') => {
    // If cashier tries to navigate away from POS
    if (currentUser?.role === 'Cashier' && tab !== 'pos') {
      sound.playWarning();
      alert('Access Restricted: Cashier accounts only have access to the sales counter. Please log in as Owner or Admin to view dashboard and reports.');
      setShowLoginModal(true);
      return;
    }
    setActiveTab(tab);
  };

  // Google Sheets Pull
  const handlePullFromSheet = async () => {
    const token = await getAccessToken();
    if (!token) {
      setSyncStatus({
        state: 'error',
        message: 'Please authenticate with Google first.',
      });
      return;
    }

    setSyncStatus({ state: 'syncing', message: 'Pulling from Google Sheets…' });
    const result = await GoogleSheetsService.pullDataFromSheet(
      spreadsheetId,
      token
    );

    if (result.success) {
      if (result.items && result.items.length > 0) setItems(result.items);
      if (result.sales && result.sales.length > 0) setSales(result.sales);
      if (result.gcash && result.gcash.length > 0) setGcash(result.gcash);
      if (result.utang && result.utang.length > 0) setUtang(result.utang);
      if (result.users && result.users.length > 0) setUsers(result.users);

      setSyncStatus({
        state: 'success',
        message: result.message,
      });
    } else {
      setSyncStatus({
        state: 'error',
        message: result.message,
      });
    }
  };

  const handleSignIn = async () => {
    setSyncStatus({ state: 'syncing', message: 'Signing in…' });
    try {
      const result = await googleSignIn();
      if (result && result.user) {
        setUser(result.user);
        setSyncStatus({
          state: 'success',
          message: `Signed in as ${result.user.displayName || result.user.email}`,
        });
        handlePullFromSheet();
      } else {
        setSyncStatus({
          state: 'error',
          message: 'Sign in was cancelled or failed.',
        });
      }
    } catch (err: any) {
      setSyncStatus({
        state: 'error',
        message: err?.message || 'Google sign in failed.',
      });
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setSyncStatus({ state: 'idle' });
  };

  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setIsSoundEnabled(next);
  };

  const handleOpenCustomerDisplay = () => {
    setShowCustomerDisplayModal(true);
  };

  // If directly opened as customer display screen
  if (isCustomerDisplayMode || showCustomerDisplayModal) {
    return (
      <CustomerDisplay
        isStandalone={isCustomerDisplayMode}
        onBackToCashier={() => setShowCustomerDisplayModal(false)}
      />
    );
  }

  const subtotalCart = cart.reduce((s, it) => s + it.qty * it.unitPrice, 0);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Navbar in Red, Black, and Green */}
      <Navbar
        currentTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenCustomerDisplay={handleOpenCustomerDisplay}
        onOpenCalculator={() => setShowCalculator(true)}
        onOpenSheetsModal={() => setShowSheetsModal(true)}
        onOpenPosterModal={() => setShowPosterModal(true)}
        onOpenScreenLinks={() => setShowScreenLinksModal(true)}
        onOpenUserManagement={() => {
          if (currentUser?.role === 'Cashier') {
            setShowLoginModal(true);
          } else {
            setShowUserManagementModal(true);
          }
        }}
        onSwitchUser={() => setShowLoginModal(true)}
        currentUser={currentUser}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={handleToggleSound}
        user={user}
        syncState={syncStatus.state}
      />

      {/* Main Tab View */}
      <main className="flex-1 flex flex-col">
        {/* OWNER AND ADMIN DEDICATED DASHBOARD */}
        {activeTab === 'dashboard' && (
          <OwnerAdminDashboard
            sales={sales}
            items={items}
            users={users}
            currentUser={currentUser || INITIAL_USERS[0]}
            spreadsheetId={spreadsheetId}
            onOpenPOS={() => setActiveTab('pos')}
            onOpenCustomerDisplay={handleOpenCustomerDisplay}
            onOpenUserManagement={() => setShowUserManagementModal(true)}
            onOpenPosterModal={() => setShowPosterModal(true)}
            onOpenScreenLinks={() => setShowScreenLinksModal(true)}
            onLogout={() => setShowLoginModal(true)}
            onRefreshData={handlePullFromSheet}
          />
        )}

        {/* POS CASHIER SCREEN */}
        {activeTab === 'pos' && (
          <CashierPOS
            items={items}
            cart={cart}
            lastScannedItem={lastScannedItem}
            onAddToCart={handleAddToCart}
            onUpdateQty={handleUpdateQty}
            onClearCart={handleClearCart}
            onOpenCheckout={() => setShowCheckout(true)}
            onOpenCustomerDisplay={handleOpenCustomerDisplay}
            onOpenCalculator={() => setShowCalculator(true)}
            onSelectTab={handleSelectTab}
            totalSalesCount={sales.length}
            currentUser={currentUser}
            onSwitchUser={() => setShowLoginModal(true)}
            onOpenPosterModal={() => setShowPosterModal(true)}
          />
        )}

        {/* DAILY SALES VIEW */}
        {activeTab === 'sales' && (
          <DailySalesView sales={sales} spreadsheetId={spreadsheetId} />
        )}

        {/* INVENTORY VIEW */}
        {activeTab === 'inventory' && (
          <InventoryView
            items={items}
            onSaveItem={handleSaveItem}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {/* GCASH TRANSACTIONS VIEW */}
        {activeTab === 'gcash' && (
          <GCashView
            transactions={gcash}
            onAddTransaction={handleAddGCash}
          />
        )}

        {/* UTANG CREDIT LEDGER VIEW */}
        {activeTab === 'utang' && (
          <UtangLedgerView
            utangRecords={utang}
            onMarkPaid={handleMarkUtangPaid}
          />
        )}
      </main>

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          items={cart}
          subtotal={subtotalCart}
          cashierName={currentUser?.name || user?.displayName || 'Cashier 1'}
          onClose={() => setShowCheckout(false)}
          onConfirmSale={handleConfirmSale}
        />
      )}

      {/* Till Calculator Modal */}
      {showCalculator && (
        <CalculatorModal onClose={() => setShowCalculator(false)} />
      )}

      {/* Staff Login / Account Switcher Modal */}
      {showLoginModal && (
        <LoginModal
          users={users}
          currentUser={currentUser}
          onLogin={(u) => {
            setCurrentUser(u);
            setShowLoginModal(false);
            if (u.role === 'Cashier' && activeTab === 'dashboard') {
              setActiveTab('pos');
            }
          }}
          onClose={() => setShowLoginModal(false)}
          canCancel={true}
        />
      )}

      {/* User / Cashier Management Modal (Owner & Admin only) */}
      {showUserManagementModal && (
        <UserManagementModal
          users={users}
          currentUser={currentUser || INITIAL_USERS[0]}
          onSaveUser={handleSaveUser}
          onDeleteUser={handleDeleteUser}
          onClose={() => setShowUserManagementModal(false)}
        />
      )}

      {/* Printable Counter QR Promotional Poster Modal */}
      {showPosterModal && (
        <PromotionalPosterModal onClose={() => setShowPosterModal(false)} />
      )}

      {/* Independent Screen URLs & Direct Links Modal */}
      {showScreenLinksModal && (
        <ScreenLinksModal
          onClose={() => setShowScreenLinksModal(false)}
          onNavigateView={(view) => {
            setShowScreenLinksModal(false);
            if (view === 'display') {
              setShowCustomerDisplayModal(true);
            } else {
              setActiveTab(view);
            }
          }}
        />
      )}

      {/* Google Sheets Sync Modal */}
      {showSheetsModal && (
        <GoogleSheetsModal
          user={user}
          spreadsheetId={spreadsheetId}
          onUpdateSpreadsheetId={setSpreadsheetId}
          onSyncFromSheet={handlePullFromSheet}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onClose={() => setShowSheetsModal(false)}
          syncStatus={syncStatus}
        />
      )}
    </div>
  );
}
