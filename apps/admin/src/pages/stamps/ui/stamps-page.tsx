import { useMemo, useState } from 'react';
import type { Stamp } from '@admin/shared/api';
import { formatDateTime, formatNumber, Link, useDocumentTitle } from '@admin/shared/lib';
import {
  ArticleList,
  ArticleRow,
  Button,
  Empty,
  ErrorState,
  Loading,
  PageHead,
} from '@admin/shared/ui';
import { useDestinations } from '@admin/entities/destination';
import { useStamps } from '@admin/entities/stamp';
import { useUsers } from '@admin/entities/user';
import { RevokeStampDialog } from '@admin/features/revoke-stamp';

const PAGE = 30;
const METHOD_LABELS: Record<Stamp['method'], string> = { gps: '위치 인증', demo: '데모 인증' };

/** 현장 인증 스탬프 목록. 부정 인증으로 보이는 스탬프를 취소합니다. */
export function StampsPage() {
  useDocumentTitle('현장 인증 스탬프');
  const stamps = useStamps();
  const users = useUsers();
  const destinations = useDestinations();
  const [keyword, setKeyword] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [target, setTarget] = useState<Stamp | null>(null);

  const userName = (id: string) =>
    users.data?.find((user) => user.id === id)?.nickname ?? '탈퇴한 회원';
  const placeName = (id: string) => destinations.data?.find((item) => item.id === id)?.name ?? id;
  const list = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return (stamps.data ?? []).filter((stamp) => {
      if (!term) return true;
      const user = users.data?.find((item) => item.id === stamp.userId)?.nickname ?? '';
      const place =
        destinations.data?.find((item) => item.id === stamp.destinationId)?.name ??
        stamp.destinationId;
      return user.toLowerCase().includes(term) || place.toLowerCase().includes(term);
    });
  }, [stamps.data, users.data, destinations.data, keyword]);

  return (
    <>
      <PageHead en="Stamps" ko="현장 인증 스탬프" />
      <div className="section">
        <div className="filters" role="search" aria-label="스탬프 검색">
          <div className="filters__field filters__field--grow">
            <label htmlFor="stamp-search">회원·여행지 검색</label>
            <input
              id="stamp-search"
              className="input"
              type="search"
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setLimit(PAGE);
              }}
            />
          </div>
        </div>
        <p className="result-count" role="status">
          {stamps.data ? `${formatNumber(list.length)}개` : ''}
        </p>
        {stamps.isPending ? <Loading /> : null}
        {stamps.error ? <ErrorState error={stamps.error} /> : null}
        {stamps.data && !list.length ? <Empty>스탬프가 없습니다.</Empty> : null}
        <ArticleList label="스탬프 목록">
          {list.slice(0, limit).map((stamp) => (
            <ArticleRow
              key={stamp.id}
              columns={[
                { label: 'Date', value: formatDateTime(stamp.checkedAt) },
                {
                  label: 'Member',
                  value: (
                    <Link to={`/users/${encodeURIComponent(stamp.userId)}`} className="text-link">
                      {userName(stamp.userId)}
                    </Link>
                  ),
                },
                {
                  label: 'Method',
                  value: `${METHOD_LABELS[stamp.method]} · ${stamp.distanceKm.toFixed(2)}km`,
                },
              ]}
              title={
                <Link
                  to={`/destinations/${encodeURIComponent(stamp.destinationId)}`}
                  className="row__link"
                >
                  {placeName(stamp.destinationId)}
                </Link>
              }
              actions={
                <Button
                  variant="line"
                  className="row__action"
                  aria-label={`${userName(stamp.userId)}의 ${placeName(stamp.destinationId)} 스탬프 취소`}
                  onClick={() => setTarget(stamp)}
                >
                  취소
                </Button>
              }
            />
          ))}
        </ArticleList>
        {list.length > limit ? (
          <div className="section__more">
            <Button onClick={() => setLimit(limit + PAGE)}>스탬프 더 보기</Button>
          </div>
        ) : null}
      </div>
      <RevokeStampDialog
        stamp={target}
        label={target ? `${userName(target.userId)}의 ${placeName(target.destinationId)}` : ''}
        onClose={() => setTarget(null)}
      />
    </>
  );
}
