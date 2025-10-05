import { UserType } from "@prisma/client";
import { PhotoFileForScan } from "./photo-file.model";

export interface CreateUserDTO {
  name: string;
  password: string;
  email: string;
  instanceUrl?: string;
}

export interface UserInfoDTO {
  id: string;
  name: string;
  email: string;
  type: UserType;
  instanceUrl: string;
  basePath: string;
  cachePath: string;
}

export interface ModifyUserInfoRequestDTO {
  name?: string;
  email?: string;
  password?: string;
  instanceUrl?: string;
  basePath?: string;
  cachePath?: string;
}

export interface PublicUserResponseDTO {
  users: PublicUserInfoDTO[];
}

export interface PublicUserInfoDTO {
  id: string;
  name: string;
  email: string;
  instanceUrl: string;
}

export interface UserLoginResponseDTO extends UserInfoDTO {
  accessToken: Token;
  refreshToken: Token;
}

export interface Token {
  token: string;
  expiresAt: number;
  tokenType: string;
}

export interface TokenResponseDTO {
  accessToken: Token;
  refreshToken?: Token;
}

export const placeholder = "**PLACEHOLDER**" as const;

export type ValidatedUserForScan = {
  id: string;
  localUser: {
    basePath: string;
    cachePath: string;
  };
  photos: Array<{
    id: string;
    files: PhotoFileForScan[];
  }>;
};