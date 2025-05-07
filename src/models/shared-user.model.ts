import { SharedUserDirection, SharedUserStatus } from "@prisma/client";

export interface SharedUserInitRequestDTO {
  requestToUserInfo: {
    id: string;
    address: string;
  }
  comment: string;
}

export interface SharedUserInitRemoteRequestDTO {
  // Remote user info
  requestFromUserInfo: {
    id: string;
    name: string;
    email: string;
    remoteAddress: string;
  };
  requestToUserInfo: {
    id: string;
  };
  tempPublicKey: string;
  timestamp: number;
  comment: string;
}

export interface SharedUserInitRespondDTO {
  // Remote user info
  requestFromUserInfo: {
    id: string;
  };
  requestToUserInfo: {
    id: string;
    name: string;
    email: string;
    remoteAddress: string;
  };
  tempPublicKey: string;
  timestamp: number;
}

export interface RequestUserInfo {
  id: string;
  name: string;
  email: string;
  remoteAddress: string;
}

export interface SharedUserInfo {
  id: string;
  name: string;
  email: string;
  remoteAddress: string;
  status: SharedUserStatus;
  direction: SharedUserDirection;
  comment: string;
}

export interface SharedUserRequest {
  name?: string;
  email?: string;
  remoteAddress?: string;
  status?: SharedUserStatus;
  direction?: SharedUserDirection;

  skip: number;
  take: number;
}

export interface SharedUserExchangeKeyRequest {
  requestToUserInfo: {
    id: string;
  }
  requestFromUserInfo: {
    id: string;
  }
  encryptedPublicKey: string;
  timestamp: number;
}

export interface SharedUserExchangeKeyRespond {
  requestFromUserInfo: {
    id: string;
  }
  requestToUserInfo: {
    id: string;
  }
  encryptedPublicKey: string;
  signature: string;
  timestamp: number;
}

export interface SharedUserValidateDTO {
  requestFromUserInfo: {
    id: string;
  }
  requestToUserInfo: {
    id: string;
  }
  signature: string;
  timestamp: number;
}