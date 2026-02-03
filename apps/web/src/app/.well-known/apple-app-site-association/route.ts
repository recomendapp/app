import { NextResponse } from 'next/server';

const IOS_APPLE_TEAM_ID = process.env.IOS_APPLE_TEAM_ID;
const IOS_BUNDLE_ID = process.env.IOS_BUNDLE_ID;
const BUNDLE_ID = `${IOS_APPLE_TEAM_ID}.${IOS_BUNDLE_ID}`;

const association = {
  applinks: {
    apps: [],
    details: [
      {
		// Syntax: "<APPLE_TEAM_ID>.<BUNDLE_ID>"
        appID: `${BUNDLE_ID}`,
		// All paths that should support redirecting.
        paths: ['*', "/"],
      },
    ],
  },
  // This section enables Apple Handoff
  activitycontinuation: {
    apps: [`${BUNDLE_ID}`],
  },
  // This section enable Shared Web Credentials
  webcredentials: {
    apps: [`${BUNDLE_ID}`],
  }
}

export async function GET() {
	return new NextResponse(JSON.stringify(association), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=86400',
		}
	});
}