import { LORE_LABELS, REALM_LABELS } from '@admin/shared/api';
import { formatDateTime, formatNumber, Link, useDocumentTitle, useParam } from '@admin/shared/lib';
import { ButtonLink, Empty, ErrorState, Loading, PageHead, Tile } from '@admin/shared/ui';
import { useCourses } from '@admin/entities/course';
import { useDestinations } from '@admin/entities/destination';
import { useStamps } from '@admin/entities/stamp';
import { HiddenToggle } from '@admin/features/toggle-hidden';

export function DestinationDetailPage() {
  const id = useParam('id');
  const destinations = useDestinations();
  const stamps = useStamps();
  const courses = useCourses();
  const item = destinations.data?.find((destination) => destination.id === id);
  useDocumentTitle(item ? `${item.name} 여행지` : '여행지');

  if (destinations.isPending) return <Loading />;
  if (destinations.error) return <ErrorState error={destinations.error} />;
  if (!item)
    return (
      <>
        <PageHead en="Not found" ko="여행지를 찾을 수 없습니다" />
        <div className="section">
          <ButtonLink to="/destinations">여행지 목록으로</ButtonLink>
        </div>
      </>
    );

  const stampCount = stamps.data?.filter((stamp) => stamp.destinationId === item.id).length ?? 0;
  const inCourses = courses.data?.filter((course) => course.stops.includes(item.id)) ?? [];

  return (
    <>
      <PageHead en={item.originalName || 'Destination'} ko={item.name}>
        <ButtonLink to={`/destinations/${encodeURIComponent(item.id)}/edit`}>수정하기</ButtonLink>
        <HiddenToggle kind="destination" id={item.id} name={item.name} hidden={item.hidden} />
      </PageHead>
      <div className="section detail">
        <div className="detail__visual">
          <Tile
            label={item.originalName || item.name}
            tone={item.hidden ? 'muted' : item.realm}
            size="lg"
          />
          {item.hidden ? <p className="tag tag--block">숨김: 앱에서 보이지 않습니다</p> : null}
        </div>
        <div className="detail__body">
          <p className="detail__lead">{item.tagline}</p>
          <dl className="meta meta--grid">
            <div>
              <dt>ID</dt>
              <dd>
                <code>{item.id}</code>
              </dd>
            </div>
            <div>
              <dt>분류</dt>
              <dd>
                {REALM_LABELS[item.realm]} · {LORE_LABELS[item.lore]}
              </dd>
            </div>
            <div>
              <dt>묶음</dt>
              <dd>{item.group}</dd>
            </div>
            <div>
              <dt>지역</dt>
              <dd>{item.location || '—'}</dd>
            </div>
            <div>
              <dt>시대</dt>
              <dd>{item.era || '—'}</dd>
            </div>
            <div>
              <dt>좌표</dt>
              <dd>
                {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
              </dd>
            </div>
            <div>
              <dt>스탬프</dt>
              <dd>{formatNumber(stampCount)}개</dd>
            </div>
            <div>
              <dt>최근 수정</dt>
              <dd>{formatDateTime(item.updatedAt)}</dd>
            </div>
          </dl>
          <h2 className="detail__heading">소개</h2>
          {item.overview ? (
            <p className="detail__text">{item.overview}</p>
          ) : (
            <Empty>소개가 없습니다.</Empty>
          )}
          <h2 className="detail__heading">포함된 코스</h2>
          {inCourses.length ? (
            <ul className="chips">
              {inCourses.map((course) => (
                <li key={course.id}>
                  <Link to={`/courses/${encodeURIComponent(course.id)}/edit`} className="chip">
                    {course.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>이 여행지를 지나는 코스가 없습니다.</Empty>
          )}
        </div>
      </div>
    </>
  );
}
