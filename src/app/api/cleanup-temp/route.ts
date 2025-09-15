import { NextResponse } from "next/server";
import { GitHubDocsGenerator } from "@/lib/github-docs-generator";

export async function POST() {
  try {
    console.log("🧹 Manual cleanup requested via API");

    // Create a temporary instance to access cleanup methods
    const generator = new GitHubDocsGenerator(
      { provider: "openai", apiKey: "temp" }, // Dummy config for cleanup
      {}
    );

    await generator.forceCleanupAllTempRepos();

    return NextResponse.json({
      success: true,
      message: "All temporary repositories have been cleaned successfully",
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to cleanup temporary repositories: " +
          (error as Error).message,
      },
      { status: 500 }
    );
  }
}
