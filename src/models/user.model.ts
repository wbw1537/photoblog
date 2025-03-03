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
  admin: boolean;
  basePath: string;
}

export interface UserLoginResponseDTO extends UserResponseDTO {
  token: string;
}