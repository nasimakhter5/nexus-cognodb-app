import neo4j from "neo4j-driver";
import "dotenv/config";

const { COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD } = process.env;

if (!COGNODB_URI || !COGNODB_USER || !COGNODB_PASSWORD) {
  console.error(
    "[db] Missing CognoDB connection details. Copy .env.example to .env and fill in COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD."
  );
}

// Single shared driver instance for the whole app.
export const driver = neo4j.driver(
  COGNODB_URI,
  neo4j.auth.basic(COGNODB_USER, COGNODB_PASSWORD),
  { maxConnectionPoolSize: 20 }
);

// Verifies the driver can actually reach CognoDB. Called once at server boot
// so we fail fast with a clear message instead of failing on the first request.
export async function verifyConnection() {
  try {
    await driver.verifyConnectivity();
    console.log("[db] Connected to CognoDB successfully.");
    return true;
  } catch (err) {
    console.error("[db] Could not connect to CognoDB:", err.message);
    return false;
  }
}

// Wraps a read query in a session and always closes it, even on error.
export async function runRead(cypher, params = {}) {
  const session = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

// Wraps a write query in a session and always closes it, even on error.
export async function runWrite(cypher, params = {}) {
  const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

export async function closeDriver() {
  await driver.close();
}
