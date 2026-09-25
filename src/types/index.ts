export type UserRole = 'Owner' | 'Admin' | 'Cashier';

export interface POSUser {
  id: string;
  username: string;
  name: string;
  pin: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Item {
  barcode: string;
  name: string;
  category: string;
  unit: string;
  cost: number;
  totalCost: number;
  price: number;
  piecePrice: number;
  stock: number | null; // null = untracked / unlimited
  reorder: number;
  expiry: string;
  image?: string;
}

export interface CartItem {
  barcode: string;
  name: string;
  mode: 'unit' | 'piece';
  qty: number;
  unitPrice: number;
  image?: string;
  category?: string;
}

export interface Sale {
  id: string;
  date: string;
  time: string;
  items: Array<{
    barcode: string;
    name: string;
    qty: number;
    price: number;
    mode?: 'unit' | 'piece';
  }>;
  summary: string;
  total: number;
  paymentMethod: 'Cash' | 'GCash' | 'Bank' | 'Card' | 'Utang';
  referenceCode?: string;
  tendered: number;
  change: number;
  cashier: string;
  customer?: string;
}

export interface GCashTransaction {
  id: string;
  date: string;
  type: 'Cash In' | 'Cash Out';
  reference: string;
  amount: number;
  fee: number;
  notes: string;
  cashImpact: number;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  loggedBy?: string;
}

export interface Supplier {
  name: string;
  contact: string;
  phone: string;
  address: string;
  terms: string;
}

export interface PurchaseLine {
  barcode: string;
  name: string;
  qty: number;
  cost: number;
  expiry: string;
}

export interface PurchaseOrder {
  id: string;
  date: string;
  supplier: string;
  lines: PurchaseLine[];
  totalCost: number;
}

export interface UtangRecord {
  id: string;
  date: string;
  customer: string;
  description: string;
  qty: number;
  amount: number;
  saleId: string;
  cashier: string;
  status: 'Unpaid' | 'Paid';
}

export interface ItemRequest {
  id: string;
  date: string;
  requestedBy: string;
  name: string;
  category: string;
  qty: number;
  notes: string;
  status: 'Pending' | 'Fulfilled' | 'Rejected';
}

export interface CustomerDisplayState {
  items: CartItem[];
  total: number;
  tendered: number;
  change: number;
  paymentMethod: string;
  customer?: string;
  lastScanned?: {
    barcode?: string;
    name: string;
    price: number;
    qty: number;
    image?: string;
    timestamp?: number;
  };
  status: 'idle' | 'scanning' | 'checkout' | 'completed';
  updatedAt: number;
}
