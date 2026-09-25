import { Item, Sale, GCashTransaction, Expense, UtangRecord, POSUser } from '../types';

export const DEFAULT_SHEET_ID = '196T5L2f0uyvhAMPHPCFlfps7V24ao_Uxrxg98YmW3SA';

export interface SheetSyncResult {
  success: boolean;
  message: string;
  items?: Item[];
  sales?: Sale[];
  gcash?: GCashTransaction[];
  expenses?: Expense[];
  utang?: UtangRecord[];
  users?: POSUser[];
}

export class GoogleSheetsService {
  private static parsePiecePrice(val: any): number {
    if (val === '' || val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    const match = String(val).match(/[\d,]+\.?\d*/);
    if (!match) return 0;
    return Number(match[0].replace(/,/g, '')) || 0;
  }

  private static parseStock(val: any): number | null {
    if (val === '' || val === null || val === undefined) return null;
    if (typeof val === 'number') return val;
    const m = String(val).match(/-?\d+(\.\d+)?/);
    return m ? Number(m[0]) : null;
  }

  /**
   * Fetches data from the user's Google Sheet
   */
  public static async pullDataFromSheet(
    spreadsheetId: string,
    accessToken: string
  ): Promise<SheetSyncResult> {
    try {
      const ranges = [
        'Items!A2:N1000',
        'Sales!A2:I1000',
        'GCash Transactions!A2:G500',
        'Expenses!A2:D500',
        'Utang!A2:H500',
        'Users!A2:G500',
        'Purchases!A2:F500',
      ];
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges
        .map((r) => `ranges=${encodeURIComponent(r)}`)
        .join('&')}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Failed to fetch sheets data (${res.status})`
        );
      }

      const json = await res.json();
      const valueRanges = json.valueRanges || [];

      // Parse Items (range 0)
      const itemsRows = valueRanges[0]?.values || [];
      const items: Item[] = itemsRows
        .filter((r: any[]) => r[1]) // has item description
        .map((r: any[], idx: number) => ({
          barcode: String(r[0] || `SKU-${idx + 1000}`),
          name: String(r[1] || ''),
          category: String(r[2] || 'Others'),
          unit: String(r[3] || 'pc'),
          cost: Number(r[4]) || 0,
          totalCost: Number(r[5]) || 0,
          price: Math.max(1, Math.round(Number(r[7]) || 0)),
          piecePrice: Math.max(0, Math.round(this.parsePiecePrice(r[9]))),
          expiry: String(r[10] || ''),
          image: String(r[11] || ''),
          stock: this.parseStock(r[12]),
          reorder: Number(r[13]) || 5,
        }));

      // Parse Sales (range 1)
      const salesRows = valueRanges[1]?.values || [];
      const sales: Sale[] = salesRows
        .filter((r: any[]) => r[0])
        .map((r: any[]) => ({
          id: String(r[0]),
          date: String(r[1] || '').slice(0, 10),
          time: String(r[1] || '').length > 10 ? String(r[1]).slice(11, 19) : '',
          summary: String(r[2] || ''),
          total: Number(r[3]) || 0,
          paymentMethod: (String(r[4] || 'Cash') as any),
          tendered: Number(r[5]) || 0,
          change: Number(r[6]) || 0,
          cashier: String(r[7] || ''),
          customer: String(r[8] || ''),
          items: [],
        }));

      // Parse GCash (range 2)
      const gcashRows = valueRanges[2]?.values || [];
      const gcash: GCashTransaction[] = gcashRows
        .filter((r: any[]) => r[0])
        .map((r: any[], idx: number) => ({
          id: `GC-${idx + 1}`,
          date: String(r[0] || ''),
          type: (String(r[1] || 'Cash In') as any),
          reference: String(r[2] || ''),
          amount: Number(r[3]) || 0,
          fee: Number(r[4]) || 0,
          notes: String(r[5] || ''),
          cashImpact: Number(r[6]) || 0,
        }));

      // Parse Expenses (range 3)
      const expenseRows = valueRanges[3]?.values || [];
      const expenses: Expense[] = expenseRows
        .filter((r: any[]) => r[0])
        .map((r: any[], idx: number) => ({
          id: `EXP-${idx + 1}`,
          date: String(r[0] || ''),
          category: String(r[1] || 'Other'),
          description: String(r[2] || ''),
          amount: Number(r[3]) || 0,
        }));

      // Parse Utang (range 4)
      const utangRows = valueRanges[4]?.values || [];
      const utang: UtangRecord[] = utangRows
        .filter((r: any[]) => r[1])
        .map((r: any[], idx: number) => ({
          id: `UT-${idx + 1}`,
          date: String(r[0] || '').slice(0, 10),
          customer: String(r[1] || ''),
          description: String(r[2] || ''),
          qty: Number(r[3]) || 0,
          amount: Number(r[4]) || 0,
          saleId: String(r[5] || ''),
          cashier: String(r[6] || ''),
          status: (String(r[7] || 'Unpaid') as any),
        }));

      // Parse Users (range 5)
      const usersRows = valueRanges[5]?.values || [];
      const users: POSUser[] = usersRows
        .filter((r: any[]) => r[0] && r[1])
        .map((r: any[]) => ({
          id: String(r[0]),
          username: String(r[1]),
          name: String(r[2] || ''),
          role: (String(r[3] || 'Cashier') as any),
          pin: String(r[4] || '1234'),
          status: (String(r[5] || 'Active') as any),
          createdAt: String(r[6] || new Date().toISOString().slice(0, 10)),
        }));

      return {
        success: true,
        message: `Successfully synchronized from Google Sheets: ${items.length} items, ${sales.length} sales loaded.`,
        items: items.length > 0 ? items : undefined,
        sales: sales.length > 0 ? sales : undefined,
        gcash: gcash.length > 0 ? gcash : undefined,
        expenses: expenses.length > 0 ? expenses : undefined,
        utang: utang.length > 0 ? utang : undefined,
        users: users.length > 0 ? users : undefined,
      };
    } catch (err: any) {
      console.error('Error fetching sheet data:', err);
      return {
        success: false,
        message: err.message || 'Failed to pull from Google Sheets',
      };
    }
  }

  /**
   * Appends a new sale row into the Sales sheet and updates Utang/Stock if applicable
   */
  public static async recordSale(
    spreadsheetId: string,
    accessToken: string,
    sale: Sale
  ): Promise<boolean> {
    try {
      const dateStr = new Date().toISOString();
      const summary = sale.items.map((i) => `${i.qty}× ${i.name}`).join(', ');

      const salesRow = [
        sale.id,
        dateStr,
        summary,
        sale.total,
        sale.paymentMethod,
        sale.tendered,
        sale.change,
        sale.cashier || 'Cashier 1',
        sale.customer || '',
      ];

      // Append to Sales tab
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sales!A:I:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [salesRow],
          }),
        }
      );

      // If Utang, append to Utang tab
      if (sale.paymentMethod === 'Utang' && sale.customer) {
        const utangRows = sale.items.map((it) => [
          dateStr.slice(0, 10),
          sale.customer,
          it.name,
          it.qty,
          Math.round(it.qty * it.price * 100) / 100,
          sale.id,
          sale.cashier || 'Cashier 1',
          'Unpaid',
        ]);

        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Utang!A:H:append?valueInputOption=USER_ENTERED`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              values: utangRows,
            }),
          }
        );
      }

      // Append to Stock Movement tab
      const stockMovementRows = sale.items.map((it) => [
        dateStr,
        it.barcode,
        it.name,
        'Sale (out)',
        -it.qty,
      ]);

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Stock%20Movement!A:E:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: stockMovementRows,
          }),
        }
      ).catch(() => {});

      return true;
    } catch (err) {
      console.error('Failed to append sale to Google Sheets:', err);
      return false;
    }
  }

  /**
   * Appends GCash transaction to GCash Transactions tab
   */
  public static async recordGCash(
    spreadsheetId: string,
    accessToken: string,
    tx: GCashTransaction
  ): Promise<boolean> {
    try {
      const row = [
        new Date().toISOString(),
        tx.type,
        tx.reference,
        tx.amount,
        tx.fee,
        tx.notes,
        tx.cashImpact,
      ];
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/GCash%20Transactions!A:G:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [row] }),
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Appends expense to Expenses tab
   */
  public static async recordExpense(
    spreadsheetId: string,
    accessToken: string,
    exp: Expense
  ): Promise<boolean> {
    try {
      const row = [exp.date, exp.category, exp.description, exp.amount];
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Expenses!A:D:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [row] }),
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Appends or updates a POS User to Users tab
   */
  public static async recordUser(
    spreadsheetId: string,
    accessToken: string,
    user: POSUser
  ): Promise<boolean> {
    try {
      const row = [
        user.id,
        user.username,
        user.name,
        user.role,
        user.pin,
        user.status,
        user.createdAt,
      ];
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Users!A:G:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [row] }),
        }
      );
      return res.ok;
    } catch (err) {
      console.error('Failed to append user to Google Sheets:', err);
      return false;
    }
  }

  /**
   * Appends purchase record to Purchases tab
   */
  public static async recordPurchase(
    spreadsheetId: string,
    accessToken: string,
    purchase: {
      id: string;
      date: string;
      supplier: string;
      itemsSummary: string;
      totalCost: number;
      status: string;
    }
  ): Promise<boolean> {
    try {
      const row = [
        purchase.id,
        purchase.date,
        purchase.supplier,
        purchase.itemsSummary,
        purchase.totalCost,
        purchase.status,
      ];
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Purchases!A:F:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [row] }),
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Appends manual or inventory stock movement to Stock Movement tab
   */
  public static async recordStockMovement(
    spreadsheetId: string,
    accessToken: string,
    movement: {
      barcode: string;
      name: string;
      reason: string;
      qtyChange: number;
    }
  ): Promise<boolean> {
    try {
      const row = [
        new Date().toISOString(),
        movement.barcode,
        movement.name,
        movement.reason,
        movement.qtyChange,
      ];
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Stock%20Movement!A:E:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [row] }),
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  }
}
