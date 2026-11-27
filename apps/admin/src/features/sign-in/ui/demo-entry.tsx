import { Button, ErrorState } from '@admin/shared/ui';
import { useSignIn } from '../model/use-sign-in';

/** 공개 데모의 입장 버튼. 아이디·비밀번호 없이 시드 데이터로 들어갑니다. */
export function DemoEntry() {
  const signIn = useSignIn();
  return (
    <div className="demo-entry">
      <Button variant="solid" onClick={() => signIn.mutate(undefined)} disabled={signIn.isPending}>
        관리자로 둘러보기
      </Button>
      {signIn.error ? <ErrorState error={signIn.error} /> : null}
    </div>
  );
}
