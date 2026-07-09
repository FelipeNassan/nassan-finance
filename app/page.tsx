// Este servidor Next.js é apenas o BACKEND (API) do fortn.
// A interface é o app Expo em `mobile/`. Não há mais telas web aqui.
export default function Home() {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 560,
        margin: "80px auto",
        padding: "0 24px",
        lineHeight: 1.6,
        color: "#1b1c1b",
      }}
    >
      <h1 style={{ color: "#755a26" }}>fortn — API</h1>
      <p>
        Este endereço é o <strong>backend</strong> do fortn. A interface é o app
        (React Native + Expo) na pasta <code>mobile/</code>.
      </p>
      <p>Endpoints disponíveis:</p>
      <ul>
        <li>
          <code>GET /api/resumo</code>
        </li>
        <li>
          <code>GET /api/despesas</code> · <code>POST /api/despesas</code>
        </li>
        <li>
          <code>GET /api/referencias</code>
        </li>
      </ul>
    </main>
  );
}
