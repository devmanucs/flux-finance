"use client";

import { Badge } from "@flux-finance/ui/components/ui/badge";
import { Button } from "@flux-finance/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@flux-finance/ui/components/ui/table";
import { useCategories } from "../api/queries";
import { CategoryFormDialog } from "./category-form-dialog";
import { DeleteCategoryButton } from "./delete-category-button";

export function CategoryList() {
  const { data: categories = [], isPending } = useCategories();

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Carregando categorias...</p>;
  }

  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada ainda.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell>
              <span className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: category.color ?? undefined }}
                />
                {category.name}
              </span>
            </TableCell>
            <TableCell>
              <Badge variant={category.kind === "INCOME" ? "default" : "destructive"}>
                {category.kind === "INCOME" ? "Receita" : "Despesa"}
              </Badge>
            </TableCell>
            <TableCell className="flex justify-end gap-2">
              <CategoryFormDialog
                category={category}
                trigger={
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                }
              />
              <DeleteCategoryButton category={category} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
