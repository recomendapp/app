import { NextResponse } from 'next/server';

const PACKAGE_NAME = process.env.ANDROID_PACKAGE_NAME;
const FINGERPRINTS = process.env.ANDROID_SHA256_FINGERPRINTS?.split(',') || [];

const association = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: PACKAGE_NAME,
      sha256_cert_fingerprints: FINGERPRINTS,
    }
  }
]

export async function GET() {
	return new NextResponse(JSON.stringify(association), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=86400',
		}
	});
}