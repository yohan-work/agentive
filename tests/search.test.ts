import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { agents } from "@/data/agents";
import { filterAgents, getUniqueTools, searchAgents } from "@/lib/search";

describe("searchAgents", () => {
  it("returns every agent for an empty or blank query", () => {
    assert.equal(searchAgents(agents, "").length, agents.length);
    assert.equal(searchAgents(agents, "   ").length, agents.length);
  });

  it("matches names case-insensitively and ignores surrounding whitespace", () => {
    const target = agents[0];
    const results = searchAgents(agents, `  ${target.name.toUpperCase()}  `);
    assert.ok(results.some((agent) => agent.slug === target.slug));
  });

  it("matches tags", () => {
    const target = agents.find((agent) => agent.tags.length);
    assert.ok(target);
    assert.ok(searchAgents(agents, target.tags[0]).some((agent) => agent.slug === target.slug));
  });

  it("returns nothing for a query that appears nowhere", () => {
    assert.deepEqual(searchAgents(agents, "zz-no-agent-mentions-this-zz"), []);
  });
});

describe("filterAgents", () => {
  it("returns every agent when no filter is set", () => {
    assert.equal(filterAgents(agents, {}).length, agents.length);
  });

  it("keeps only installable agents with installableOnly", () => {
    const results = filterAgents(agents, { installableOnly: true });
    assert.ok(results.length > 0);
    assert.ok(results.every((agent) => agent.installTargets?.length));
  });

  it("combines filters with AND", () => {
    const target = agents.find((agent) => agent.installTargets?.length);
    assert.ok(target);
    const results = filterAgents(agents, {
      role: target.roles[0],
      verifiedStatus: target.verifiedStatus,
      installableOnly: true
    });
    assert.ok(results.some((agent) => agent.slug === target.slug));
    assert.ok(
      results.every(
        (agent) =>
          agent.roles.includes(target.roles[0]) &&
          agent.verifiedStatus === target.verifiedStatus &&
          agent.installTargets?.length
      )
    );
  });

  it("compares automationLevel as a string, as the query string passes it", () => {
    const level = agents[0].automationLevel;
    const results = filterAgents(agents, { automationLevel: String(level) });
    assert.ok(results.length > 0);
    assert.ok(results.every((agent) => agent.automationLevel === level));
  });
});

describe("getUniqueTools", () => {
  it("returns each tool once, sorted", () => {
    const tools = getUniqueTools(agents);
    assert.deepEqual(tools, [...new Set(tools)].sort());
    assert.ok(tools.length > 0);
  });
});
