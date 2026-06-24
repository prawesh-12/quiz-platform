import pool from "../config/db.js";
import * as adminRepo from "../repositories/admin.repository.js";

export async function getAllSubjectsForAdmin() {
  return { subjects: await adminRepo.findAllSubjectsWithCounts(pool) };
}

export async function getSubjectQuestionsForAdmin(subjectId) {
  return { questions: await adminRepo.findSubjectQuestionsForAdmin(pool, subjectId) };
}
