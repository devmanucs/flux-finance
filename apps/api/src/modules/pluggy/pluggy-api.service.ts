import {
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  PluggyClient,
  type Account as PluggySdkAccount,
  type CreditCardBills,
  type Investment as PluggySdkInvestment,
  type Item as PluggySdkItem,
  type Transaction as PluggySdkTransaction,
} from "pluggy-sdk";

export type PluggyItem = Pick<
  PluggySdkItem,
  "id" | "status" | "clientUserId" | "connector"
>;

export type PluggyAccount = Pick<
  PluggySdkAccount,
  "id" | "itemId" | "name" | "marketingName" | "type" | "subtype" | "balance" | "currencyCode" | "bankData"
>;

export type PluggyAccountWithCredit = PluggyAccount & Pick<PluggySdkAccount, "creditData">;

export type PluggyTransaction = Pick<
  PluggySdkTransaction,
  "id" | "accountId" | "description" | "amount" | "type" | "status" | "categoryId" | "creditCardMetadata"
> & { date: string };

export type PluggyCategory = {
  id: string;
  description: string;
  descriptionTranslated?: string;
  parentId?: string;
};

export type PluggyInvestment = Pick<
  PluggySdkInvestment,
  "id" | "name" | "type" | "subtype" | "balance" | "status"
>;

export type PluggyBill = Pick<
  CreditCardBills,
  "id" | "dueDate" | "billClosingDate" | "totalAmount" | "minimumPaymentAmount" | "payments"
>;

@Injectable()
export class PluggyApiService {
  private client: PluggyClient | null = null;

  async createConnectToken(
    options: {
      clientUserId: string;
      webhookUrl?: string;
    },
    itemId?: string,
  ) {
    const response = await this.run(() =>
      this.getClient().createConnectToken(itemId, options),
    );
    return response.accessToken;
  }

  getItem(itemId: string): Promise<PluggyItem> {
    return this.run(() => this.getClient().fetchItem(itemId));
  }

  async listAccounts(itemId: string): Promise<PluggyAccountWithCredit[]> {
    const response = await this.run(() => this.getClient().fetchAccounts(itemId));
    return response.results;
  }

  // A árvore de categorias da Pluggy é fixa; busca uma vez por processo.
  private categories: Promise<Map<string, PluggyCategory>> | null = null;

  listCategories(): Promise<Map<string, PluggyCategory>> {
    this.categories ??= this.run(async () => {
      const response = await this.getClient().fetchCategories();
      return new Map(
        (response.results as PluggyCategory[]).map((category) => [category.id, category]),
      );
    }).catch((error) => {
      this.categories = null;
      throw error;
    });
    return this.categories;
  }

  async listInvestments(itemId: string): Promise<PluggyInvestment[]> {
    return this.fetchAllPages((page) =>
      this.getClient().fetchInvestments(itemId, undefined, { page, pageSize: 100 }),
    );
  }

  async listCreditCardBills(accountId: string): Promise<PluggyBill[]> {
    return this.fetchAllPages((page) =>
      this.getClient().fetchCreditCardBills(accountId, { page, pageSize: 100 }),
    );
  }

  private async fetchAllPages<T>(
    fetchPage: (page: number) => Promise<{ results: T[]; totalPages: number }>,
  ): Promise<T[]> {
    const results: T[] = [];
    for (let page = 1; ; page += 1) {
      const response = await this.run(() => fetchPage(page));
      results.push(...response.results);
      if (page >= response.totalPages || response.results.length === 0) return results;
    }
  }

  async listTransactions(
    accountId: string,
    filters: { createdAtFrom?: string; ids?: string[] } = {},
  ): Promise<PluggyTransaction[]> {
    const transactions = await this.run(() =>
      this.getClient().fetchAllTransactions(accountId, filters),
    );
    return transactions.map((transaction) => ({
      ...transaction,
      date: transaction.date instanceof Date
        ? transaction.date.toISOString()
        : String(transaction.date),
    }));
  }

  deleteItem(itemId: string) {
    return this.run(() => this.getClient().deleteItem(itemId));
  }

  private getClient() {
    if (this.client) return this.client;

    const clientId = process.env.PLUGGY_CLIENT_ID;
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        "Pluggy ainda não está configurado no servidor. Defina PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET.",
      );
    }

    this.client = new PluggyClient({ clientId, clientSecret });
    return this.client;
  }

  private async run<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException("Falha ao consultar a Pluggy.");
    }
  }
}
