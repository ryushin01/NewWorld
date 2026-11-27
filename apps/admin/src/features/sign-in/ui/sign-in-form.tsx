import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, ErrorState, Field } from '@admin/shared/ui';
import { signInSchema, type SignInValues } from '../model/schema';
import { useSignIn } from '../model/use-sign-in';

/** 실제 Supabase 모드의 관리자 로그인. 관리자 표(public.admins)에 있는 계정만 들어갑니다. */
export function SignInForm() {
  const signIn = useSignIn();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { username: '', password: '' },
  });
  return (
    <form
      className="form form--narrow"
      noValidate
      onSubmit={handleSubmit((values) => signIn.mutate(values))}
    >
      <Field label="아이디" error={errors.username?.message} required>
        {(props) => (
          <input className="input" autoComplete="username" {...props} {...register('username')} />
        )}
      </Field>
      <Field label="비밀번호" error={errors.password?.message} required>
        {(props) => (
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            {...props}
            {...register('password')}
          />
        )}
      </Field>
      {signIn.error ? <ErrorState error={signIn.error} /> : null}
      <Button type="submit" variant="solid" disabled={signIn.isPending}>
        {signIn.isPending ? '확인하는 중' : '관리자 로그인'}
      </Button>
    </form>
  );
}
