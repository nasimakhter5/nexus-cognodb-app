// All Cypher lives here, in one place, as parameterised queries.
// Every query function takes plain JS args and returns plain JS objects -
// routes never see a raw Neo4j record.
import { runRead } from "./db.js";

function toPerson(node) {
  const p = node.properties;
  return {
    id: p.id,
    name: p.name,
    title: p.title,
    email: p.email,
    location: p.location,
    yearsExperience: p.yearsExperience?.toNumber
      ? p.yearsExperience.toNumber()
      : p.yearsExperience,
  };
}

// --- 1. List all skills (grouped by category), used to populate the search UI.
export async function listSkills() {
  const records = await runRead(
    `MATCH (s:Skill)
     OPTIONAL MATCH (:Person)-[:HAS_SKILL]->(s)
     WITH s, count(*) AS peopleCount
     RETURN s.name AS name, s.category AS category, peopleCount
     ORDER BY s.category, s.name`
  );
  return records.map((r) => ({
    name: r.get("name"),
    category: r.get("category"),
    peopleCount: r.get("peopleCount").toNumber
      ? r.get("peopleCount").toNumber()
      : r.get("peopleCount"),
  }));
}

// --- 2. Find people who have a given skill, optionally filtered by minimum level.
// Simple one-hop query, but parameterised and level-aware.
export async function findPeopleBySkill(skillName, minLevel) {
  const levelRank = { beginner: 1, intermediate: 2, expert: 3 };
  const records = await runRead(
    `MATCH (p:Person)-[r:HAS_SKILL]->(s:Skill {name: $skillName})
     MATCH (p)-[:MEMBER_OF]->(t:Team)
     RETURN p, r.level AS level, r.years AS years, t.name AS team`,
    { skillName }
  );
  const minRank = levelRank[minLevel] || 0;
  return records
    .map((r) => ({
      ...toPerson(r.get("p")),
      team: r.get("team"),
      skillLevel: r.get("level"),
      skillYears: r.get("years")?.toNumber ? r.get("years").toNumber() : r.get("years"),
    }))
    .filter((p) => (levelRank[p.skillLevel] || 0) >= minRank)
    .sort((a, b) => (levelRank[b.skillLevel] || 0) - (levelRank[a.skillLevel] || 0));
}

// --- 3. THE multi-hop query: find people who know a skill, reachable from a
// given person within N hops of the colleague network, ranked by distance.
// This is the "friend of a friend who knows X" query - awkward in SQL
// because it needs a variable-length, direction-agnostic traversal.
export async function findSkillHoldersInNetwork(personId, skillName, maxHops = 3) {
  const records = await runRead(
    `MATCH (start:Person {id: $personId})
     MATCH path = (start)-[:COLLEAGUE_OF*1..${maxHops}]-(holder:Person)
     WHERE holder <> start
     MATCH (holder)-[r:HAS_SKILL]->(s:Skill {name: $skillName})
     MATCH (holder)-[:MEMBER_OF]->(t:Team)
     WITH holder, r, t, min(length(path)) AS hops
     RETURN holder AS p, r.level AS level, r.years AS years, t.name AS team, hops
     ORDER BY hops ASC, r.level DESC`,
    { personId, skillName }
  );
  return records.map((r) => ({
    ...toPerson(r.get("p")),
    team: r.get("team"),
    skillLevel: r.get("level"),
    skillYears: r.get("years")?.toNumber ? r.get("years").toNumber() : r.get("years"),
    hops: r.get("hops").toNumber ? r.get("hops").toNumber() : r.get("hops"),
  }));
}

// --- 4. Shortest connection path between two people through the colleague
// network - "how am I connected to this person". Classic graph-native query:
// a relational join can't express an unbounded shortest-path search cleanly.
export async function findConnectionPath(personAId, personBId) {
  const records = await runRead(
    `MATCH (a:Person {id: $personAId}), (b:Person {id: $personBId})
     MATCH path = shortestPath((a)-[:COLLEAGUE_OF*..6]-(b))
     RETURN [n IN nodes(path) | n] AS people, length(path) AS hops`,
    { personAId, personBId }
  );
  if (records.length === 0) return null;
  const record = records[0];
  const people = record.get("people").map((n) => toPerson(n));
  const hops = record.get("hops").toNumber ? record.get("hops").toNumber() : record.get("hops");
  return { people, hops };
}

