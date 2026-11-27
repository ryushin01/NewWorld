import { formatDate, formatNumber, Link, useDocumentTitle, useParam } from '@admin/shared/lib';
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
import { useCourses } from '@admin/entities/course';
import { useDestinations } from '@admin/entities/destination';
import { CourseForm } from '@admin/features/course-form';
import { HiddenToggle } from '@admin/features/toggle-hidden';

export function CoursesPage() {
  useDocumentTitle('전설의 현장 코스');
  const courses = useCourses();
  const destinations = useDestinations();
  const nameOf = (id: string) => destinations.data?.find((item) => item.id === id)?.name ?? id;
  return (
    <>
      <PageHead en="Courses" ko="전설의 현장 코스">
        <ButtonLink to="/courses/new">코스 추가</ButtonLink>
      </PageHead>
      <div className="section">
        <p className="section__intro">
          실존 유적과 전설의 땅을 잇는 추천 코스입니다. 코스의 여행지를 모두 인증하면 앱이 ‘○○ 완주’
          기념 뱃지를 줍니다.
        </p>
        {courses.isPending ? <Loading /> : null}
        {courses.error ? <ErrorState error={courses.error} /> : null}
        {courses.data && !courses.data.length ? <Empty>코스가 없습니다.</Empty> : null}
        <ArticleList label="코스 목록">
          {courses.data?.map((course) => (
            <ArticleRow
              key={course.id}
              muted={course.hidden}
              thumb={<Tile label={course.title} tone={course.hidden ? 'muted' : 'fantasy'} />}
              columns={[
                { label: 'Stops', value: `${formatNumber(course.stops.length)}곳` },
                { label: 'ID', value: <code>{course.id}</code> },
                { label: 'Updated', value: formatDate(course.updatedAt) },
              ]}
              title={
                <>
                  <Link to={`/courses/${encodeURIComponent(course.id)}/edit`} className="row__link">
                    {course.title}
                    {course.hidden ? <span className="tag">숨김</span> : null}
                  </Link>
                  <p className="row__sub">{course.stops.map(nameOf).join(' → ')}</p>
                </>
              }
              actions={
                <HiddenToggle
                  kind="course"
                  id={course.id}
                  name={course.title}
                  hidden={course.hidden}
                />
              }
            />
          ))}
        </ArticleList>
      </div>
    </>
  );
}

export function CourseNewPage() {
  useDocumentTitle('코스 추가');
  return (
    <>
      <PageHead en="New course" ko="코스 추가" />
      <div className="section">
        <CourseForm />
      </div>
    </>
  );
}

export function CourseEditPage() {
  const id = useParam('id');
  const courses = useCourses();
  const course = courses.data?.find((item) => item.id === id);
  useDocumentTitle(course ? `${course.title} 코스 수정` : '코스 수정');
  return (
    <>
      <PageHead en="Edit course" ko={course ? `${course.title} 수정` : '코스 수정'} />
      <div className="section">
        {courses.isPending ? <Loading /> : null}
        {courses.error ? <ErrorState error={courses.error} /> : null}
        {courses.data && !course ? (
          <ButtonLink to="/courses">코스를 찾을 수 없습니다. 목록으로</ButtonLink>
        ) : null}
        {course ? <CourseForm key={course.updatedAt} initial={course} /> : null}
      </div>
    </>
  );
}
