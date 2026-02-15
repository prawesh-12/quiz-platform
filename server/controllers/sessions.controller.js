import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import pool, { query } from "../config/db.js";
import {
    fetchStoredAnswers,
    finalizeSessionSubmission,
    replaceSessionAnswers,
} from "../services/sessionLifecycle.service.js";

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
});

export const progressSessionSchema = z.object({
    answers: z.array(answerPayloadSchema).default([]),
});

const sessionHeadersSchema = z.object({
    "x-session-token": z.string().trim().min(8).max(128),
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
        q.access_code,
        s.name AS subject_name
      FROM quizzes q
      LEFT JOIN subjects s ON s.id = q.subject_id
      WHERE q.access_token = $1 AND q.status = 'active'
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

        const sessionToken = uuidv4().replaceAll("-", "");

        await query(
            `
      INSERT INTO student_sessions (quiz_id, name, roll_no, email, division, group_no, session_token, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
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
            duration_secs: Number(quiz.duration_mins || 15) * 60,
            quiz: {
                id: quiz.id,
                title: quiz.title,
                subject_id: quiz.subject_id,
                subject_name: quiz.subject_name,
                duration_mins: quiz.duration_mins,
                quiz_date: quiz.quiz_date,
            },
            questions: sanitizedQuestions,
        });
    } catch (error) {
        return next(error);
    }
}

export async function saveSessionProgress(req, res, next) {
    const client = await pool.connect();

    try {
        const headerPayload = sessionHeadersSchema.parse(req.headers);
        const sessionToken = headerPayload["x-session-token"];
        const { answers } = req.validatedBody;

        const sessionResult = await client.query(
            `
      SELECT ss.id, ss.quiz_id, ss.status, ss.score, ss.total_points, q.status AS quiz_status
      FROM student_sessions ss
      INNER JOIN quizzes q ON q.id = ss.quiz_id
      WHERE ss.session_token = $1
      `,
            [sessionToken],
        );

        if (sessionResult.rowCount === 0) {
            return res.status(404).json({ error: "Session not found" });
        }

        const session = sessionResult.rows[0];
        if (session.status !== "pending") {
            const breakdown = await fetchBreakdown(
                client,
                session.id,
                session.quiz_id,
            );
            return res.status(200).json({
                session_closed: true,
                already_submitted: true,
                score: Number(session.score ?? 0),
                total_points: Number(session.total_points ?? 0),
                percentage: withPercent(session.score, session.total_points),
                breakdown,
            });
        }

        if (session.quiz_status !== "active") {
            try {
                await client.query("BEGIN");

                const submittedAnswers = answers.length
                    ? answers
                    : await fetchStoredAnswers(client, session.id);
                const result = await finalizeSessionSubmission(client, {
                    sessionId: session.id,
                    quizId: session.quiz_id,
                    submittedAnswers,
                });

                await client.query("COMMIT");

                return res.status(200).json({
                    session_closed: true,
                    score: result.score,
                    total_points: result.total_points,
                    percentage: withPercent(result.score, result.total_points),
                    breakdown: result.breakdown,
                });
            } catch (error) {
                try {
                    await client.query("ROLLBACK");
                } catch {
                    // ignore rollback failures
                }

                throw error;
            }
        }

        await client.query("BEGIN");
        await replaceSessionAnswers(client, session.id, answers, {
            isCorrect: null,
        });
        await client.query("COMMIT");

        return res.status(200).json({ message: "Progress saved" });
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch {
            // ignore rollback failures
        }

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

export async function submitSession(req, res, next) {
    const client = await pool.connect();

    try {
        const headerPayload = sessionHeadersSchema.parse(req.headers);
        const sessionToken = headerPayload["x-session-token"];
        const { answers } = req.validatedBody;

        const sessionResult = await client.query(
            `
      SELECT ss.id, ss.quiz_id, ss.status, ss.score, ss.total_points, q.status AS quiz_status
      FROM student_sessions ss
      INNER JOIN quizzes q ON q.id = ss.quiz_id
      WHERE ss.session_token = $1
      `,
            [sessionToken],
        );

        if (sessionResult.rowCount === 0) {
            return res.status(404).json({ error: "Session not found" });
        }

        const session = sessionResult.rows[0];

        if (session.status === "submitted") {
            const breakdown = await fetchBreakdown(
                client,
                session.id,
                session.quiz_id,
            );
            return res.status(200).json({
                already_submitted: true,
                score: Number(session.score ?? 0),
                total_points: Number(session.total_points ?? 0),
                percentage: withPercent(session.score, session.total_points),
                breakdown,
            });
        }

        if (session.quiz_status !== "active") {
            await client.query("BEGIN");

            const submittedAnswers = answers.length
                ? answers
                : await fetchStoredAnswers(client, session.id);
            const result = await finalizeSessionSubmission(client, {
                sessionId: session.id,
                quizId: session.quiz_id,
                submittedAnswers,
            });

            await client.query("COMMIT");

            return res.status(200).json({
                already_submitted: true,
                score: result.score,
                total_points: result.total_points,
                percentage: withPercent(result.score, result.total_points),
                breakdown: result.breakdown,
            });
        }

        await client.query("BEGIN");

        if (answers.length) {
            await replaceSessionAnswers(client, session.id, answers, {
                isCorrect: null,
            });
        }

        const submittedAnswers = answers.length
            ? answers
            : await fetchStoredAnswers(client, session.id);
        const result = await finalizeSessionSubmission(client, {
            sessionId: session.id,
            quizId: session.quiz_id,
            submittedAnswers,
        });

        await client.query("COMMIT");

        return res.status(200).json({
            score: result.score,
            total_points: result.total_points,
            percentage: withPercent(result.score, result.total_points),
            breakdown: result.breakdown,
        });
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch {
            // ignore rollback failures
        }

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
