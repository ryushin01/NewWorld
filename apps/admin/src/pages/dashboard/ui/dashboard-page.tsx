import { useMemo } from 'react';
import { LORE_LABELS } from '@admin/shared/api';
import { formatDate, formatNumber, Link, useDocumentTitle } from '@admin/shared/lib';
import {
  ArticleList,
  ArticleRow,
  ButtonLink,
  ErrorState,
  Loading,
  Marquee,
  Tile,
} from '@admin/shared/ui';
import { useDestinations } from '@admin/entities/destination';
import { useReports } from '@admin/entities/report';
import { useStamps } from '@admin/entities/stamp';
import { Avatar, useUsers } from '@admin/entities/user';
import {
  BarChart,
  dailyCounts,
  overview,
  topCollectors,
  topDestinations,
} from '@admin/features/dashboard-stats';

const DAYS = 30;

/** 대시보드: 레퍼런스 첫 화면(큰 붉은 글자와 겹친 타일), 회사 소개 같은 지표 칸, 연혁 같은 기간 표시. */
export function DashboardPage() {
  useDocumentTitle('대시보드');
  const users = useUsers();
  const stamps = useStamps();
  const reports = useReports();
  const destinations = useDestinations();
  const now = useMemo(() => new Date(), []);

  const ready = users.data && stamps.data && reports.data && destinations.data;
  const error = users.error ?? stamps.error ?? reports.error ?? destinations.error;
  const stats = useMemo(() => {
    if (!users.data || !stamps.data || !reports.data || !destinations.data) return null;
    return {
      summary: overview(
        {
          users: users.data,
          stamps: stamps.data,
          reports: reports.data,
          destinations: destinations.data,
        },
        DAYS,
        now,
      ),
      signups: dailyCounts(
        users.data.map((user) => user.createdAt),
        DAYS,
        now,
      ),
      stampsByDay: dailyCounts(
        stamps.data.map((stamp) => stamp.checkedAt),
        DAYS,
        now,
      ),
      top: topDestinations(stamps.data, destinations.data, 10),
      collectors: topCollectors(stamps.data, users.data, 5),
    };
  }, [users.data, stamps.data, reports.data, destinations.data, now]);
  const collage = stats?.top.slice(0, 4) ?? [];
  const since = new Date(now.getTime() - (DAYS - 1) * 24 * 60 * 60 * 1000);

  return (
    <>
      <section className="hero" aria-labelledby="dashboard-title">
        <p className="hero__tagline">「신화와 전설, 역사를 걷는」 여행 앱 신세계의 운영 현황.</p>
        <h1 className="visually-hidden" id="dashboard-title" tabIndex={-1} data-page-title>
          대시보드
        </h1>
        <div className="hero__collage" aria-hidden="true">
          {collage.map((item, index) => (
            <div key={item.destination.id} className={`hero__tile hero__tile--${index + 1}`}>
              <Tile
                label={item.destination.originalName || item.destination.name}
                tone={item.destination.realm}
                size="lg"
              />
            </div>
          ))}
        </div>
        <p className="hero__display" aria-hidden="true">
          New,
          <br />
          World
          <br />
          Admin.
        </p>
        <div className="hero__scroll" aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <defs>
              <path id="scroll-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
            </defs>
            <circle cx="60" cy="60" r="58" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <text>
              <textPath href="#scroll-circle">SCROLL DOWN · SCROLL DOWN · SCROLL DOWN ·</textPath>
            </text>
          </svg>
        </div>
      </section>

      {error ? <ErrorState error={error} /> : null}
      {!ready && !error ? <Loading label="지표를 불러오는 중입니다" /> : null}

      {stats ? (
        <>
          <section className="section overview" aria-labelledby="overview-title">
            <div className="section__label">
              <p className="section__en" aria-hidden="true">
                Overview
              </p>
              <h2 className="section__ko" id="overview-title">
                운영 지표
              </h2>
            </div>
            <dl className="kpis">
              <div className="kpi">
                <dt>전체 회원</dt>
                <dd>
                  {formatNumber(stats.summary.users)}
                  <small>명</small>
                </dd>
              </div>
              <div className="kpi">
                <dt>최근 {DAYS}일 가입</dt>
                <dd>
                  {formatNumber(stats.summary.recentSignups)}
                  <small>명</small>
                </dd>
              </div>
              <div className="kpi">
                <dt>현장 인증 스탬프</dt>
                <dd>
                  {formatNumber(stats.summary.stamps)}
                  <small>개</small>
                </dd>
              </div>
              <div className="kpi kpi--accent">
                <dt>처리 대기 신고</dt>
                <dd>
                  {formatNumber(stats.summary.openReports)}
                  <small>건</small>
                </dd>
              </div>
            </dl>
            <div className="section__more">
              <ButtonLink to="/reports">신고 처리하러 가기</ButtonLink>
            </div>
          </section>

          <Marquee text="SIGNUPS & STAMPS " className="band" />

          <section className="section" aria-labelledby="trend-title">
            <div className="section__label">
              <p className="section__en" aria-hidden="true">
                Trend
              </p>
              <h2 className="section__ko" id="trend-title">
                가입·스탬프 추이
              </h2>
            </div>
            <p className="period">
              <span className="period__edge">({formatDate(since.toISOString())}</span>
              <span className="period__line" aria-hidden="true" />
              <span className="visually-hidden">부터 </span>
              <span className="period__edge">{formatDate(now.toISOString())})</span>
            </p>
            <div className="charts">
              <BarChart title="가입" unit="명" data={stats.signups} />
              <BarChart title="스탬프" unit="개" data={stats.stampsByDay} />
            </div>
          </section>

          <Marquee text="POPULAR DESTINATIONS " className="band" />

          <section className="section" aria-labelledby="popular-title">
            <div className="section__label">
              <p className="section__en" aria-hidden="true">
                Popular
              </p>
              <h2 className="section__ko" id="popular-title">
                인기 여행지
              </h2>
            </div>
            <ArticleList label="스탬프가 많은 여행지 10곳">
              {stats.top.map((item, index) => (
                <ArticleRow
                  key={item.destination.id}
                  thumb={
                    <Tile
                      label={item.destination.originalName || item.destination.name}
                      tone={item.destination.realm}
                      size="sm"
                    />
                  }
                  columns={[
                    {
                      label: 'Rank',
                      value: <span className="rank">{String(index + 1).padStart(2, '0')}</span>,
                    },
                    {
                      label: 'Category',
                      value: (
                        <span className="dot-label">{LORE_LABELS[item.destination.lore]}</span>
                      ),
                    },
                    { label: 'Stamps', value: `${formatNumber(item.count)}개` },
                  ]}
                  title={
                    <Link
                      to={`/destinations/${encodeURIComponent(item.destination.id)}`}
                      className="row__link"
                    >
                      {item.destination.name}
                    </Link>
                  }
                />
              ))}
            </ArticleList>
            <div className="section__more">
              <ButtonLink to="/destinations">여행지 모두 보기</ButtonLink>
            </div>
          </section>

          <Marquee text="TOP EXPLORERS " className="band" />

          <section className="section" aria-labelledby="explorers-title">
            <div className="section__label">
              <p className="section__en" aria-hidden="true">
                Explorers
              </p>
              <h2 className="section__ko" id="explorers-title">
                스탬프를 많이 모은 회원
              </h2>
            </div>
            <ArticleList label="스탬프가 많은 회원 5명">
              {stats.collectors.map((item, index) => (
                <ArticleRow
                  key={item.user.id}
                  thumb={<Avatar user={item.user} size={72} />}
                  columns={[
                    {
                      label: 'Rank',
                      value: <span className="rank">{String(index + 1).padStart(2, '0')}</span>,
                    },
                    { label: 'Joined', value: formatDate(item.user.createdAt) },
                    { label: 'Stamps', value: `${formatNumber(item.count)}개` },
                  ]}
                  title={
                    <Link to={`/users/${encodeURIComponent(item.user.id)}`} className="row__link">
                      {item.user.nickname}
                    </Link>
                  }
                />
              ))}
            </ArticleList>
            <div className="section__more">
              <ButtonLink to="/users">회원 모두 보기</ButtonLink>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
