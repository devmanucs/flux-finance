import { Button } from "@flux-finance/ui/components/ui/button";
import { Card, CardContent } from "@flux-finance/ui/components/ui/card";
import { CategoryFormDialog, CategoryList } from "@/features/categories";

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold">Categorias</h2>
        <CategoryFormDialog trigger={<Button>Nova categoria</Button>} />
      </div>
      <Card>
        <CardContent>
          <CategoryList />
        </CardContent>
      </Card>
    </div>
  );
}
