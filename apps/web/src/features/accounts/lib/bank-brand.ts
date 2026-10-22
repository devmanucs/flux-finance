// Cor do quadradinho com a inicial do banco nos grupos de contas. Busca por
// trecho do nome porque o nome vem da Pluggy ("Banco Inter", "Nubank"...).
const BANK_BRANDS: Array<{ match: RegExp; color: string }> = [
  { match: /bradesco/i, color: "#CC092F" },
  { match: /inter\b/i, color: "#FF7A00" },
  { match: /nubank|nu pagamentos/i, color: "#820AD1" },
  { match: /ita[uú]/i, color: "#EC7000" },
  { match: /santander/i, color: "#EC0000" },
  { match: /banco do brasil/i, color: "#F8D117" },
  { match: /caixa/i, color: "#005CA9" },
  { match: /c6/i, color: "#242424" },
  { match: /picpay/i, color: "#11C76F" },
  { match: /mercado pago/i, color: "#00B1EA" },
  { match: /pagbank|pagseguro/i, color: "#1BB99A" },
  { match: /btg/i, color: "#001E62" },
  { match: /sicredi/i, color: "#3FA110" },
  { match: /sicoob/i, color: "#003641" },
];

const LIGHT_BRANDS = new Set(["#F8D117"]);

export function getBankBrand(name: string) {
  const color = BANK_BRANDS.find((brand) => brand.match.test(name))?.color;
  const initial = name.replace(/^banco\s+/i, "").trim().charAt(0).toUpperCase() || "?";
  return {
    initial,
    color: color ?? null,
    foreground: color && LIGHT_BRANDS.has(color) ? "#1a1a1a" : "#ffffff",
  };
}
