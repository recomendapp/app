"use server"
import { createHmac } from "crypto";

const hmac = (subscriberId: string, secret: string) => {
	return createHmac('sha256', secret)
		.update(subscriberId)
		.digest('hex');
}
export const getNovuSubscriberHash = async (subscriberId: string) => {
	const secret = process.env.NOVU_API_KEY;
	if (!secret) throw new Error('NOVU_API_KEY is not defined');
	return hmac(subscriberId, secret);
};
