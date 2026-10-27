import { setTimeout as delay } from "node:timers/promises";

const baseUrl = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3210").replace(/\/+$/, "");
const routes = [
  "/",
  "/registro",
  "/cuenta",
  "/catalogo",
  "/miembros",
  "/investigacion",
  "/auditoria",
  "/hcu",
  "/vetra",
  "/roadmap",
  "/resolver",
  "/recursos",
  "/membresia",
  "/politica-editorial",
  "/privacidad",
  "/terminos",
  "/contribuir",
];

async function request(path, options = {}) {
  return fetch(new URL(path, baseUrl), { redirect: "manual", signal: AbortSignal.timeout(8000), ...options });
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await request("/");
      if (response.status < 500) return;
      lastError = new Error("Homepage returned HTTP " + response.status);
    } catch (error) {
      lastError = error;
    }
    await delay(350);
  }
  throw new Error("Next.js server did not become ready at " + baseUrl + ": " + String(lastError));
}

await waitForServer();
const failures = [];
for (const path of routes) {
  try {
    const response = await request(path);
    const contentType = response.headers.get("content-type") || "";
    if (response.status !== 200) failures.push(path + " returned HTTP " + response.status);
    if (!contentType.toLowerCase().includes("text/html")) failures.push(path + " returned unexpected content-type: " + contentType);
    await response.body?.cancel();
    process.stdout.write("PASS " + path + " — HTTP " + response.status + "\n");
  } catch (error) {
    failures.push(path + " failed: " + String(error));
  }
}

try {
  const legacy = await request("/comunidad");
  const location = legacy.headers.get("location");
  const targetPath = location ? new URL(location, baseUrl).pathname : "";
  if (![301, 302, 307, 308].includes(legacy.status) || targetPath !== "/miembros") {
    failures.push("/comunidad must redirect to /miembros (got HTTP " + legacy.status + ", location " + String(location) + ")");
  } else {
    process.stdout.write("PASS /comunidad — redirects to /miembros\n");
  }
  await legacy.body?.cancel();
} catch (error) {
  failures.push("/comunidad redirect failed: " + String(error));
}

try {
  const proposals = await request("/api/vetra/proposals");
  if (![401, 503].includes(proposals.status)) failures.push("/api/vetra/proposals should deny unauthenticated access or remain gated (got HTTP " + proposals.status + ")");
  else process.stdout.write("PASS /api/vetra/proposals — unauthenticated access is gated (HTTP " + proposals.status + ")\n");
  await proposals.body?.cancel();
} catch (error) {
  failures.push("/api/vetra/proposals access check failed: " + String(error));
}

if (failures.length) {
  process.stderr.write("\nROUTE SMOKE TEST FAILURES (" + failures.length + ")\n");
  for (const failure of failures) process.stderr.write("- " + failure + "\n");
  process.exitCode = 1;
} else {
  process.stdout.write("\nAll " + (routes.length + 2) + " route and access smoke checks passed. This is not a browser, accessibility, identity-provider or production-environment audit.\n");
}
