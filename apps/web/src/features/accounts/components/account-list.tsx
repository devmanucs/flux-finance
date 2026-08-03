"use client";

import { Badge } from "@flux-finance/ui/components/ui/badge";
import { Button } from "@flux-finance/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@flux-finance/ui/components/ui/card";
import { useAccounts } from "../api/queries";
import { accountTypeOptions, DEBT_ACCOUNT_TYPES } from "../schemas/account-schema";
import { AccountFormDialog } from "./account-form-dialog";
import { DeleteAccountButton } from "./delete-account-button";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function typeLabel(type: string) {
  return accountTypeOptions.find((option) => option.value === type)?.label ?? type;
}

export function AccountList() {
  const { data: accounts = [], isPending } = useAccounts();

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Carregando contas...</p>;
  }

  if (accounts.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada ainda.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => {
        const isDebt = DEBT_ACCOUNT_TYPES.includes(account.type as (typeof DEBT_ACCOUNT_TYPES)[number]);
        const amount = Number(account.balance);

        return (
          <Card key={account.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{account.name}</CardTitle>
                <Badge variant="outline">{typeLabel(account.type)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {isDebt ? "Você deve" : "Saldo atual"}
                </p>
                <p
                  className={
                    isDebt
                      ? "font-heading text-xl font-semibold text-destructive"
                      : "font-heading text-xl font-semibold"
                  }
                >
                  {currency.format(amount)}
                </p>
              </div>
              <div className="flex gap-2">
                <AccountFormDialog
                  account={account}
                  trigger={
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  }
                />
                <DeleteAccountButton account={account} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
