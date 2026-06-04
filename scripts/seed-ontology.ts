// Concept ontology seed — now delegates to lib/exam/ontology/rrb-ntpc.ts.
// Keeping this script as the CLI entry point; the data lives in the ontology
// module so onboarding and other exam presets can reuse it.
//
// Usage: DATABASE_URL=... npm run db:seed:ontology
import {
  RRB_NTPC_CONCEPTS  as CONCEPTS,
  RRB_NTPC_PREREQUISITES as PREREQUISITES,
  RRB_NTPC_CONTRASTS as CONTRASTS,
} from "@/lib/exam/ontology/rrb-ntpc";
import { Client } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = new Client({ connectionString: url });
  await client.connect();

  await client.query("BEGIN");
  try {
    let inserted = 0;
    for (const c of CONCEPTS) {
      const res = await client.query(
        `INSERT INTO concept (name, subject, topic, subtopic, description)
         SELECT $1, $2, $3, $4, $5
         WHERE NOT EXISTS (
           SELECT 1 FROM concept WHERE name = $1 AND subject = $2 AND topic = $3
         )`,
        [c.name, c.subject, c.topic, c.subtopic ?? null, c.description ?? null]
      );
      inserted += res.rowCount ?? 0;
    }

    // name → id, for edge wiring. Names are unique within this ontology.
    const rows = await client.query<{ id: number; name: string }>(`SELECT id, name FROM concept`);
    const idByName = new Map(rows.rows.map((r) => [r.name, r.id]));

    const resolve = (name: string, kind: string): number => {
      const id = idByName.get(name);
      if (id === undefined) throw new Error(`${kind} references unknown concept: "${name}"`);
      return id;
    };

    let edges = 0;
    const addEdge = async (sourceId: number, targetId: number, relation: string) => {
      const res = await client.query(
        `INSERT INTO concept_edge (source_id, target_id, relation_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (source_id, target_id, relation_type) DO NOTHING`,
        [sourceId, targetId, relation]
      );
      edges += res.rowCount ?? 0;
    };

    for (const [dependent, foundation] of PREREQUISITES) {
      await addEdge(resolve(dependent, "prerequisite"), resolve(foundation, "prerequisite"), "prerequisite");
    }
    // contrasts_with is symmetric: store both directions so either side surfaces the other.
    for (const [a, b] of CONTRASTS) {
      const ida = resolve(a, "contrasts_with");
      const idb = resolve(b, "contrasts_with");
      await addEdge(ida, idb, "contrasts_with");
      await addEdge(idb, ida, "contrasts_with");
    }

    await client.query("COMMIT");
    console.log(
      `ontology seed complete: ${CONCEPTS.length} concepts defined (${inserted} new), ` +
        `${PREREQUISITES.length} prerequisite + ${CONTRASTS.length} contrast pairs (${edges} new edges)`
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
