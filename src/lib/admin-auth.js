import mongoose from 'mongoose';

export function getSessionUserId(session) {
  return session?.user?.id || session?.user?.sub || null;
}

export function isValidObjectId(id) {
  return Boolean(id) && mongoose.Types.ObjectId.isValid(id);
}

export function canManagerModifyTarget(session, targetUser) {
  if (session.user.role !== 'manager') return true;
  return !['admin', 'manager'].includes(targetUser.role);
}
