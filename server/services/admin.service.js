import bcrypt from "bcryptjs";

import pool from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { withTransaction } from "../utils/withTransaction.js";
import * as adminRepo from "../repositories/admin.repository.js";

const SALT_ROUNDS = 12;
const DUPLICATE_EMAIL_MESSAGE = "A teacher with this email already exists";

function mapTeacherRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    contact_no: row.contact_no,
    school: row.school,
    created_at: row.created_at,
  };
}

function toUniqueIds(subjectIds = []) {
  return [...new Set(subjectIds)];
}

async function assertSubjectIdsExist(db, subjectIds) {
  if (subjectIds.length === 0) {
    return;
  }

  const foundIds = await adminRepo.findExistingSubjectIds(db, subjectIds);
  if (foundIds.length !== subjectIds.length) {
    const found = new Set(foundIds);
    const missing = subjectIds.filter((id) => !found.has(id));
    throw new AppError(404, "One or more subject ids were not found", {
      missing_subject_ids: missing,
    });
  }
}

export async function getAllTeachers() {
  return { teachers: await adminRepo.findAllTeachers(pool) };
}

export async function removeTeacherFromSchool(teacherId) {
  const teacher = await adminRepo.clearTeacherSchool(pool, teacherId);
  if (!teacher) {
    throw new AppError(404, "Teacher not found");
  }

  return { message: "Teacher removed from school", teacher };
}

export async function getTeachersBySchool(school) {
  return { teachers: await adminRepo.findTeachersBySchool(pool, school) };
}

export async function addTeacher(payload) {
  const email = payload.email.toLowerCase();
  const subjectIds = toUniqueIds(payload.subject_ids);

  if (await adminRepo.findTeacherByEmail(pool, email)) {
    throw new AppError(409, DUPLICATE_EMAIL_MESSAGE);
  }

  const passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);

  try {
    return await withTransaction(async (client) => {
      await assertSubjectIdsExist(client, subjectIds);

      const teacher = mapTeacherRow(
        await adminRepo.insertTeacher(client, { ...payload, email, passwordHash }),
      );

      if (subjectIds.length > 0) {
        await adminRepo.assignTeacherSubjects(client, teacher.id, subjectIds);
      }

      return { teacher, assigned_subject_ids: subjectIds };
    });
  } catch (error) {
    // Unique-violation guards against a race between the email check and insert.
    if (error?.code === "23505") {
      throw new AppError(409, DUPLICATE_EMAIL_MESSAGE);
    }
    throw error;
  }
}

export async function assignSubjects(teacherId, incomingSubjectIds) {
  const subjectIds = toUniqueIds(incomingSubjectIds);

  if (!(await adminRepo.teacherExists(pool, teacherId))) {
    throw new AppError(404, "Teacher not found");
  }

  return withTransaction(async (client) => {
    await assertSubjectIdsExist(client, subjectIds);

    if (subjectIds.length > 0) {
      await adminRepo.assignTeacherSubjects(client, teacherId, subjectIds);
    }
    await adminRepo.removeTeacherSubjectsNotIn(client, teacherId, subjectIds);

    const assignedSubjects = await adminRepo.findAssignedSubjects(client, teacherId);
    return { teacher_id: teacherId, assigned_subjects: assignedSubjects };
  });
}

export async function getTeacherCredentials(teacherId) {
  const row = await adminRepo.findTeacherCredentials(pool, teacherId);
  if (!row) {
    throw new AppError(404, "Teacher not found");
  }

  return {
    teacher: row,
    credentials: {
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.plain_password || null,
    },
  };
}

export async function getAllSubjectsForAdmin() {
  return { subjects: await adminRepo.findAllSubjectsWithCounts(pool) };
}

export async function getSubjectQuestionsForAdmin(subjectId) {
  return { questions: await adminRepo.findSubjectQuestionsForAdmin(pool, subjectId) };
}

export async function deleteTeacher(teacherId) {
  return withTransaction(async (client) => {
    await adminRepo.detachTeacherDependencies(client, teacherId);

    const teacher = await adminRepo.deleteTeacher(client, teacherId);
    if (!teacher) {
      throw new AppError(404, "Teacher not found");
    }

    return { message: "Teacher removed", teacher };
  });
}
