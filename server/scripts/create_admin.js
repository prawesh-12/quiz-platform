import "dotenv/config";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      args[key] = "true";
      continue;
    }

    args[key] = value;
    i += 1;
  }

  return args;
}

function printUsage() {
  console.log(
    [
      "Usage:",
      '  node scripts/create_admin.js --password "YourStrongPassword" [--email admin@quizloom.com] [--name "Main Admin"]',
      "",
      "Purpose:",
      "  Generates ADMIN_PASSWORD_HASH and prints env values for .env",
      "",
      "Example output:",
      "  ADMIN_EMAIL=admin@quizloom.com",
      "  ADMIN_PASSWORD_HASH=$2a$12$...",
      "  ADMIN_NAME=Main Admin"
    ].join("\n")
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help === "true") {
    printUsage();
    return;
  }

  const password = String(args.password || "");
  const email = String(args.email || process.env.ADMIN_EMAIL || "admin@quizloom.com")
    .trim()
    .toLowerCase();
  const name = String(args.name || process.env.ADMIN_NAME || "Main Admin").trim();

  if (!password) {
    console.error("Missing required argument: --password");
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  console.log("Set these in server/.env:");
  console.log(`ADMIN_EMAIL=${email}`);
  console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
  console.log(`ADMIN_NAME=${name}`);
}

main().catch((error) => {
  console.error("Failed to generate admin hash:", error.message);
  process.exitCode = 1;
});
