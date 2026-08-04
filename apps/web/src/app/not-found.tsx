import Link from "next/link";
import { Home01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@flux-finance/ui/components/ui/button";
import { Icon } from "@flux-finance/ui/components/ui/icon";
import { NotFoundState } from "@flux-finance/ui/components/ui/status-state";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-16">
      <NotFoundState
        className="max-w-md"
        action={
          <Button nativeButton={false} render={<Link href="/" />}>
            <Icon icon={Home01Icon} />
            Voltar para o início
          </Button>
        }
      />
    </div>
  );
}
