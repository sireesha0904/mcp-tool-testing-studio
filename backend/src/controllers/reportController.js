import { db } from "../database/database.js";

export function getQualityReport(req, res) {
  try {
    /* ---------------------------------------------------------
       Overall test statistics
    --------------------------------------------------------- */

    const testStats = db
      .prepare(
        `
        SELECT
          COUNT(*) AS total_runs,
          SUM(CASE WHEN status = 'PASSED' THEN 1 ELSE 0 END) AS passed_runs,
          SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed_runs,
          ROUND(
            CASE
              WHEN COUNT(*) = 0 THEN 0
              ELSE (
                SUM(CASE WHEN status = 'PASSED' THEN 1.0 ELSE 0 END)
                / COUNT(*)
              ) * 100
            END,
            0
          ) AS success_rate,
          ROUND(AVG(duration_ms), 2) AS average_duration_ms
        FROM test_runs
      `,
      )
      .get();

    /* ---------------------------------------------------------
       Tool statistics
    --------------------------------------------------------- */

    const toolStats = db
      .prepare(
        `
        SELECT
          tools.id AS tool_id,
          tools.name AS tool_name,
          COUNT(test_runs.id) AS total_runs,
          SUM(
            CASE
              WHEN test_runs.status = 'PASSED' THEN 1
              ELSE 0
            END
          ) AS passed_runs,
          SUM(
            CASE
              WHEN test_runs.status = 'FAILED' THEN 1
              ELSE 0
            END
          ) AS failed_runs,
          ROUND(
            CASE
              WHEN COUNT(test_runs.id) = 0 THEN 0
              ELSE (
                SUM(
                  CASE
                    WHEN test_runs.status = 'PASSED' THEN 1.0
                    ELSE 0
                  END
                ) / COUNT(test_runs.id)
              ) * 100
            END,
            0
          ) AS success_rate,
          ROUND(AVG(test_runs.duration_ms), 2) AS average_duration_ms
        FROM tools
        LEFT JOIN test_runs
          ON tools.id = test_runs.tool_id
        GROUP BY tools.id, tools.name
        ORDER BY tools.name ASC
      `,
      )
      .all();

    /* ---------------------------------------------------------
       Recent test activity
    --------------------------------------------------------- */

    const recentRuns = db
      .prepare(
        `
        SELECT
          test_runs.id,
          test_runs.tool_id,
          tools.name AS tool_name,
          test_runs.status,
          test_runs.duration_ms,
          test_runs.error_message,
          test_runs.created_at
        FROM test_runs
        LEFT JOIN tools
          ON test_runs.tool_id = tools.id
        ORDER BY test_runs.created_at DESC
        LIMIT 10
      `,
      )
      .all();

    /* ---------------------------------------------------------
       Validation statistics
    --------------------------------------------------------- */

    let validationStats = {
      total_validations: 0,
      agent_ready: 0,
      almost_ready: 0,
      needs_work: 0,
      not_ready: 0,
      average_score: 0,
    };

    try {
      validationStats =
        db
          .prepare(
            `
            SELECT
              COUNT(*) AS total_validations,

              SUM(
                CASE
                  WHEN status = 'AGENT_READY' THEN 1
                  ELSE 0
                END
              ) AS agent_ready,

              SUM(
                CASE
                  WHEN status = 'ALMOST_READY' THEN 1
                  ELSE 0
                END
              ) AS almost_ready,

              SUM(
                CASE
                  WHEN status = 'NEEDS_WORK' THEN 1
                  ELSE 0
                END
              ) AS needs_work,

              SUM(
                CASE
                  WHEN status = 'NOT_READY' THEN 1
                  ELSE 0
                END
              ) AS not_ready,

              ROUND(AVG(score), 0) AS average_score

            FROM validations
          `,
          )
          .get() || validationStats;
    } catch (validationError) {
      console.warn(
        "Validation statistics unavailable:",
        validationError.message,
      );
    }

    /* ---------------------------------------------------------
       Latest validation per tool
    --------------------------------------------------------- */

    let latestValidations = [];

    try {
      latestValidations = db
        .prepare(
          `
          SELECT
            v.id,
            v.tool_id,
            t.name AS tool_name,
            v.score,
            v.status,
            v.created_at
          FROM validations v
          LEFT JOIN tools t
            ON v.tool_id = t.id
          INNER JOIN (
            SELECT
              tool_id,
              MAX(id) AS latest_id
            FROM validations
            GROUP BY tool_id
          ) latest
            ON v.id = latest.latest_id
          ORDER BY v.score ASC, t.name ASC
        `,
        )
        .all();
    } catch (validationError) {
      console.warn(
        "Latest validation data unavailable:",
        validationError.message,
      );
    }

    /* ---------------------------------------------------------
       Recommendations
    --------------------------------------------------------- */

    const recommendations = [];

    if (Number(testStats.failed_runs || 0) > 0) {
      recommendations.push({
        priority: "HIGH",
        title: "Review failed tool executions",
        description:
          "One or more MCP tool executions have failed. Review the History and Debug modules to identify input or execution issues.",
      });
    }

    if (
      Number(testStats.total_runs || 0) > 0 &&
      Number(testStats.success_rate || 0) < 80
    ) {
      recommendations.push({
        priority: "HIGH",
        title: "Improve execution reliability",
        description:
          "The overall test success rate is below 80%. Investigate recurring failures before exposing these tools to agents.",
      });
    }

    if (
      Number(validationStats.total_validations || 0) > 0 &&
      Number(validationStats.average_score || 0) < 80
    ) {
      recommendations.push({
        priority: "MEDIUM",
        title: "Improve agent readiness",
        description:
          "The average validation score is below the AGENT_READY threshold. Review tool descriptions, schemas, error handling, security, and agent compatibility.",
      });
    }

    if (
      Number(validationStats.total_validations || 0) > 0 &&
      Number(validationStats.not_ready || 0) > 0
    ) {
      recommendations.push({
        priority: "HIGH",
        title: "Address tools marked NOT_READY",
        description:
          "At least one validated MCP tool is currently below the minimum readiness threshold.",
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: "LOW",
        title: "No critical issues detected",
        description:
          "Current test and validation results do not indicate any immediate quality blockers.",
      });
    }

    /* ---------------------------------------------------------
       Final report
    --------------------------------------------------------- */

    return res.json({
      success: true,

      generatedAt: new Date().toISOString(),

      summary: {
        totalRuns: Number(testStats.total_runs || 0),
        passedRuns: Number(testStats.passed_runs || 0),
        failedRuns: Number(testStats.failed_runs || 0),
        successRate: Number(testStats.success_rate || 0),
        averageDurationMs: Number(testStats.average_duration_ms || 0),

        totalValidations: Number(validationStats.total_validations || 0),

        agentReady: Number(validationStats.agent_ready || 0),
        almostReady: Number(validationStats.almost_ready || 0),
        needsWork: Number(validationStats.needs_work || 0),
        notReady: Number(validationStats.not_ready || 0),

        averageValidationScore: Number(validationStats.average_score || 0),
      },

      tools: toolStats,

      validations: latestValidations,

      recentRuns,

      recommendations,
    });
  } catch (error) {
    console.error("Failed to generate quality report:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to generate quality report.",
      message: error.message,
    });
  }
}
