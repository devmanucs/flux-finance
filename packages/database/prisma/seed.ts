import { prisma } from "../src/client";

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@flux.finance" },
    update: {},
    create: { name: "Conta Demo", email: "demo@flux.finance" },
  });

  const account = await prisma.account.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      userId: user.id,
      name: "Carteira",
      type: "CHECKING",
    },
  });

  console.log(`Seed ok: user #${user.id}, account #${account.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
