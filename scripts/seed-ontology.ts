// Concept ontology seed CLI — delegates to the shared seedOntology() so it stays
// in lockstep with the onboarding flow. Seeds the RRB NTPC preset's ontology by
// default; pass a preset slug to seed a different bundled preset.
//
// Usage: DATABASE_URL=... npm run db:seed:ontology [preset-slug]
import { Client } from "pg";
import { seedOntology } from "@/lib/db/queries/ontology";
import { findPreset, RRB_NTPC } from "@/lib/exam/presets";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const slug = process.argv[2];
  const preset = slug ? findPreset(slug) : RRB_NTPC;
  if (!preset) throw new Error(`Unknown preset slug: "${slug}"`);

  const client = new Client({ connectionString: url });
  await client.connect();

  await client.query("BEGIN");
  try {
    const report = await seedOntology(preset.ontology, client);
    await client.query("COMMIT");
    console.log(
      `ontology seed complete (${preset.name}): ${report.conceptsDefined} concepts defined ` +
        `(${report.conceptsInserted} new), ${report.edgesInserted} new edges`
    );
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
