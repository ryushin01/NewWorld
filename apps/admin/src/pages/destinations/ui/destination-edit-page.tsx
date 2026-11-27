import { useDocumentTitle, useParam } from '@admin/shared/lib';
import { ButtonLink, ErrorState, Loading, PageHead } from '@admin/shared/ui';
import { useDestinations } from '@admin/entities/destination';
import { DestinationForm } from '@admin/features/destination-form';

export function DestinationNewPage() {
  useDocumentTitle('여행지 추가');
  return (
    <>
      <PageHead en="New destination" ko="여행지 추가" />
      <div className="section">
        <DestinationForm />
      </div>
    </>
  );
}

export function DestinationEditPage() {
  const id = useParam('id');
  const destinations = useDestinations();
  const item = destinations.data?.find((destination) => destination.id === id);
  useDocumentTitle(item ? `${item.name} 수정` : '여행지 수정');
  return (
    <>
      <PageHead en="Edit destination" ko={item ? `${item.name} 수정` : '여행지 수정'} />
      <div className="section">
        {destinations.isPending ? <Loading /> : null}
        {destinations.error ? <ErrorState error={destinations.error} /> : null}
        {destinations.data && !item ? (
          <ButtonLink to="/destinations">여행지를 찾을 수 없습니다. 목록으로</ButtonLink>
        ) : null}
        {item ? <DestinationForm key={item.updatedAt} initial={item} /> : null}
      </div>
    </>
  );
}
