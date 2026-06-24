import bcrypt from "bcryptjs";

import pool from "../config/db.js";
import { EVENTS } from "../config/eventBus.js";
import { enqueueOutboxEvent } from "../config/outbox.js";
import { AppError } from "../utils/AppError.js";
import { withTransaction } from "../utils/withTransaction.js";
import * as adminRepo from "../repositories/admin.repository.js";

const SALT_ROUNDS = 12;
const DUPLICATE_EMAIL_MESSAGE = "A teacher with this email already exists";
const UNIQUE_VIOLATION = "23505";

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

async function enqueueTeacherUpserted(client, teacher) {
  await enqueueOutboxEvent(client, EVENTS.TEACHER_UPSERTED, {
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    school: teacher.school ?? null,
  });
}

async function enqueueSubjectAssignments(client, teacherId, assignedIds, removedIds) {
  for (const subjectId of assignedIds) {
    await enqueueOutboxEvent(client, EVENTS.TEACHER_SUBJECTS_ASSIGNED, { teacherId, subjectId });
  }
  for (const subjectId of removedIds) {
    await enqueueOutboxEvent(client, EVENTS.TEACHER_SUBJECTS_REMOVED, { teacherId, subjectId });
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
  const passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);

  return insertTeacherWithSubjects({ ...payload, email, passwordHash }, subjectIds);
}

async function insertTeacherWithSubjects(teacherInput, subjectIds) {
  if (await adminRepo.findTeacherByEmail(pool, teacherInput.email)) {
    throw new AppError(409, DUPLICATE_EMAIL_MESSAGE);
  }

  try {
    return await withTransaction(async (client) => {
      const teacher = mapTeacherRow(await adminRepo.insertTeacher(client, teacherInput));

      if (subjectIds.length > 0) {
        await adminRepo.assignTeacherSubjects(client, teacher.id, subjectIds);
      }

      await enqueueTeacherUpserted(client, teacher);
      await enqueueSubjectAssignments(client, teacher.id, subjectIds, []);
      return { teacher, assigned_subject_ids: subjectIds };
    });
  } catch (error) {
    if (error?.code === UNIQUE_VIOLATION) {
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

  return applySubjectAssignment(teacherId, subjectIds);
}

async function applySubjectAssignment(teacherId, subjectIds) {
  return withTransaction(async (client) => {
    const previous = await adminRepo.findAssignedSubjectIds(client, teacherId);

    if (subjectIds.length > 0) {
      await adminRepo.assignTeacherSubjects(client, teacherId, subjectIds);
    }
    await adminRepo.removeTeacherSubjectsNotIn(client, teacherId, subjectIds);

    const next = new Set(subjectIds);
    const previousSet = new Set(previous);
    const added = subjectIds.filter((id) => !previousSet.has(id));
    const removed = previous.filter((id) => !next.has(id));
    await enqueueSubjectAssignments(client, teacherId, added, removed);

    return { teacher_id: teacherId, assigned_subject_ids: subjectIds };
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

export async function deleteTeacher(teacherId) {
  return withTransaction(async (client) => {
    await adminRepo.detachTeacherDependencies(client, teacherId);

    const teacher = await adminRepo.deleteTeacher(client, teacherId);
    if (!teacher) {
      throw new AppError(404, "Teacher not found");
    }

    await enqueueOutboxEvent(client, EVENTS.TEACHER_DELETED, { teacherId });
    return { message: "Teacher removed", teacher };
  });
}
