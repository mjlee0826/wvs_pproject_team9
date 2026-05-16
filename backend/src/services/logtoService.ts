import { prisma } from '../utils/prismaClient';
import { logtoRequest } from '../utils/logtoAdmin';
import { ApiError } from '../utils/apiError';

interface LogtoRole {
  id: string;
  name: string;
}

export async function checkAllowedAdmin(email: string) {
  const allowed = await prisma.allowedAdminEmail.findUnique({ where: { email } });
  console.log(`[LogtoService] checkAllowedAdmin email=${email} 結果=${!!allowed}`);
  return !!allowed;
}

export async function assignRole(
  userId: string,
  email: string,
  role: 'student' | 'admin',
) {
  console.log(`[LogtoService] assignRole 開始 userId=${userId} email=${email} role=${role}`);

  if (role === 'admin') {
    console.log(`[LogtoService] 檢查 admin 白名單 email=${email}`);
    const allowed = await checkAllowedAdmin(email);
    if (!allowed) {
      throw new ApiError('Your email is not authorized to be an admin', 403);
    }
    console.log(`[LogtoService] email 在白名單中，繼續指派`);
  }

  console.log(`[LogtoService] 取得 Logto 角色列表`);
  const roles = await logtoRequest<LogtoRole[]>('GET', '/roles');
  console.log(`[LogtoService] 取得到 ${roles.length} 個角色:`, roles.map(r => r.name));

  const targetRole = roles.find((r) => r.name === role);
  if (!targetRole) {
    console.error(`[LogtoService] 找不到角色 "${role}"，現有角色:`, roles.map(r => r.name));
    throw new ApiError(`Role "${role}" not found in Logto`, 500);
  }
  console.log(`[LogtoService] 找到目標角色 id=${targetRole.id} name=${targetRole.name}`);

  console.log(`[LogtoService] 取得使用者現有角色`);
  const userRoles = await logtoRequest<LogtoRole[]>('GET', `/users/${userId}/roles`);
  console.log(`[LogtoService] 使用者現有 ${userRoles.length} 個角色，逐一移除`);
  for (const r of userRoles) {
    await logtoRequest('DELETE', `/users/${userId}/roles/${r.id}`);
    console.log(`[LogtoService] 移除舊角色 ${r.name}`);
  }

  console.log(`[LogtoService] 指派新角色 ${role} 給 ${userId}`);
  await logtoRequest('POST', `/users/${userId}/roles`, { roleIds: [targetRole.id] });

  console.log(`[LogtoService] 更新 DB user.role=${role}`);
  await prisma.user.update({ where: { id: userId }, data: { role } });
  console.log(`[LogtoService] assignRole 全部完成`);
}
