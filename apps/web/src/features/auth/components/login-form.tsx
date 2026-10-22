"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@flux-finance/ui/components/ui/button";
import { Kbd } from "@flux-finance/ui/components/ui/kbd";
import { Spinner } from "@flux-finance/ui/components/ui/spinner";
import { FormFields } from "@/components/forms/form-fields";
import { useLogin } from "../api/queries";
import { loginSchema, type LoginFormValues } from "../schemas/login-schema";

export function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { mutate, isPending } = useLogin();

  const onSubmit = form.handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => {
        router.push("/");
      },
      onError: (error) => {
        // Só o 401 significa credencial errada; sem resposta é API fora do ar.
        if (isAxiosError(error) && error.response?.status === 401) {
          form.setError("password", { message: "E-mail ou senha inválidos" });
        } else if (isAxiosError(error) && !error.response) {
          toast.error("Não foi possível conectar ao servidor. Tente novamente em instantes.");
        } else {
          toast.error("Não foi possível entrar agora. Tente novamente.");
        }
      },
    });
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormFields.Input<LoginFormValues>
          name="email"
          label="E-mail"
          type="email"
          placeholder="voce@exemplo.com"
          autoFocus
        />
        <FormFields.Input<LoginFormValues>
          name="password"
          label="Senha"
          type="password"
          placeholder="Insira sua senha"
        />
        <Button type="submit" size="lg" disabled={isPending} className="mt-2 w-full">
          {isPending ? (
            <>
              <Spinner />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
        <p className="text-center text-muted-foreground text-xs">
          <Kbd className="font-mono">↵</Kbd> para enviar
        </p>
      </form>
    </FormProvider>
  );
}
