import { getDashboardSummary, getParticipantTrend } from "../services/dashboard.service.js";

// Teachers see only their own quizzes (created_by); admin sees everything (null scope).
export async function getTeacherDashboardSummary(req, res, next) {
  try {
    const result = await getDashboardSummary({ createdBy: req.user.userId });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function getTeacherDashboardTrend(req, res, next) {
  try {
    const result = await getParticipantTrend({
      createdBy: req.user.userId,
      start: req.query.start,
      end: req.query.end
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function getAdminDashboardSummary(req, res, next) {
  try {
    const result = await getDashboardSummary({ createdBy: null });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function getAdminDashboardTrend(req, res, next) {
  try {
    const result = await getParticipantTrend({
      createdBy: null,
      start: req.query.start,
      end: req.query.end
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}
