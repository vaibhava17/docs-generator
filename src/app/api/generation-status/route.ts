import { NextResponse } from "next/server";
import { getStatus } from "@/lib/status-manager";

export async function GET() {
  try {
    return NextResponse.json(getStatus());
  } catch (error) {
    console.error("Status fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}
