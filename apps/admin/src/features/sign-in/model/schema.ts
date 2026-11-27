import { z } from 'zod';

/** 앱과 같은 아이디 규칙(영문 소문자·숫자·밑줄 4~20자). */
export const signInSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{4,20}$/, '아이디는 영문 소문자·숫자·밑줄 4~20자입니다.'),
  password: z.string().min(8, '비밀번호는 8자 이상입니다.'),
});
export type SignInValues = z.infer<typeof signInSchema>;
