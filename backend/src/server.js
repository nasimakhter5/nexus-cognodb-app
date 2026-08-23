import "dotenv/config";
import express from "express";
import cors from "cors";
import { verifyConnection } from "./db.js";
import * as queries from "./queries.js";

const app = express();
app.use(cors());
app.use(express.json());

let dbAvailable = false;

// Every route goes through this so the frontend always gets a clean,
// predictable error shape instead of a raw driver stack trace.
function handle(fn) {
  return async (req, res) => {
    if (!dbAvailable) {
      return res.status(503).json({
        error: "Database unavailable",
        message:
          "Nexus can't reach CognoDB right now. Check that your instance is running and backend/.env has the correct connection details.",
      });
    }
    try {
      const data = await fn(req, res);
      res.json(data);
    } catch (err) {
      console.error(`[api] Error in ${req.method} ${req.path}:`, err.message);
      res.status(500).json({
        error: "Query failed",
        message: "Something went wrong running that query. Please try again.",
      });
    }
  };
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, dbAvailable });
});

app.get(
  "/api/skills",
  handle(async () => queries.listSkills())
);

app.get(
  "/api/people",
  handle(async () => queries.listPeople())
);

app.get(
  "/api/people/search",
  handle(async (req) => {
    const q = req.query.q || "";
    if (q.trim().length < 2) return [];
    return queries.searchPeopleByName(q);
  })
);

app.get(
  "/api/people/:id",
  handle(async (req) => {
    const profile = await queries.getPersonProfile(req.params.id);
    if (!profile) {
      const err = new Error("Person not found");
      err.status = 404;
      throw err;
    }
    return profile;
  })
);

app.get(
  "/api/skills/:name/holders",
  handle(async (req) => {
    const minLevel = req.query.minLevel || "beginner";
    return queries.findPeopleBySkill(req.params.name, minLevel);
  })
);

// The headline multi-hop query: "who in my network knows X"
app.get(
  "/api/network/:personId/skill/:skillName",
  handle(async (req) => {
    const maxHops = Math.min(Number(req.query.maxHops) || 3, 4);
    return queries.findSkillHoldersInNetwork(
      req.params.personId,
      req.params.skillName,
      maxHops
    );
  })
);

// Shortest connection path between two people
app.get(
  "/api/connection",
  handle(async (req) => {
    const { from, to } = req.query;
    if (!from || !to) {
      const err = new Error("Both 'from' and 'to' query params are required");
      err.status = 400;
      throw err;
    }
    const path = await queries.findConnectionPath(from, to);
    if (!path) {
      return { connected: false };
    }
    return { connected: true, ...path };
  })
);

app.get(
  "/api/teams/:teamName/skill-gaps",
  handle(async (req) => queries.findTeamSkillGaps(req.params.teamName))
);

const PORT = process.env.PORT || 4000;

async function start() {
  dbAvailable = await verifyConnection();
  if (!dbAvailable) {
    console.warn(
      "[server] Starting anyway - API will return 503 until CognoDB is reachable."
    );
  }
  app.listen(PORT, () => {
    console.log(`[server] Nexus API listening on http://localhost:${PORT}`);
  });
}

start();
