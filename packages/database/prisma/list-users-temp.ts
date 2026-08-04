import { prisma } from "../src/client";

const testEmails = [
  "teste-script@flux.finance",
  "teste-config@flux.finance",
  "teste-ps@flux.finance",
];

async function main() {
  for (const email of testEmails) {
    try {
      const deleted = await prisma.user.delete({ where: { email } });
      console.log("removido", deleted.email);
    } catch (error) {
      console.log("nao encontrado ou erro:", email, (error as Error).message);
    }
  }

  const remaining = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log("restantes:", JSON.stringify(remaining));
}

main().finally(() => prisma.$disconnect());
