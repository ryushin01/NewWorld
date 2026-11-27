import { useMemo, useState } from 'react';
import { REPORT_STATUS_LABELS, REPORT_TARGET_LABELS } from '@admin/shared/api';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  Link,
  useDocumentTitle,
  useParam,
} from '@admin/shared/lib';
import {
  ArticleList,
  ArticleRow,
  ButtonLink,
  Empty,
  ErrorState,
  Loading,
  PageHead,
} from '@admin/shared/ui';
import { useDestinations } from '@admin/entities/destination';
import { useReports } from '@admin/entities/report';
import { useStamps } from '@admin/entities/stamp';
import { Avatar, useUsers } from '@admin/entities/user';

/** 사용자 목록. 본명은 본인만 보므로 어드민에도 닉네임과 사진만 보입니다. */
export function UsersPage() {
  useDocumentTitle('사용자');
  const users = useUsers();
  const stamps = useStamps();
  const reports = useReports();
  const [keyword, setKeyword] = useState('');
  const list = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return [...(users.data ?? [])]
      .filter(
        (user) => !term || user.nickname.toLowerCase().includes(term) || user.id.includes(term),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [users.data, keyword]);
  const stampCount = (id: string) =>
    stamps.data?.filter((stamp) => stamp.userId === id).length ?? 0;
  const openReports = (id: string) =>
    reports.data?.filter((report) => report.targetId === id && report.status === 'open').length ??
    0;

  return (
    <>
      <PageHead en="Users" ko="사용자" />
      <div className="section">
        <div className="filters" role="search" aria-label="사용자 검색">
          <div className="filters__field filters__field--grow">
            <label htmlFor="user-search">닉네임 검색</label>
            <input
              id="user-search"
              className="input"
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
        </div>
        <p className="result-count" role="status">
          {users.data ? `${formatNumber(list.length)}명` : ''}
        </p>
        {users.isPending ? <Loading /> : null}
        {users.error ? <ErrorState error={users.error} /> : null}
        {users.data && !list.length ? <Empty>조건에 맞는 사용자가 없습니다.</Empty> : null}
        <ArticleList label="사용자 목록">
          {list.map((user) => {
            const open = openReports(user.id);
            return (
              <ArticleRow
                key={user.id}
                thumb={<Avatar user={user} size={72} />}
                columns={[
                  { label: 'Joined', value: formatDate(user.createdAt) },
                  { label: 'Stamps', value: `${formatNumber(stampCount(user.id))}개` },
                  {
                    label: 'Reports',
                    value: open ? (
                      <span className="dot-label dot-label--alert">대기 {open}건</span>
                    ) : (
                      '없음'
                    ),
                  },
                ]}
                title={
                  <Link to={`/users/${encodeURIComponent(user.id)}`} className="row__link">
                    {user.nickname}
                  </Link>
                }
              />
            );
          })}
        </ArticleList>
      </div>
    </>
  );
}

export function UserDetailPage() {
  const id = useParam('id');
  const users = useUsers();
  const stamps = useStamps();
  const reports = useReports();
  const destinations = useDestinations();
  const user = users.data?.find((item) => item.id === id);
  useDocumentTitle(user ? `${user.nickname} 사용자` : '사용자');
  if (users.isPending) return <Loading />;
  if (users.error) return <ErrorState error={users.error} />;
  if (!user)
    return (
      <>
        <PageHead en="Not found" ko="사용자를 찾을 수 없습니다" />
        <div className="section">
          <ButtonLink to="/users">사용자 목록으로</ButtonLink>
        </div>
      </>
    );
  const mine = stamps.data?.filter((stamp) => stamp.userId === user.id) ?? [];
  const about = reports.data?.filter((report) => report.targetId === user.id) ?? [];
  const placeName = (placeId: string) =>
    destinations.data?.find((item) => item.id === placeId)?.name ?? placeId;
  return (
    <>
      <PageHead en="Member" ko={user.nickname} />
      <div className="section detail">
        <div className="detail__visual">
          <Avatar user={user} size={240} />
        </div>
        <div className="detail__body">
          <dl className="meta meta--grid">
            <div>
              <dt>회원 ID</dt>
              <dd>
                <code>{user.id}</code>
              </dd>
            </div>
            <div>
              <dt>가입</dt>
              <dd>{formatDateTime(user.createdAt)}</dd>
            </div>
            <div>
              <dt>스탬프</dt>
              <dd>{formatNumber(mine.length)}개</dd>
            </div>
            <div>
              <dt>받은 신고</dt>
              <dd>{formatNumber(about.length)}건</dd>
            </div>
          </dl>
          <h2 className="detail__heading">현장 인증 스탬프</h2>
          {mine.length ? (
            <ul className="chips">
              {mine.map((stamp) => (
                <li key={stamp.id}>
                  <Link
                    to={`/destinations/${encodeURIComponent(stamp.destinationId)}`}
                    className="chip"
                  >
                    {placeName(stamp.destinationId)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>아직 스탬프가 없습니다.</Empty>
          )}
          <h2 className="detail__heading">받은 신고</h2>
          {about.length ? (
            <ul className="plain-list">
              {about.map((report) => (
                <li key={report.id}>
                  {formatDate(report.createdAt)} · {REPORT_TARGET_LABELS[report.target]} ·{' '}
                  {report.reason} · <strong>{REPORT_STATUS_LABELS[report.status]}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>받은 신고가 없습니다.</Empty>
          )}
          <div className="section__more section__more--start">
            <ButtonLink to="/reports">신고 처리로</ButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}
