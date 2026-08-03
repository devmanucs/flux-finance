// Ponto de extensão único pro token de autenticação: quando a feature `auth`
// existir de fato (login, refresh, etc.), ela troca esta implementação por uma
// leitura real (cookie/localStorage). Por enquanto não há sessão, então o
// axios simplesmente não envia Authorization.
export function getStoredToken(): string | null {
  return null;
}
