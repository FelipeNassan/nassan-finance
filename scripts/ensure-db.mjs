// Garante que o Postgres (container fortn-db) esteja de pé antes de subir o backend.
// Abre o Docker Desktop e espera, caso o daemon não esteja rodando.
import { execSync, spawn } from "node:child_process";

function dockerRodando() {
  try {
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function dormir(ms) {
  // sleep síncrono e multiplataforma (sem depender de sleep/ping externos)
  const fim = Date.now() + ms;
  while (Date.now() < fim) {
    /* espera ocupada — só em setup, sem impacto */
  }
}

if (!dockerRodando()) {
  console.log("→ Docker parado. Abrindo o Docker Desktop...");
  if (process.platform === "win32") {
    const caminho = `${process.env.ProgramFiles}\\Docker\\Docker\\Docker Desktop.exe`;
    spawn("cmd", ["/c", "start", "", caminho], { detached: true, stdio: "ignore" });
  } else {
    console.log("  Abra o Docker manualmente.");
  }

  const limite = Date.now() + 120000; // até 2 min
  process.stdout.write("  Aguardando o Docker subir");
  while (!dockerRodando()) {
    if (Date.now() > limite) {
      console.error("\n✗ Docker não subiu a tempo. Abra o Docker Desktop e rode de novo.");
      process.exit(1);
    }
    process.stdout.write(".");
    dormir(3000);
  }
  console.log(" ok");
}

try {
  execSync("docker start fortn-db", { stdio: "ignore" });
  console.log("→ Postgres (fortn-db) pronto na porta 5432.");
} catch {
  console.error("✗ Não consegui iniciar o container fortn-db. Confira com: docker ps -a");
  process.exit(1);
}
