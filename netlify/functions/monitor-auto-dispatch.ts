import type { Config } from "@netlify/functions";
import { AUTO_MONITOR_USER_BATCH, getDueAutoMonitorUsers } from "../../lib/monitorSchedule";

export const config: Config = {
  schedule: "*/15 * * * *",
};

export default async function handler() {
  const scheduleSecret = process.env.MONITOR_SCHEDULE_SECRET?.trim();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.URL?.trim() ||
    process.env.DEPLOY_PRIME_URL?.trim();

  if (!scheduleSecret || !siteUrl) {
    return Response.json(
      {
        ok: false,
        message:
          "Automatisation monitoring non configurée (MONITOR_SCHEDULE_SECRET ou NEXT_PUBLIC_SITE_URL manquant).",
      },
      { status: 500 }
    );
  }

  try {
    const dueUsers = await getDueAutoMonitorUsers(AUTO_MONITOR_USER_BATCH);
    const runnerUrl = new URL("/.netlify/functions/monitor-auto-runner-background", siteUrl).toString();

    const dispatchResults = await Promise.all(
      dueUsers.map(async (user) => {
        try {
          const response = await fetch(runnerUrl, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-monitor-schedule-secret": scheduleSecret,
            },
            body: JSON.stringify({
              userId: user.userId,
              continueQueue: user.resumeQueue,
            }),
          });

          return {
            userId: user.userId,
            plan: user.plan,
            resumeQueue: user.resumeQueue,
            dispatched: response.ok || response.status === 202,
            status: response.status,
          };
        } catch (error) {
          return {
            userId: user.userId,
            plan: user.plan,
            resumeQueue: user.resumeQueue,
            dispatched: false,
            status: 0,
            error: error instanceof Error ? error.message : "Dispatch failed",
          };
        }
      })
    );

    return Response.json({
      ok: true,
      scheduledAt: new Date().toISOString(),
      dueUsers: dueUsers.length,
      dispatchResults,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Dispatch failed",
      },
      { status: 500 }
    );
  }
}
