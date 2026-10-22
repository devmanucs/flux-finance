"use client";

import { useState } from "react";
import { Add01Icon, ArrowDown01Icon, BankIcon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@flux-finance/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@flux-finance/ui/components/ui/dropdown-menu";
import { Icon } from "@flux-finance/ui/components/ui/icon";
import { usePluggyConnect } from "@/features/pluggy/components/pluggy-connections-panel";
import { AccountFormDialog } from "./account-form-dialog";

export function NewAccountMenu() {
  const [manualOpen, setManualOpen] = useState(false);
  const { connect, isBusy } = usePluggyConnect();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button>
              <Icon icon={Add01Icon} data-icon="inline-start" />
              Nova conta
              <Icon icon={ArrowDown01Icon} data-icon="inline-end" className="opacity-60" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="min-w-60">
          <DropdownMenuItem disabled={isBusy} onClick={connect}>
            <Icon icon={BankIcon} />
            <div className="flex flex-col">
              <span>Conectar banco</span>
              <span className="text-xs font-normal text-muted-foreground">Saldo e transações automáticos</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setManualOpen(true)}>
            <Icon icon={Wallet01Icon} />
            <div className="flex flex-col">
              <span>Conta manual</span>
              <span className="text-xs font-normal text-muted-foreground">Dinheiro, vale ou conta fora do Open Finance</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AccountFormDialog open={manualOpen} onOpenChange={setManualOpen} />
    </>
  );
}
