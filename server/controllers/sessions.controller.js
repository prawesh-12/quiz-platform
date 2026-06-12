import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import pool, { query } from "../config/db.js";
import {
    fetchStoredAnswers,
    finalizeSessionSubmission,
    upsertSessionAnswers,
} from "../services/sessionLifecycle.service.js";
import { resolveQuizWindow } from "../services/quizTiming.service.js";

const optionSchema = z.enum(["a", "b", "c", "d"]);

const answerPayloadSchema = z.object({
    question_id: z.coerce.number().int().positive(),
    selected_option: optionSchema.optional().nullable(),
});

export const enterSessionSchema = z.object({
    access_token: z.string().trim().min(8).max(64),
    access_code: z.string().trim().min(1).max(20),
    name: z.string().trim().min(2).max(100),
    roll_no: z.string().trim().min(1).max(50),
    email: z.string().trim().email().max(150),
    division: z.string().trim().min(1).max(10),
    group_no: z.string().trim().min(1).max(10),
});

export const submitSessionSchema = z.object({
    answers: z.array(answerPayloadSchema).default([]),
    submission_id: z.string().trim().min(1).max(64).optional(),
});

export const progressSessionSchema = z.object({
    answers: z.array(answerPayloadSchema).default([]),
});

export const answerProgressSchema = z.object({
    selected_option: optionSchema.nullable(),
});

const sessionHeadersSchema = z.object({
    "x-session-token": z.string().trim().min(8).max(128),
});

const answerParamsSchema = z.object({
    questionId: z.coerce.number().int().positive(),
});

async function fetchQuizQuestions(quizId, dbClient = query) {
    const result = await dbClient(
        `
    SELECT
      q.id,
      q.question_text,
      q.option_a,
      q.option_b,
      q.option_c,
      q.option_d,
      q.has_equation,
      q.points,
      q.correct_option,
      qq.order_no
    FROM quiz_questions qq
    INNER JOIN questions q ON q.id = qq.question_id
    WHERE qq.quiz_id = $1
    ORDER BY qq.order_no ASC, qq.id ASC
    `,
        [quizId],
    );

    return result.rows;
}

async function fetchBreakdown(dbClient, sessionId, quizId) {
    const result = await dbClient.query(
        `
    SELECT
      qq.order_no,
      q.id AS question_id,
      q.question_text,
      q.points,
      q.correct_option,
      sa.selected_option,
      sa.is_correct
    FROM quiz_questions qq
    INNER JOIN questions q ON q.id = qq.question_id
    LEFT JOIN student_answers sa ON sa.session_id = $1 AND sa.question_id = q.id
    WHERE qq.quiz_id = $2
    ORDER BY qq.order_no ASC, qq.id ASC
    `,
        [sessionId, quizId],
    );

    return result.rows.map((row) => ({
        order_no: row.order_no,
        question_id: Number(row.question_id),
        question_text: row.question_text,
        points: Number(row.points || 1),
        selected_option: row.selected_option,
        correct_option: row.correct_option,
        is_correct: Boolean(row.is_correct),
    }));
}

function withPercent(score, totalPoints) {
    if (score == null || !totalPoints) {
        return null;
    }

    return Number(((Number(score) / Number(totalPoints)) * 100).toFixed(2));
}

function timingPayload(window) {
    return {
        server_now: window.now.toISOString(),
        quiz_state: window.phase,
        start_time: window.startAt.toISOString(),
        end_time: window.endAt.toISOString(),
        countdown_to_start_secs: window.secondsUntilStart,
        duration_secs: window.responseTimerSeconds,
        total_duration_secs: window.totalDurationSeconds,
    };
}

async function fetchSessionContext(dbClient, sessionToken, { lockSession = false } = {}) {
    const sessionResult = await dbClient.query(
        `
      SELECT
        ss.id,
        ss.quiz_id,
        ss.status,
        ss.score,
        ss.total_points,
        ss.submission_id,
        q.status AS quiz_status,
        q.scheduled_start,
        q.scheduled_end,
        q.duration_mins,
        q.created_at,
        (NOW() AT TIME ZONE 'Asia/Kolkata')::timestamp AS server_now
      FROM student_sessions ss
      INNER JOIN quizzes q ON q.id = ss.quiz_id
      WHERE ss.session_token = $1
      ${lockSession ? "FOR UPDATE OF ss" : ""}
      `,
        [sessionToken],
    );

    if (sessionResult.rowCount === 0) {
        return null;
    }

    const session = sessionResult.rows[0];
    const quizWindow = resolveQuizWindow(
        {
            status: session.quiz_status,
            scheduled_start: session.scheduled_start,
            scheduled_end: session.scheduled_end,
            duration_mins: session.duration_mins,
            created_at: session.created_at,
        },
        session.server_now,
    );

    return {
        session,
        quizWindow,
    };
}

