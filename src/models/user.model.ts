import { UserType } from "@prisma/client";

export interface CreateUserDTO {
  name: string;
  password: string;
  email: string;
  basePath: string;
}

export interface UserResponseDTO {
  id: string;
  name: string;
  email: string;
  type: UserType;
  basePath: string;
}

export interface UserLoginResponseDTO extends UserResponseDTO {
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