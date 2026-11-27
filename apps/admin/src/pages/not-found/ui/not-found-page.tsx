import { useDocumentTitle } from '@admin/shared/lib';
import { ButtonLink, PageHead } from '@admin/shared/ui';

export function NotFoundPage() {
  useDocumentTitle('없는 화면');
  return (
    <>
      <PageHead en="404" ko="없는 화면입니다" />
      <div className="section">
        <ButtonLink to="/dashboard">대시보드로</ButtonLink>
      </div>
    </>
  );
}