async function rollbackQuietly(client) {
    try {
        await client.query("ROLLBACK");
    } catch {
        // ignore rollback failures
    }
}

function buildSessionClosedPayload(session, quizWindow) {
    return {
        session_closed:
            session.status !== "pending" || quizWindow.phase === "ended",
        already_submitted: session.status === "submitted",
        ...timingPayload(quizWindow),
    };
}

export async function getSessionTiming(req, res, next) {
    try {
        const headerPayload = sessionHeadersSchema.parse(req.headers);
        const sessionToken = headerPayload["x-session-token"];

        const context = await fetchSessionContext(pool, sessionToken);
        if (!context) {
            return res.status(404).json({ error: "Session not found" });
        }

        return res.status(200).json(
            buildSessionClosedPayload(context.session, context.quizWindow),
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res
                .status(400)
                .json({ error: "Missing or invalid session token header" });
        }

        return next(error);
    }
}

export async function getSessionResult(req, res, next) {
    try {
        const headerPayload = sessionHeadersSchema.parse(req.headers);
        const sessionToken = headerPayload["x-session-token"];

        const context = await fetchSessionContext(pool, sessionToken);
        if (!context) {
            return res.status(404).json({ error: "Session not found" });
        }

        const { session, quizWindow } = context;

        if (session.status !== "submitted") {
            return res.status(409).json({
                error: "Session result is not available yet",
                ...timingPayload(quizWindow),
            });
        }

        const breakdown = await fetchBreakdown(pool, session.id, session.quiz_id);

        return res.status(200).json({
            already_submitted: true,
            score: Number(session.score ?? 0),
            total_points: Number(session.total_points ?? 0),
            percentage: withPercent(session.score, session.total_points),
            breakdown,
            ...timingPayload(quizWindow),
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res
                .status(400)
                .json({ error: "Missing or invalid session token header" });
        }

        return next(error);
    }
}

export async function enterSession(req, res, next) {
    try {
        const payload = req.validatedBody;

        const quizResult = await query(
            `
      SELECT
        q.id,
        q.title,
        q.subject_id,
        q.duration_mins,
        q.quiz_date,
        q.status,
        q.scheduled_start,
        q.scheduled_end,
        q.access_code,
        q.created_at,
        (NOW() AT TIME ZONE 'Asia/Kolkata')::timestamp AS server_now,
        s.name AS subject_name
      FROM quizzes q
      LEFT JOIN subjects s ON s.id = q.subject_id
      WHERE q.access_token = $1
        AND q.status IN ('active', 'scheduled')
      `,
            [payload.access_token],
        );

        if (quizResult.rowCount === 0) {
            return res
                .status(404)
                .json({ error: "Quiz is not available or not active" });
        }

        const quiz = quizResult.rows[0];
        if (!quiz.access_code) {
            return res
                .status(400)
                .json({
                    error: "This quiz is not configured with an access code.",
                });
        }

        if (quiz.access_code !== payload.access_code) {
            return res.status(403).json({ error: "Invalid access code" });
        }

        const questions = await fetchQuizQuestions(quiz.id);
        if (!questions.length) {
            return res
                .status(400)
                .json({ error: "Quiz has no questions configured" });
        }

        const quizWindow = resolveQuizWindow(quiz, quiz.server_now);
        if (quizWindow.phase === "ended") {
            return res.status(410).json({ error: "This quiz has already ended" });
        }

        const sessionToken = uuidv4().replaceAll("-", "");

        await query(
            `
      INSERT INTO student_sessions (quiz_id, name, roll_no, email, division, group_no, session_token, status, started_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', (NOW() AT TIME ZONE 'Asia/Kolkata')::timestamp)
      `,
            [
                quiz.id,
                payload.name,
                payload.roll_no,
                payload.email,
                payload.division,
                payload.group_no,
                sessionToken,
            ],
        );

        const sanitizedQuestions = questions.map(
            ({ correct_option, ...question }) => question,
        );

        return res.status(200).json({
            session_token: sessionToken,
            ...timingPayload(quizWindow),
            quiz: {
                id: quiz.id,
                title: quiz.title,
                subject_id: quiz.subject_id,
                subject_name: quiz.subject_name,
                duration_mins: quiz.duration_mins,
                quiz_date: quiz.quiz_date,
                status: quizWindow.phase,
                scheduled_start: quizWindow.startAt.toISOString(),
                scheduled_end: quizWindow.endAt.toISOString(),
            },
            questions: sanitizedQuestions,
        });
    } catch (error) {
        return next(error);
    }
}

async function saveAnswersForSession(req, res, next, answers) {
    const client = await pool.connect();

    try {
        const headerPayload = sessionHeadersSchema.parse(req.headers);
        const sessionToken = headerPayload["x-session-token"];

        await client.query("BEGIN");

        const context = await fetchSessionContext(client, sessionToken, {
            lockSession: true,
        });
        if (!context) {
            await rollbackQuietly(client);
            return res.status(404).json({ error: "Session not found" });
        }

        const { session, quizWindow } = context;

        if (session.status !== "pending") {
            const breakdown = await fetchBreakdown(
                client,
                session.id,
                session.quiz_id,
            );
            await client.query("COMMIT");
            return res.status(200).json({
                session_closed: true,
                already_submitted: true,
                score: Number(session.score ?? 0),
                total_points: Number(session.total_points ?? 0),
                percentage: withPercent(session.score, session.total_points),
                breakdown,
                ...timingPayload(quizWindow),
            });
        }

        if (quizWindow.phase === "scheduled") {
            await rollbackQuietly(client);
            return res.status(409).json({
                error: "Quiz has not started yet",
                ...timingPayload(quizWindow),
            });
        }

        if (quizWindow.phase !== "active") {
            await rollbackQuietly(client);
            return res.status(409).json({
                error: "Quiz has ended. Responses are no longer accepted.",
                session_closed: true,
                ...timingPayload(quizWindow),
            });
        }

        await upsertSessionAnswers(client, session.id, answers, {
            isCorrect: null,
        });
        await client.query("COMMIT");

        return res.status(200).json({
            message: "Progress saved",
            ...timingPayload(quizWindow),
        });
    } catch (error) {
        await rollbackQuietly(client);

        if (error instanceof z.ZodError) {
            return res
                .status(400)
                .json({ error: "Missing or invalid session token header" });
        }

        return next(error);
    } finally {
        client.release();
    }
}

export async function saveSessionProgress(req, res, next) {
    return saveAnswersForSession(req, res, next, req.validatedBody.answers);
}

export async function saveSessionAnswer(req, res, next) {
    try {
        const { questionId } = answerParamsSchema.parse(req.params);

        return saveAnswersForSession(req, res, next, [
            {
                question_id: questionId,
                selected_option: req.validatedBody.selected_option,
            },
        ]);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid question id" });
        }

        return next(error);
    }
}

