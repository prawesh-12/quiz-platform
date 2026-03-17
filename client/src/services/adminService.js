import { api } from "@/services/api";

export const getTeachersBySchool = (school) =>
  api.get(`/admin/schools/${school}/teachers`).then((r) => r.data);

export const getAllTeachers = () =>
  api.get("/admin/teachers").then((r) => r.data);

export const addTeacher = (payload) =>
  api.post("/admin/teachers", payload).then((r) => r.data);

export const removeTeacherFromSchool = (teacherId) =>
  api.patch(`/admin/teachers/${teacherId}/remove-school`).then((r) => r.data);

export const assignSubjects = (teacherId, subjectIds) =>
  api
    .put(`/admin/teachers/${teacherId}/subjects`, { subject_ids: subjectIds })
    .then((r) => r.data);

export const getCredentials = (teacherId) =>
  api.get(`/admin/teachers/${teacherId}/credentials`).then((r) => r.data);

export const deleteTeacher = (teacherId) =>
  api.delete(`/admin/teachers/${teacherId}`).then((r) => r.data);

export const getAllSubjects = () =>
  api.get("/admin/subjects").then((r) => r.data);

export const getSubjectQuestions = (subjectId) =>
  api.get(`/admin/subjects/${subjectId}/questions`).then((r) => r.data);
