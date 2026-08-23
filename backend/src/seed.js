// Loads the Nexus seed data into CognoDB.
// Run with: npm run seed   (after filling in backend/.env)
import "dotenv/config";
import { driver, runWrite, verifyConnection, closeDriver } from "./db.js";
import {
  COMPANY,
  TEAMS,
  SKILLS,
  PEOPLE,
  CROSS_TEAM_BRIDGES,
  HAS_SKILL,
} from "./seedData.js";

async function clearDatabase() {
  console.log("[seed] Clearing existing data...");
  await runWrite("MATCH (n) DETACH DELETE n");
}

async function createConstraints() {
  console.log("[seed] Creating uniqueness constraints...");
  const constraints = [
    "CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE",
    "CREATE CONSTRAINT skill_name IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE",
    "CREATE CONSTRAINT team_name IF NOT EXISTS FOR (t:Team) REQUIRE t.name IS UNIQUE",
    "CREATE CONSTRAINT company_name IF NOT EXISTS FOR (c:Company) REQUIRE c.name IS UNIQUE",
  ];
  for (const c of constraints) {
    await runWrite(c);
  }
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function createCompanyAndTeams() {
  console.log("[seed] Creating company and teams...");
  await runWrite("MERGE (c:Company {name: $name})", { name: COMPANY.name });
  for (const team of TEAMS) {
    await runWrite(
      `MERGE (t:Team {name: $name})
       WITH t
       MATCH (c:Company {name: $company})
       MERGE (t)-[:PART_OF]->(c)`,
      { name: team.name, company: COMPANY.name }
    );
  }
}

async function createSkills() {
  console.log(`[seed] Creating ${SKILLS.length} skills...`);
  await runWrite(
    `UNWIND $skills AS skill
     MERGE (s:Skill {name: skill.name})
     SET s.category = skill.category`,
    { skills: SKILLS }
  );
}

async function createPeople() {
  console.log(`[seed] Creating ${PEOPLE.length} people...`);
  const rows = PEOPLE.map(([name, title, team, years, location]) => ({
    id: slugify(name),
    name,
    title,
    team,
    years,
    location,
    email: `${slugify(name).replace(/-/g, ".")}@orbitallabs.io`,
  }));
  await runWrite(
    `UNWIND $rows AS row
     MERGE (p:Person {id: row.id})
     SET p.name = row.name,
         p.title = row.title,
         p.yearsExperience = row.years,
         p.location = row.location,
         p.email = row.email
     WITH p, row
     MATCH (t:Team {name: row.team})
     MERGE (p)-[:MEMBER_OF]->(t)`,
    { rows }
  );
}

async function createSkillEdges() {
  console.log(`[seed] Creating ${HAS_SKILL.length} HAS_SKILL relationships...`);
  const rows = HAS_SKILL.map(([person, skill, level, years]) => ({
    personId: slugify(person),
    skill,
    level,
    years,
  }));
  await runWrite(
    `UNWIND $rows AS row
     MATCH (p:Person {id: row.personId})
     MATCH (s:Skill {name: row.skill})
     MERGE (p)-[r:HAS_SKILL]->(s)
     SET r.level = row.level, r.years = row.years`,
    { rows }
  );
}

async function createColleagueEdges() {
  console.log("[seed] Creating COLLEAGUE_OF network...");
  // Within each team: connect everyone to everyone (small teams, so this
  // stays realistic - a 5-6 person team really does all know each other).
  const teamGroups = {};
  for (const [name, , team] of PEOPLE) {
    teamGroups[team] = teamGroups[team] || [];
    teamGroups[team].push(name);
  }

  const pairs = [];
  for (const members of Object.values(teamGroups)) {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        pairs.push([members[i], members[j]]);
      }
    }
  }
  for (const [a, b] of CROSS_TEAM_BRIDGES) {
    pairs.push([a, b]);
  }

  const rows = pairs.map(([a, b]) => ({ a: slugify(a), b: slugify(b) }));
  await runWrite(
    `UNWIND $rows AS row
     MATCH (p1:Person {id: row.a})
     MATCH (p2:Person {id: row.b})
     MERGE (p1)-[:COLLEAGUE_OF]-(p2)`,
    { rows }
  );
  console.log(`[seed] Created ${pairs.length} colleague relationships.`);
}

async function main() {
  const ok = await verifyConnection();
  if (!ok) {
    console.error(
      "[seed] Aborting: could not connect to CognoDB. Check backend/.env values."
    );
    process.exit(1);
  }

  await clearDatabase();
  await createConstraints();
  await createCompanyAndTeams();
  await createSkills();
  await createPeople();
  await createSkillEdges();
  await createColleagueEdges();

  console.log("[seed] Done! Nexus graph loaded into CognoDB.");
  await closeDriver();
}

main().catch(async (err) => {
  console.error("[seed] Fatal error:", err);
  await closeDriver();
  process.exit(1);
});
