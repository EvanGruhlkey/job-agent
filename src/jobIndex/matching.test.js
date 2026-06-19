import assert from "node:assert/strict";
import { matchesQueryIntent } from "./utils.js";

const cases = [
  ["software engineer", "Security Engineer", false],
  ["software engineer", "Software Engineer, Full Stack", true],
  ["software engineer intern", "Software Engineer Intern", true],
  ["software engineer intern", "Software Engineer", false],
  ["software engineer intern", "Software Dev Engineer, Benefits Experience and Technology (BXT)", false],
  ["software engineer intern", "Software Engineer II", false],
  ["software engineer intern", "Software Engineer, Backend, Level 4", false],
  ["software engineer intern", "Software Developer Intern", true],
  ["software engineer intern", "Intern - Software Engineering", true],
  ["software engineer intern", "Developer Intern, Service Development", false],
  ["software engineer intern", "2026 Fall Co-op - Global Technology Solutions - Software Engineer (SWE)", true],
  ["civil engineer intern", "Civil Engineering Co-op Student (Fall 2026)", true],
  ["civil engineer intern", "Civil Engineering Intern", true],
  ["civil engineer intern", "Civil Engineer Intern", true],
  ["civil engineer intern", "Civil Engineer", false],
  ["civil engineer intern", "Civil Project Engineer", false],
  ["marketing intern", "Marketing Intern", true],
  ["marketing intern", "Marketing Coordinator", false],
  ["finance analyst intern", "Finance Analyst Intern", true],
  ["finance analyst intern", "Financial Analyst", false],
  ["registered nurse", "Registered Nurse", true],
  ["registered nurse", "Nurse Practitioner", false],
  ["product manager", "Engineering Manager", false],
  ["product manager", "Product Marketing Manager", false],
  ["product manager", "Manager, Data Science - AI Product", false],
  ["product manager", "Product Manager", true],
  ["data analyst", "Business Analyst", false],
  ["data analyst", "Data Analyst", true]
];

for (const [targetTitle, title, expected] of cases) {
  assert.equal(
    matchesQueryIntent(
      { title, location: "United States", description: "Responsibilities qualifications apply." },
      { targetTitle, location: "United States" }
    ),
    expected,
    `${targetTitle} should ${expected ? "" : "not "}match ${title}`
  );
}

console.log("Job title matcher regression tests passed.");
