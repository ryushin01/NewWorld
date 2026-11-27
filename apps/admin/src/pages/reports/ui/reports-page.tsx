import { useMemo, useState } from 'react';
import {
  REPORT_STATUS_LABELS,
  REPORT_TARGET_LABELS,
  reportStatusSchema,
  type Report,
  type ReportStatus,
} from '@admin/shared/api';
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
import { useReports } from '@admin/entities/report';
import { Avatar, useUsers } from '@admin/entities/user';
import { HandleReportDialog } from '@admin/features/handle-report';

/** 닉네임·프로필 사진 신고. 처리 대기부터 보여 줍니다. */
export function ReportsPage() {
  useDocumentTitle('신고 처리');
  const reports = useReports();
  const users = useUsers();
  const [status, setStatus] = useState<ReportStatus | 'all'>('open');
  const [handling, setHandling] = useState<Report | null>(null);
  const userOf = (id: string) => users.data?.find((user) => user.id === id);
  const list = useMemo(
    () => (reports.data ?? []).filter((report) => status === 'all' || report.status === status),
    [reports.data, status],
  );
  const countOf = (value: ReportStatus | 'all') =>
    (reports.data ?? []).filter((report) => value === 'all' || report.status === value).length;

  return (
    <>
      <PageHead en="Reports" ko="신고 처리" />
      <div className="section">
        <div className="segmented" role="group" aria-label="처리 상태로 거르기">
          {[...reportStatusSchema.options, 'all' as const].map((value) => (
            <button
              key={value}
              type="button"
              className="segmented__item"
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
            >
              {value === 'all' ? '전체' : REPORT_STATUS_LABELS[value]}{' '}
              <span className="segmented__count">{countOf(value)}</span>
            </button>
          ))}
        </div>
        <p className="result-count" role="status">
          {reports.data ? `${formatNumber(list.length)}건` : ''}
        </p>
        {reports.isPending ? <Loading /> : null}
        {reports.error ? <ErrorState error={reports.error} /> : null}
        {reports.data && !list.length ? <Empty>해당하는 신고가 없습니다.</Empty> : null}
        <ArticleList label="신고 목록">
          {list.map((report) => {
            const target = userOf(report.targetId);
            const reporter = userOf(report.reporterId);
            const name = target?.nickname ?? '탈퇴한 회원';
            return (
              <ArticleRow
                key={report.id}
                muted={report.status !== 'open'}
                thumb={target ? <Avatar user={target} size={72} /> : undefined}
                columns={[
                  {
                    label: 'Status',
                    value: (
                      <span
                        className={`dot-label${report.status === 'open' ? ' dot-label--alert' : ''}`}
                      >
                        {REPORT_STATUS_LABELS[report.status]}
                      </span>
                    ),
                  },
                  { label: 'Target', value: REPORT_TARGET_LABELS[report.target] },
                  { label: 'Date', value: formatDateTime(report.createdAt) },
                ]}
                title={
                  <>
                    <Link
                      to={`/users/${encodeURIComponent(report.targetId)}`}
                      className="row__link"
                    >
                      {name}
                    </Link>
                    <p className="row__sub">
                      {report.reason}{' '}
                      <span className="row__by">
                        — 신고한 회원 {reporter?.nickname ?? '알 수 없음'}
                      </span>
                    </p>
                    {report.resolutionNote ? (
                      <p className="row__sub row__note">처리 메모: {report.resolutionNote}</p>
                    ) : null}
                  </>
                }
                actions={
                  report.status === 'open' ? (
                    <Button
                      variant="line"
                      className="row__action"
                      aria-label={`${name}의 ${REPORT_TARGET_LABELS[report.target]} 신고 처리하기`}
                      onClick={() => setHandling(report)}
                    >
                      처리하기
                    </Button>
                  ) : undefined
                }
              />
            );
          })}
        </ArticleList>
      </div>
      <HandleReportDialog
        report={handling}
        target={handling ? userOf(handling.targetId) : undefined}
        onClose={() => setHandling(null)}
      />
    </>
  );
}