export async function submitSession(req, res, next) {
    const client = await pool.connect();

    try {
        const headerPayload = sessionHeadersSchema.parse(req.headers);
        const sessionToken = headerPayload["x-session-token"];
        const { answers, submission_id: submissionId = null } = req.validatedBody;

        await client.query("BEGIN");

        const context = await fetchSessionContext(client, sessionToken, {
            lockSession: true,
        });
        if (!context) {
            await rollbackQuietly(client);
            return res.status(404).json({ error: "Session not found" });
        }

        const { session, quizWindow } = context;

        if (session.status === "submitted") {
            const breakdown = await fetchBreakdown(
                client,
                session.id,
                session.quiz_id,
            );
            await client.query("COMMIT");
            return res.status(200).json({
                already_submitted: true,
                score: Number(session.score ?? 0),
                total_points: Number(session.total_points ?? 0),
                percentage: withPercent(session.score, session.total_points),
                breakdown,
                ...timingPayload(quizWindow),
            });
        }

        if (quizWindow.phase === "scheduled") {
            await rollbackQuietly(client);
            return res.status(409).json({
                error: "Quiz has not started yet",
                ...timingPayload(quizWindow),
            });
        }

        if (quizWindow.phase !== "active") {
            await rollbackQuietly(client);
            return res.status(409).json({
                error: "Quiz has ended. Responses are no longer accepted.",
                session_closed: true,
                ...timingPayload(quizWindow),
            });
        }

        const submittedAnswers = answers.length
            ? answers
            : await fetchStoredAnswers(client, session.id);
        const result = await finalizeSessionSubmission(client, {
            sessionId: session.id,
            quizId: session.quiz_id,
            submittedAnswers,
            submissionId,
        });

        await client.query("COMMIT");

        return res.status(200).json({
            score: result.score,
            total_points: result.total_points,
            percentage: withPercent(result.score, result.total_points),
            breakdown: result.breakdown,
            ...timingPayload(quizWindow),
        });
    } catch (error) {
        await rollbackQuietly(client);

        if (error instanceof z.ZodError) {
            return res
                .status(400)
                .json({ error: "Missing or invalid session token header" });
        }

        return next(error);
    } finally {
        client.release();
    }
}
