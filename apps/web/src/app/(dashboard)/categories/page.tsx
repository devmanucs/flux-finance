import { Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@flux-finance/ui/components/ui/button";
import { Card, CardContent } from "@flux-finance/ui/components/ui/card";
import { Icon } from "@flux-finance/ui/components/ui/icon";
import { CategoryFormDialog, CategoryList } from "@/features/categories";

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold">Categorias</h2>
        <CategoryFormDialog
          trigger={
            <Button>
              <Icon icon={Add01Icon} data-icon="inline-start" />
              Nova categoria
            </Button>
          }
        />
      </div>
      <Card>
        <CardContent>
          <CategoryList />
        </CardContent>
      </Card>
    </div>
  );
}
