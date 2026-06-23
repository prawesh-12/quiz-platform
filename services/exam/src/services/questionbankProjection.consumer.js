import pool from "../config/db.js";
import { startStreamConsumer } from "../config/eventConsumer.js";
import logger, { serializeError } from "../utils/logger.js";

// Keeps the local subjects read-model in step with the question bank.
const QB_STREAM = "events:questionbank";
const GROUP = "questionbank-projection";

async function upsertSubject({ id, name, createdBy }) {
  await pool.query(
    `INSERT INTO subjects (id, name, created_by) VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, created_by = EXCLUDED.created_by`,
    [id, name ?? null, createdBy ?? null],
  );
}

async function deleteSubject(id) {
  await pool.query(`DELETE FROM subjects WHERE id = $1`, [id]);
}

async function handle(message) {
  let data;
  try {
    data = JSON.parse(message.payload || "{}");
  } catch (error) {
    logger.warn("qb_projection.bad_payload", serializeError(error));
    return;
  }

  if (message.type === "subject.upserted") {
    await upsertSubject(data);
  } else if (message.type === "subject.deleted") {
    await deleteSubject(Number(data.id));
  }
}

export function startQuestionBankProjectionConsumer() {
  return startStreamConsumer({
    stream: QB_STREAM,
    group: GROUP,
    consumer: process.env.HOSTNAME || "worker",
    handler: handle,
  });
}
