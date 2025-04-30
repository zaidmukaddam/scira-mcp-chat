import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    // Resolve the path to the project root and mcp.json
    const filePath = path.resolve(process.cwd(), "mcp.json");
    const fileContents = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(fileContents);
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: "Could not read mcp.json", details: error instanceof Error ? error.message : error }, { status: 500 });
  }
}
