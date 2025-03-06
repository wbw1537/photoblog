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
  token: string;
}

export const placeholder = "**PLACEHOLDER**" as const;