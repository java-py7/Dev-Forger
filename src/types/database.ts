/**
 * Client-safe database enum types mirroring prisma/schema.prisma
 * Used in client components to prevent bundling @prisma/client into the browser bundle.
 * Each enum provides both a runtime object and a TypeScript type.
 */

export const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AvailabilityStatus = {
  AVAILABLE: "AVAILABLE",
  BUSY: "BUSY",
  NOT_AVAILABLE: "NOT_AVAILABLE",
} as const;
export type AvailabilityStatus =
  (typeof AvailabilityStatus)[keyof typeof AvailabilityStatus];

export const WorkMode = {
  REMOTE: "REMOTE",
  ONSITE: "ONSITE",
  HYBRID: "HYBRID",
} as const;
export type WorkMode = (typeof WorkMode)[keyof typeof WorkMode];

export const CollaborationPreference = {
  INDIVIDUAL: "INDIVIDUAL",
  TEAM: "TEAM",
  BOTH: "BOTH",
} as const;
export type CollaborationPreference =
  (typeof CollaborationPreference)[keyof typeof CollaborationPreference];

export const ProjectSizePreference = {
  SMALL: "SMALL",
  MEDIUM: "MEDIUM",
  LARGE: "LARGE",
  ANY: "ANY",
} as const;
export type ProjectSizePreference =
  (typeof ProjectSizePreference)[keyof typeof ProjectSizePreference];

export const ProfileVisibility = {
  PUBLIC: "PUBLIC",
  DEVELOPERS_ONLY: "DEVELOPERS_ONLY",
  PRIVATE: "PRIVATE",
} as const;
export type ProfileVisibility =
  (typeof ProfileVisibility)[keyof typeof ProfileVisibility];

export const ProjectVisibility = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
} as const;
export type ProjectVisibility =
  (typeof ProjectVisibility)[keyof typeof ProjectVisibility];

export const ProjectStatus = {
  PLANNING: "PLANNING",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  ARCHIVED: "ARCHIVED",
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const ProjectMemberRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  DEVELOPER: "DEVELOPER",
  DESIGNER: "DESIGNER",
  VIEWER: "VIEWER",
} as const;
export type ProjectMemberRole =
  (typeof ProjectMemberRole)[keyof typeof ProjectMemberRole];

export const ApplicationStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
} as const;
export type ApplicationStatus =
  (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const InvitationStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
} as const;
export type InvitationStatus =
  (typeof InvitationStatus)[keyof typeof InvitationStatus];

export const TaskPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskType = {
  TASK: "TASK",
  BUG: "BUG",
  FEATURE: "FEATURE",
  IMPROVEMENT: "IMPROVEMENT",
} as const;
export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const NotificationType = {
  PROJECT_INVITATION: "PROJECT_INVITATION",
  PROJECT_APPLICATION: "PROJECT_APPLICATION",
  TEAM_INVITATION: "TEAM_INVITATION",
  TASK_ASSIGNED: "TASK_ASSIGNED",
  TASK_UPDATED: "TASK_UPDATED",
  MESSAGE: "MESSAGE",
  MENTION: "MENTION",
  DEPLOYMENT: "DEPLOYMENT",
  SYSTEM: "SYSTEM",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const ConversationType = {
  DIRECT: "DIRECT",
  PROJECT: "PROJECT",
  TEAM: "TEAM",
} as const;
export type ConversationType =
  (typeof ConversationType)[keyof typeof ConversationType];

export const WorkspaceFileType = {
  FILE: "FILE",
  FOLDER: "FOLDER",
} as const;
export type WorkspaceFileType =
  (typeof WorkspaceFileType)[keyof typeof WorkspaceFileType];

export const DeploymentStatus = {
  QUEUED: "QUEUED",
  BUILDING: "BUILDING",
  DEPLOYING: "DEPLOYING",
  READY: "READY",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;
export type DeploymentStatus =
  (typeof DeploymentStatus)[keyof typeof DeploymentStatus];

export const BuildStatus = {
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;
export type BuildStatus = (typeof BuildStatus)[keyof typeof BuildStatus];
