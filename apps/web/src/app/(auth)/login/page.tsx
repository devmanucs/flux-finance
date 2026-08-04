import { LoginForm } from "@/features/auth";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@flux-finance/ui/components/ui/frame";

export default function LoginPage() {
  return (
    <Frame className="w-full">
      <FrameHeader>
        <FrameTitle className="mt-2 text-balance font-heading text-3xl leading-tight tracking-tight">
          Controle seu fluxo de gastos
        </FrameTitle>
        <FrameDescription className="mt-2 text-muted-foreground text-sm">
          Acesse sua conta para continuar.
        </FrameDescription>
      </FrameHeader>
      <FramePanel>
        <LoginForm />
      </FramePanel>
    </Frame>
  );
}
