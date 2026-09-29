import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultLocale, getLocaleFromPathname, isLocale, stripLocale, withLocale } from "@/i18n/config";

describe("locale helpers", () => {
  it("recognizes only supported locales", () => {
    assert.equal(isLocale("en"), true);
    assert.equal(isLocale("ko"), true);
    assert.equal(isLocale("fr"), false);
    assert.equal(isLocale(undefined), false);
  });

  it("strips the locale prefix and trailing slash", () => {
    assert.equal(stripLocale("/ko/agents/pr-review-agent/"), "/agents/pr-review-agent");
    assert.equal(stripLocale("/en"), "/");
    assert.equal(stripLocale("/en/"), "/");
    assert.equal(stripLocale("/agents"), "/agents");
  });

  it("reads the locale from a path and falls back to the default", () => {
    assert.equal(getLocaleFromPathname("/ko/workflows"), "ko");
    assert.equal(getLocaleFromPathname("/workflows"), defaultLocale);
  });

  it("switches a path to another locale", () => {
    assert.equal(withLocale("/en/agents/pr-review-agent/", "ko"), "/ko/agents/pr-review-agent");
    assert.equal(withLocale("/en", "ko"), "/ko");
    assert.equal(withLocale("/agents", "en"), "/en/agents");
  });
});
