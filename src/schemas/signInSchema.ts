import { z } from 'zod'

import { t } from '@/i18n'

export const apiKeySchema = z.object({
  apiKey: z
    .string()
    .trim()
    .startsWith('comfyui-', t('validation.prefix', { prefix: 'comfyui-' }))
    .length(72, t('validation.length', { length: 72 }))
})

export const signInSchema = z.object({
  email: z
    .string()
    .email(t('validation.invalidEmail'))
    .min(1, t('validation.required')),
  password: z.string().min(1, t('validation.required'))
})

export type SignInData = z.infer<typeof signInSchema>
