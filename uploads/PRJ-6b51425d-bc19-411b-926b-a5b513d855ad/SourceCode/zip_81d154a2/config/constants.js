
import crypto from "crypto";


export const ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "superAdmin",
  SYSTEM_ADMIN: "systemAdmin",
  PROJECT_CREATOR: 'Project Creator',
  CONTRIBUTOR: 'Contributor',
};


export const PERMISSIONS = {
  CREATE_USER: "create:user",
  READ_USER: "read:user",
  UPDATE_USER: "update:user",
  DELETE_USER: "delete:user",
  CREATE_PROJECT: "create:project",
  READ_PROJECT: "read:project",
  UPDATE_PROJECT: "update:project",
  DELETE_PROJECT: "delete:project",
  MANAGE_ROLES: "manage:roles"
};

export const ROLE_PERMISSIONS = {
  [ROLES.USER]: [
    PERMISSIONS.READ_PROJECT,
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.UPDATE_PROJECT
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.READ_USER,
    PERMISSIONS.READ_PROJECT,
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.UPDATE_PROJECT,
    PERMISSIONS.DELETE_PROJECT
  ],
  [ROLES.SYSTEM_ADMIN]: [
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.READ_PROJECT,
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.UPDATE_PROJECT,
    PERMISSIONS.DELETE_PROJECT
  ],
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.READ_PROJECT,
    PERMISSIONS.UPDATE_PROJECT,
    PERMISSIONS.DELETE_PROJECT,
    PERMISSIONS.MANAGE_ROLES
  ]
};

export const USER_TYPES = {
  STUDENT: "student",
  FREELANCER: "freelancer",
  CREATOR: "creator",
  PROFESSIONAL: "professional",
  ORGANIZATION: "organization"
};

export const TOKEN_EXPIRY = '24h';

export const JWT_SECRET = crypto
  .createHash("sha256")
  .update("super_secure_custom_passphrase_!@#123")
  .digest("hex");