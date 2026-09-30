// Load .env before anything reads process.env. Missing file is fine.
try {
  process.loadEnvFile(".env");
} catch {
  // no .env file
}
