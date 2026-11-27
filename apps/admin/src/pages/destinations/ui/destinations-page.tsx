import { useMemo, useState } from 'react';
import {
  LORE_LABELS,
  loreSchema,
  REALM_LABELS,
  realmSchema,
  type Lore,
  type Realm,
} from '@admin/shared/api';
import { formatDate, formatNumber, Link, useDocumentTitle } from '@admin/shared/lib';
import {
  ArticleList,
  ArticleRow,
  ButtonLink,
  Empty,
  ErrorState,
  Loading,
  PageHead,
  Tile,
} from '@admin/shared/ui';
import {
  EMPTY_FILTER,
  filterDestinations,
  useDestinations,
  type DestinationFilter,
} from '@admin/entities/destination';
import { HiddenToggle } from '@admin/features/toggle-hidden';

const VISIBILITY_LABELS: Record<DestinationFilter['visibility'], string> = {
  all: '전체',
  visible: '공개',
  hidden: '숨김',
};
const isVisibility = (value: string): value is DestinationFilter['visibility'] =>
  value in VISIBILITY_LABELS;

/** 여행지 목록: 검색과 필터를 한 줄에 두고, 레퍼런스 뉴스 목록 모양으로 보여 줍니다. */
export function DestinationsPage() {
  useDocumentTitle('여행지');
  const destinations = useDestinations();
  const [filter, setFilter] = useState<DestinationFilter>(EMPTY_FILTER);
  const list = useMemo(
    () => filterDestinations(destinations.data ?? [], filter),
    [destinations.data, filter],
  );

  return (
    <>
      <PageHead en="Destinations" ko="여행지">
        <ButtonLink to="/destinations/new">여행지 추가</ButtonLink>
      </PageHead>
      <div className="section">
        <div className="filters" role="search" aria-label="여행지 검색과 필터">
          <div className="filters__field filters__field--grow">
            <label htmlFor="destination-search">검색</label>
            <input
              id="destination-search"
              className="input"
              type="search"
              placeholder="이름, 원어, 지역, 묶음"
              value={filter.keyword}
              onChange={(event) => setFilter({ ...filter, keyword: event.target.value })}
            />
          </div>
          <div className="filters__field">
            <label htmlFor="destination-realm">세계</label>
            <select
              id="destination-realm"
              className="input"
              value={filter.realm}
              onChange={(event) => {
                const realm = realmSchema.safeParse(event.target.value);
                setFilter({ ...filter, realm: realm.success ? realm.data : 'all', lore: 'all' });
              }}
            >
              <option value="all">전체</option>
              {realmSchema.options.map((realm: Realm) => (
                <option key={realm} value={realm}>
                  {REALM_LABELS[realm]}
                </option>
              ))}
            </select>
          </div>
          <div className="filters__field">
            <label htmlFor="destination-lore">분류</label>
            <select
              id="destination-lore"
              className="input"
              value={filter.lore}
              onChange={(event) => {
                const lore = loreSchema.safeParse(event.target.value);
                setFilter({ ...filter, lore: lore.success ? lore.data : 'all' });
              }}
            >
              <option value="all">전체</option>
              {loreSchema.options.map((lore: Lore) => (
                <option key={lore} value={lore}>
                  {LORE_LABELS[lore]}
                </option>
              ))}
            </select>
          </div>
          <div className="filters__field">
            <label htmlFor="destination-visibility">공개</label>
            <select
              id="destination-visibility"
              className="input"
              value={filter.visibility}
              onChange={(event) => {
                const value = event.target.value;
                if (isVisibility(value)) setFilter({ ...filter, visibility: value });
              }}
            >
              {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="result-count" role="status">
          {destinations.data
            ? `${formatNumber(list.length)}곳 / 전체 ${formatNumber(destinations.data.length)}곳`
            : ''}
        </p>
        {destinations.isPending ? <Loading /> : null}
        {destinations.error ? <ErrorState error={destinations.error} /> : null}
        {destinations.data && !list.length ? <Empty>조건에 맞는 여행지가 없습니다.</Empty> : null}
        <ArticleList label="여행지 목록">
          {list.map((item) => (
            <ArticleRow
              key={item.id}
              muted={item.hidden}
              thumb={
                <Tile
                  label={item.originalName || item.name}
                  tone={item.hidden ? 'muted' : item.realm}
                />
              }
              columns={[
                {
                  label: 'Category',
                  value: (
                    <span className={`dot-label dot-label--${item.realm}`}>
                      {REALM_LABELS[item.realm]} · {LORE_LABELS[item.lore]}
                    </span>
                  ),
                },
                { label: 'Region', value: item.group },
                { label: 'Updated', value: formatDate(item.updatedAt) },
              ]}
              title={
                <>
                  <Link to={`/destinations/${encodeURIComponent(item.id)}`} className="row__link">
                    {item.name}
                    {item.hidden ? <span className="tag">숨김</span> : null}
                  </Link>
                  <p className="row__sub">{item.tagline}</p>
                </>
              }
              actions={
                <HiddenToggle
                  kind="destination"
                  id={item.id}
                  name={item.name}
                  hidden={item.hidden}
                />
              }
            />
          ))}
        </ArticleList>
      </div>
    </>
  );
}
