import type { AdminUser } from '@admin/shared/api';

/** 프로필 사진. 없으면 닉네임 첫 글자를 둡니다. 옆에 닉네임이 있어 alt는 비웁니다. */
export function Avatar({
  user,
  size = 48,
}: {
  user: Pick<AdminUser, 'nickname' | 'avatarUrl'>;
  size?: number;
}) {
  return user.avatarUrl ? (
    <img className="avatar" src={user.avatarUrl} alt="" width={size} height={size} />
  ) : (
    <span className="avatar avatar--empty" style={{ width: size, height: size }} aria-hidden="true">
      {user.nickname.slice(0, 1)}
    </span>
  );
}
