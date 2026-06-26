import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// POST /api/narrative
// Generates a report summary - either with AI or a simple template
// Body: grantName, reportingMonth, pblCompletionRate, evidenceSubmissionRate, attendanceRate, riskStatus, milestoneSummary, aiEnabled
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      grantName,
      reportingMonth,
      pblCompletionRate,
      evidenceSubmissionRate,
      attendanceRate,
      riskStatus,
      milestoneSummary,
      aiEnabled,
    } = body;

    // Keep track of what facts we used (for traceability)
    const sourceFacts = {
      grantName,
      reportingMonth,
      pblCompletionRate,
      evidenceSubmissionRate,
      attendanceRate,
      riskStatus,
      milestoneSummary,
      aiEnabled,
    };

    let narrative: string;

    if (aiEnabled) {
      // Try AI first if enabled
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        // Tell AI to only use the facts we give it - no making stuff up
        const systemPrompt = "Write a 2-3 sentence report-ready summary using ONLY the facts provided. Never invent numbers, locations, achievements, or evidence not present in the input.";

        const userPrompt = `Grant: ${grantName}
Month: ${reportingMonth}
PBL Completion Rate: ${pblCompletionRate}%
Evidence Submission Rate: ${evidenceSubmissionRate}%
Attendance Rate: ${attendanceRate}%
Risk Status: ${riskStatus}
Milestone Summary: ${milestoneSummary || "Not provided"}`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 200,
          temperature: 0.3,
        });

        narrative = completion.choices[0]?.message?.content || "";
      } catch (aiError) {
        console.error("AI generation failed, falling back to template:", aiError);
        // Fall back to deterministic template if AI fails
        narrative = generateDeterministicNarrative(
          grantName,
          reportingMonth,
          pblCompletionRate,
          evidenceSubmissionRate,
          attendanceRate,
          riskStatus
        );
      }
    } else {
      // Use deterministic template
      narrative = generateDeterministicNarrative(
        grantName,
        reportingMonth,
        pblCompletionRate,
        evidenceSubmissionRate,
        attendanceRate,
        riskStatus
      );
    }

    return NextResponse.json({
      narrative,
      sourceFacts,
    });
  } catch (error) {
    console.error("Error generating narrative:", error);
    return NextResponse.json(
      { error: "Failed to generate narrative" },
      { status: 500 }
    );
  }
}

// Simple template-based narrative - used when AI is off or fails
function generateDeterministicNarrative(
  grantName: string,
  reportingMonth: string,
  pblCompletionRate: number,
  evidenceSubmissionRate: number,
  attendanceRate: number,
  riskStatus: string
): string {
  return `In ${reportingMonth}, ${grantName} reached ${pblCompletionRate}% PBL completion, ${evidenceSubmissionRate}% evidence submission, and ${attendanceRate}% attendance. Status: ${riskStatus}.`;
}
