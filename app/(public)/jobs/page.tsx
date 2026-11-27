import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Find a job | Xedruo Career",
  description:
    "Browse verified open roles by title, location, industry, experience level and salary.",
};

export { default } from "../../../src/app/(public)/jobs/page";
