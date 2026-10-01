import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, profiles } from '../db/schema/index.js';
import { hashPassword } from '../lib/hash.js';
import { generatePseudonym } from '../lib/pseudonym.js';

export const registerBodySchema = z.object({
  email: z
    .string()
    .email('E-mail inválido')
    .transform((val) => val.toLowerCase().trim()),
  password: z.string().min(8, 'A senha deve conter no mínimo 8 caracteres'),
  isAdult: z.literal(true, {
    errorMap: () => ({ message: 'É obrigatório ter 18 anos ou mais para utilizar a plataforma.' }),
  }),
  persona: z
    .enum(['navegador', 'apoio'], {
      errorMap: () => ({ message: "A persona deve ser 'navegador' ou 'apoio'." }),
    })
    .default('navegador'),
});

export type RegisterBodyInput = z.infer<typeof registerBodySchema>;

export class EmailConflictError extends Error {
  constructor(message = 'E-mail já cadastrado no sistema.') {
    super(message);
    this.name = 'EmailConflictError';
  }
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/register', async (request, reply) => {
    const parseResult = registerBodySchema.safeParse(request.body);

    if (!parseResult.success) {
      const firstMessage = parseResult.error.issues[0]?.message ?? 'Dados de cadastro inválidos.';
      return reply.status(400).send({
        status: 'error',
        message: firstMessage,
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { email, password, persona } = parseResult.data;

    try {
      const registrationResult = await db.transaction(async (tx) => {
        // 1. Checar unicidade do e-mail
        const [existingUser] = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser) {
          throw new EmailConflictError('E-mail já cadastrado no sistema.');
        }

        // 2. Hash da senha com Argon2id
        const passwordHash = await hashPassword(password);

        // 3. Insert em auth_security.users
        const [createdUser] = await tx
          .insert(users)
          .values({
            email,
            passwordHash,
            isAdult: true,
            role: 'user',
          })
          .returning({
            id: users.id,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
          });

        if (!createdUser) {
          throw new Error('Falha ao criar o registro de usuário.');
        }

        // 4. Gerar pseudônimo automático único e insert em recovery_core.profiles
        let pseudonym = generatePseudonym();
        for (let attempt = 0; attempt < 5; attempt++) {
          const [existingProfile] = await tx
            .select({ id: profiles.id })
            .from(profiles)
            .where(eq(profiles.pseudonym, pseudonym))
            .limit(1);

          if (!existingProfile) {
            break;
          }
          pseudonym = generatePseudonym();
        }

        const [createdProfile] = await tx
          .insert(profiles)
          .values({
            userId: createdUser.id,
            pseudonym,
            avatarId: 'avatar_default',
            persona,
          })
          .returning({
            id: profiles.id,
            pseudonym: profiles.pseudonym,
            avatarId: profiles.avatarId,
            persona: profiles.persona,
          });

        if (!createdProfile) {
          throw new Error('Falha ao criar o registro de perfil.');
        }

        const createdAtFormatted =
          createdUser.createdAt instanceof Date
            ? createdUser.createdAt.toISOString()
            : new Date(createdUser.createdAt).toISOString();

        return {
          user: {
            id: createdUser.id,
            email: createdUser.email,
            role: createdUser.role,
            createdAt: createdAtFormatted,
          },
          profile: {
            id: createdProfile.id,
            pseudonym: createdProfile.pseudonym,
            avatarId: createdProfile.avatarId,
            persona: createdProfile.persona,
          },
        };
      });

      return reply.status(201).send({
        status: 'success',
        data: registrationResult,
      });
    } catch (error: unknown) {
      const isUniqueConstraintViolation =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === '23505';

      if (error instanceof EmailConflictError || isUniqueConstraintViolation) {
        return reply.status(409).send({
          status: 'error',
          message: 'E-mail já cadastrado no sistema.',
        });
      }

      request.log.error(error, 'Falha ao registrar novo usuário');
      return reply.status(500).send({
        status: 'error',
        message: 'Erro interno ao processar o registro.',
      });
    }
  });
};
