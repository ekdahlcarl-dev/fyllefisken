export const MEMBER_ROLES = ["member", "admin"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];