// --- 5. Full profile: person + their skills + direct colleagues + team + company.
export async function getPersonProfile(personId) {
  const records = await runRead(
    `MATCH (p:Person {id: $personId})
     OPTIONAL MATCH (p)-[:MEMBER_OF]->(t:Team)-[:PART_OF]->(c:Company)
     OPTIONAL MATCH (p)-[r:HAS_SKILL]->(s:Skill)
     OPTIONAL MATCH (p)-[:COLLEAGUE_OF]-(colleague:Person)
     RETURN p, t.name AS team, c.name AS company,
            collect(DISTINCT {name: s.name, level: r.level, years: r.years}) AS skills,
            collect(DISTINCT colleague) AS colleagues`,
    { personId }
  );
  if (records.length === 0) return null;
  const r = records[0];
  const rawColleagues = r.get("colleagues").filter(Boolean);
  return {
    ...toPerson(r.get("p")),
    team: r.get("team"),
    company: r.get("company"),
    skills: r
      .get("skills")
      .filter((s) => s.name)
      .map((s) => ({
        name: s.name,
        level: s.level,
        years: s.years?.toNumber ? s.years.toNumber() : s.years,
      })),
    colleagues: rawColleagues.map(toPerson),
  };
}

// --- 6. Team skill gaps: for a given team, find skills that most of the team
// lacks but that are common (expert-level) elsewhere in the company.
// An aggregation + graph pattern that's clunky as a multi-table SQL join.
export async function findTeamSkillGaps(teamName) {
  const records = await runRead(
    `MATCH (t:Team {name: $teamName})<-[:MEMBER_OF]-(member:Person)
     WITH t, collect(DISTINCT member) AS members, count(DISTINCT member) AS teamSize
     MATCH (expert:Person)-[r:HAS_SKILL {level: 'expert'}]->(s:Skill)
     WHERE NOT expert IN members
     WITH t, teamSize, members, s, count(DISTINCT expert) AS expertsElsewhere,
          collect(DISTINCT expert.name)[0..3] AS sampleExperts
     WHERE NOT EXISTS {
       MATCH (m:Person)-[:HAS_SKILL]->(s)
       WHERE m IN members
     }
     RETURN s.name AS skill, s.category AS category, expertsElsewhere, sampleExperts
     ORDER BY expertsElsewhere DESC
     LIMIT 8`,
    { teamName }
  );
  return records.map((r) => ({
    skill: r.get("skill"),
    category: r.get("category"),
    expertsElsewhere: r.get("expertsElsewhere").toNumber
      ? r.get("expertsElsewhere").toNumber()
      : r.get("expertsElsewhere"),
    sampleExperts: r.get("sampleExperts"),
  }));
}

// --- 7. Search people by name (for the connection-path picker).
export async function searchPeopleByName(query) {
  const records = await runRead(
    `MATCH (p:Person)
     WHERE toLower(p.name) CONTAINS toLower($query)
     RETURN p
     ORDER BY p.name
     LIMIT 10`,
    { query }
  );
  return records.map((r) => toPerson(r.get("p")));
}

// --- 8. List all people (for browsing), with team + top skill.
export async function listPeople() {
  const records = await runRead(
    `MATCH (p:Person)-[:MEMBER_OF]->(t:Team)
     OPTIONAL MATCH (p)-[r:HAS_SKILL]->(s:Skill)
     WITH p, t, s, r ORDER BY
       CASE r.level WHEN 'expert' THEN 3 WHEN 'intermediate' THEN 2 ELSE 1 END DESC
     WITH p, t, collect(s.name)[0] AS topSkill
     RETURN p, t.name AS team, topSkill
     ORDER BY p.name`
  );
  return records.map((r) => ({
    ...toPerson(r.get("p")),
    team: r.get("team"),
    topSkill: r.get("topSkill"),
  }));
}
