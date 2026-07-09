// Sobe backend + app Expo com um comando só, mantendo o QR code do Expo.
// O Expo recebe o terminal (TTY) para desenhar o QR e aceitar atalhos;
// o backend roda ao lado com os logs prefixados com [backend].
import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

// 1. Garante o Postgres (reaproveita o script existente; ele sai com erro se falhar)
await import("./ensure-db.mjs");

// 2. Backend em segundo plano, com saída prefixada
function prefixar(buf) {
  return (
    buf
      .toString()
      .split(/\r?\n/)
      .filter((l) => l.length > 0)
      .map((l) => `\x1b[34m[backend]\x1b[0m ${l}`)
      .join("\n") + "\n"
  );
}

// Comando como string única + shell:true evita o aviso DEP0190 e funciona no
// Windows (cmd) e Unix (sh); no Windows é preciso shell para resolver o npm.
const backend = spawn("npm run dev", {
  cwd: raiz,
  shell: true,
});
backend.stdout.on("data", (d) => process.stdout.write(prefixar(d)));
backend.stderr.on("data", (d) => process.stdout.write(prefixar(d)));

// 3. Expo em primeiro plano — herda o terminal, então mostra o QR code e os atalhos
const app = spawn("npm --prefix mobile run start", {
  cwd: raiz,
  stdio: "inherit",
  shell: true,
});

// 4. Encerrar os dois juntos (Ctrl+C ou quando um deles cair)
let encerrando = false;
function matar(proc) {
  if (!proc.pid) return;
  try {
    if (process.platform === "win32") {
      // audit-ok: pid é número do próprio child process, não entrada externa
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: "ignore" });
    } else {
      proc.kill("SIGTERM");
    }
  } catch {
    /* já morreu */
  }
}
function encerrar() {
  if (encerrando) return;
  encerrando = true;
  matar(backend);
  matar(app);
  process.exit(0);
}

process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);
backend.on("exit", encerrar);
app.on("exit", encerrar);
