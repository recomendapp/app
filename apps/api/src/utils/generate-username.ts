import { eq } from 'drizzle-orm';
import { user } from '@libs/db/schemas';
import { USER_RULES } from '../config/validation-rules';
import { DrizzleService } from '../common/modules/drizzle/drizzle.module';

export const generateUniqueUsername = async ({
	email,
	db,
	options = { maxAttempts: 100 },
}: {
	email: string,
	db: DrizzleService,
	options?: {
		maxAttempts: number,
	}
}): Promise<string> => {
    let base = email.split('@')[0];

    base = base.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    if (base.length < USER_RULES.USERNAME.MIN) {
        base = base.padEnd(USER_RULES.USERNAME.MIN, '0');
    }

    let candidate = base;

    for (let attempt = 0; attempt < options.maxAttempts; attempt++) {
        if (candidate.length > USER_RULES.USERNAME.MAX) {
            candidate = candidate.substring(0, USER_RULES.USERNAME.MAX);
        }

        const existingUser = await db.query.user.findFirst({
            where: eq(user.username, candidate),
            columns: { id: true },
        });

        if (!existingUser && USER_RULES.USERNAME.REGEX.test(candidate)) {
            return candidate;
        }

        const randomSuffix = Math.floor(Math.random() * 100000).toString(); // Jusqu'à 5 chiffres
        
        const maxBaseLength = USER_RULES.USERNAME.MAX - randomSuffix.length;
        
        candidate = `${base.substring(0, maxBaseLength)}${randomSuffix}`;
    }

    throw new Error(`Unable to generate a unique username after ${options.maxAttempts} attempts`);
};