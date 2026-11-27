import { useState } from 'react';
import type { Badge } from '@admin/shared/api';
import { useDocumentTitle } from '@admin/shared/lib';
import { Button, Empty, ErrorState, Loading, PageHead } from '@admin/shared/ui';
import { useBadges } from '@admin/entities/badge';
import { BadgeEditDialog } from '@admin/features/badge-edit';
import { HiddenToggle } from '@admin/features/toggle-hidden';

/** 기념 뱃지. 이름·설명과 공개 여부만 고치고, 획득 조건은 앱 코드가 계산합니다. */
export function BadgesPage() {
  useDocumentTitle('기념 뱃지');
  const badges = useBadges();
  const [editing, setEditing] = useState<Badge | null>(null);
  return (
    <>
      <PageHead en="Badges" ko="기념 뱃지" />
      <div className="section">
        <p className="section__intro">
          현장 인증 스탬프를 모으면 받는 뱃지입니다. 숨긴 뱃지는 앱의 뱃지 목록에서 빠집니다.
        </p>
        {badges.isPending ? <Loading /> : null}
        {badges.error ? <ErrorState error={badges.error} /> : null}
        {badges.data && !badges.data.length ? <Empty>뱃지가 없습니다.</Empty> : null}
        <ul className="medals" aria-label="뱃지 목록">
          {badges.data?.map((badge) => (
            <li key={badge.id} className={`medal${badge.hidden ? ' medal--hidden' : ''}`}>
              <div
                className={`medal__disc medal__disc--${badge.hidden ? 'muted' : badge.tone}`}
                aria-hidden="true"
              >
                <span>{badge.name.slice(0, 1)}</span>
              </div>
              <h2 className="medal__name">
                {badge.name}
                {badge.hidden ? <span className="tag">숨김</span> : null}
              </h2>
              <p className="medal__desc">{badge.description}</p>
              <p className="medal__rule">
                <span className="row__label">Rule</span> {badge.rule}
              </p>
              <div className="medal__actions">
                <Button
                  variant="line"
                  aria-label={`${badge.name} 고치기`}
                  onClick={() => setEditing(badge)}
                >
                  고치기
                </Button>
                <HiddenToggle kind="badge" id={badge.id} name={badge.name} hidden={badge.hidden} />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <BadgeEditDialog badge={editing} onClose={() => setEditing(null)} />
    </>
  );
}
