import {
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  PluggyClient,
  type Account as PluggySdkAccount,
  type Item as PluggySdkItem,
  type Transaction as PluggySdkTransaction,
} from "pluggy-sdk";

export type PluggyItem = Pick<
  PluggySdkItem,
  "id" | "status" | "clientUserId" | "connector"
>;

export type PluggyAccount = Pick<
  PluggySdkAccount,
  "id" | "itemId" | "name" | "marketingName" | "type" | "subtype" | "balance" | "currencyCode"
>;

export type PluggyTransaction = Pick<
  PluggySdkTransaction,
  "id" | "accountId" | "description" | "amount" | "type" | "status"
> & { date: string };

@Injectable()
export class PluggyApiService {
  private client: PluggyClient | null = null;

  async createConnectToken(
    options: {
      clientUserId: string;
      webhookUrl?: string;
      avoidDuplicates: boolean;
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

  async listAccounts(itemId: string): Promise<PluggyAccount[]> {
    const response = await this.run(() => this.getClient().fetchAccounts(itemId));
    return response.results;
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
