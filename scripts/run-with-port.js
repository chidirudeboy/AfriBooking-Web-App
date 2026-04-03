const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const [, , command, ...args] = process.argv;

if (!command) {
  console.error("Missing command to run.");
  process.exit(1);
}

const envFiles = (process.env.PORT_ENV_FILES || "")
  .split(",")
  .map((file) => file.trim())
  .filter(Boolean);

const readPortFromFile = (file) => {
  const filePath = path.resolve(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const portLine = lines.find((line) => line.trim().startsWith("PORT="));

  if (!portLine) {
    return null;
  }

  return portLine.split("=").slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
};

const resolvedPort =
  process.env.PORT ||
  envFiles.map(readPortFromFile).find(Boolean) ||
  process.env.DEFAULT_PORT ||
  "3002";

const child = spawn(command, args, {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    PORT: resolvedPort,
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
