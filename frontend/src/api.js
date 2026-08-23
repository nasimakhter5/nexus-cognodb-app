const BASE = "/api";

async function request(path) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`);
  } catch (networkErr) {
    throw new Error(
      "Can't reach the Nexus server. Is the backend running on port 4000?"
    );
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || "Something went wrong.");
  }
  return data;
}

export const api = {
  health: () => request("/health"),
  listSkills: () => request("/skills"),
  listPeople: () => request("/people"),
  searchPeople: (q) => request(`/people/search?q=${encodeURIComponent(q)}`),
  getPerson: (id) => request(`/people/${encodeURIComponent(id)}`),
  skillHolders: (skillName, minLevel = "beginner") =>
    request(
      `/skills/${encodeURIComponent(skillName)}/holders?minLevel=${minLevel}`
    ),
  networkSkillSearch: (personId, skillName, maxHops = 3) =>
    request(
      `/network/${encodeURIComponent(personId)}/skill/${encodeURIComponent(
        skillName
      )}?maxHops=${maxHops}`
    ),
  connectionPath: (from, to) =>
    request(`/connection?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  teamSkillGaps: (teamName) =>
    request(`/teams/${encodeURIComponent(teamName)}/skill-gaps`),
};
