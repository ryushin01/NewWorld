import type { ReactNode } from 'react';

export type RowColumn = { label: string; value: ReactNode; wide?: boolean };

/**
 * 레퍼런스 뉴스 목록의 행: 왼쪽 썸네일, 오른쪽 위 가는 선과 회색 영문 머리글(CATEGORY·DATE·TITLE).
 * 제목 링크가 행 전체를 덮어 어디를 눌러도 상세로 가고, 버튼은 그 위에 둡니다.
 */
export function ArticleRow({
  thumb,
  columns,
  title,
  actions,
  muted = false,
}: {
  thumb?: ReactNode;
  columns: RowColumn[];
  title: ReactNode;
  actions?: ReactNode;
  muted?: boolean;
}) {
  return (
    <li className={`row${muted ? ' row--muted' : ''}${thumb ? '' : ' row--plain'}`}>
      {thumb ? <div className="row__thumb">{thumb}</div> : null}
      <div className="row__content">
        <dl className="row__columns">
          {columns.map((column) => (
            <div
              key={column.label}
              className={`row__column${column.wide ? ' row__column--wide' : ''}`}
            >
              <dt className="row__label">{column.label}</dt>
              <dd className="row__value">{column.value}</dd>
            </div>
          ))}
        </dl>
        <div className="row__title">{title}</div>
        {actions ? <div className="row__actions">{actions}</div> : null}
      </div>
    </li>
  );
}

export function ArticleList({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul className="rows" aria-label={label}>
      {children}
    </ul>
  );
}
