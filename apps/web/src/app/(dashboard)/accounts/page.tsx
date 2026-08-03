import { Button } from "@flux-finance/ui/components/ui/button";
import { AccountFormDialog, AccountList } from "@/features/accounts";

export default function AccountsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold">Contas e cartões</h2>
        <AccountFormDialog trigger={<Button>Nova conta</Button>} />
      </div>
      <AccountList />
    </div>
  );
}
