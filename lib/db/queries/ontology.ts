import { query, type Executor } from "@/lib/db/client";
import type { ConceptSeed, PrereqPair, ContrastPair } from "@/lib/exam/ontology/rrb-ntpc";

export interface OntologyData {
  concepts: readonly ConceptSeed[];
  prerequisites: readonly PrereqPair[];
  contrasts: readonly ContrastPair[];
}

export interface OntologySeedReport {
  conceptsDefined: number;
  conceptsInserted: number;
  edgesInserted: number;
}

// Idempotently seeds a concept ontology (concepts + prerequisite/contrast edges).
// Shared by the onboarding flow (within its transaction, via the `exec` param)
// and the standalone CLI seeder. Subjects must already exist (FK concept.subject
// → subject.key), so callers seed subjects first.
export async function seedOntology(
  data: OntologyData,
  exec?: Executor
): Promise<OntologySeedReport> {
  let conceptsInserted = 0;
  for (const c of data.concepts) {
    const rows = await query(
      `INSERT INTO concept (name, subject, topic, subtopic, description)
       SELECT $1, $2, $3, $4, $5
       WHERE NOT EXISTS (
         SELECT 1 FROM concept WHERE name = $1 AND subject = $2 AND topic = $3
       )
       RETURNING id`,
      [c.name, c.subject, c.topic, c.subtopic ?? null, c.description ?? null],
      exec
    );
    conceptsInserted += rows.length;
  }

  // name → id, for edge wiring. Names are unique within an ontology.
  const idRows = await query<{ id: number; name: string }>(`SELECT id, name FROM concept`, [], exec);
  const idByName = new Map(idRows.map((r) => [r.name, r.id]));
  const resolve = (name: string, kind: string): number => {
    const id = idByName.get(name);
    if (id === undefined) throw new Error(`${kind} references unknown concept: "${name}"`);
    return id;
  };

  let edgesInserted = 0;
  const addEdge = async (sourceId: number, targetId: number, relation: string) => {
    const rows = await query(
      `INSERT INTO concept_edge (source_id, target_id, relation_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (source_id, target_id, relation_type) DO NOTHING
       RETURNING source_id`,
      [sourceId, targetId, relation],
      exec
    );
    edgesInserted += rows.length;
  };

  for (const [dependent, foundation] of data.prerequisites) {
    await addEdge(resolve(dependent, "prerequisite"), resolve(foundation, "prerequisite"), "prerequisite");
  }
  // contrasts_with is symmetric: store both directions so either side surfaces the other.
  for (const [a, b] of data.contrasts) {
    const ida = resolve(a, "contrasts_with");
    const idb = resolve(b, "contrasts_with");
    await addEdge(ida, idb, "contrasts_with");
    await addEdge(idb, ida, "contrasts_with");
  }

  return {
    conceptsDefined: data.concepts.length,
    conceptsInserted,
    edgesInserted,
  };
}
