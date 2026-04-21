import { importPKCS8, SignJWT } from "jose";

export const generateAppleClientSecret = async ({
    clientId,
    teamId,
    keyId,
    privateKey,
}: {
    clientId: string,
    teamId: string,
    keyId: string,
    privateKey: string
}) => {
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    const key = await importPKCS8(formattedPrivateKey, "ES256");
    const now = Math.floor(Date.now() / 1000);
    
    return new SignJWT({})
        .setProtectedHeader({ alg: "ES256", kid: keyId })
        .setIssuer(teamId)
        .setSubject(clientId)
        .setAudience("https://appleid.apple.com")
        .setIssuedAt(now)
        .setExpirationTime(now + 180 * 24 * 60 * 60)
        .sign(key);
}