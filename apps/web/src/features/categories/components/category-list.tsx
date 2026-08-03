"use client";

import { PencilEdit02Icon, Tag01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@flux-finance/ui/components/ui/button";
import { Icon } from "@flux-finance/ui/components/ui/icon";
import { Skeleton } from "@flux-finance/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@flux-finance/ui/components/ui/table";
import { EmptyState, ErrorState, UnauthorizedState } from "@flux-finance/ui/components/ui/status-state";
import { getErrorStatus, isPermissionError } from "@/lib/api/get-error-status";
import { useCategories } from "../api/queries";
import { CategoryFormDialog } from "./category-form-dialog";
import { DeleteCategoryButton } from "./delete-category-button";

function CategoryRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="size-3 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell className="flex justify-end gap-1">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="size-8 rounded-full" />
      </TableCell>
    </TableRow>
  );
}

export function CategoryList() {
  const { data: categories = [], isPending, isError, error, refetch } = useCategories();

  if (isPending) {
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
          <CategoryRowSkeleton />
          <CategoryRowSkeleton />
          <CategoryRowSkeleton />
        </TableBody>
      </Table>
    );
  }

  if (isError) {
    return isPermissionError(error) ? (
      <UnauthorizedState description="Você precisa entrar novamente para ver suas categorias." />
    ) : (
      <ErrorState
        description={`Não foi possível carregar suas categorias${getErrorStatus(error) ? ` (erro ${getErrorStatus(error)})` : ""}.`}
        onRetry={() => refetch()}
      />
    );
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={Tag01Icon}
        title="Nenhuma categoria cadastrada"
        description="Categorias organizam suas transações e alimentam o gráfico de gastos do dashboard."
        action={
          <CategoryFormDialog trigger={<Button size="sm">Criar primeira categoria</Button>} />
        }
      />
    );
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
              <span className="text-sm text-muted-foreground">
                {category.kind === "INCOME" ? "Receita" : "Despesa"}
              </span>
            </TableCell>
            <TableCell className="flex justify-end gap-1">
              <CategoryFormDialog
                category={category}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Editar ${category.name}`}
                  >
                    <Icon icon={PencilEdit02Icon} />
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
