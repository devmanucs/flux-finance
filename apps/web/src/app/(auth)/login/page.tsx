import { LoginForm } from "@/features/auth";

export default function LoginPage() {
  return (
    <div className="w-full">
      <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em]">
        Bem-vinda de volta
      </div>
      <h1 className="mt-2 text-balance font-heading text-3xl leading-tight tracking-tight">
        Controle seu fluxo de gastos
      </h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Acesse sua conta para continuar.
      </p>

      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
