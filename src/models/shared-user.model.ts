import { RelationshipStatus } from "@prisma/client";
import { TokenResponseDTO } from "./user.model.js";

// A string literal type to represent the calculated direction of a relationship
export type RelationshipDirection = 'Incoming' | 'Outgoing';

/**
 * DTO for initiating a relationship with a user on a remote instance.
 */
export interface SharedUserInitRequestDTO {
  requestToUserInfo: {
    id: string;
    address: string;
  }
  comment: string;
}

/**
 * DTO for the initial handshake request received from a remote instance.
 * (Part of the inter-instance API contract)
 */
export interface SharedUserInitRemoteRequestDTO {
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

/**
 * DTO for the response to the initial handshake.
 * (Part of the inter-instance API contract)
 */
export interface SharedUserInitRespondDTO {
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

/**
 * DTO representing the public-facing information of a relationship.
 * Used to send relationship details to the frontend.
 */
export interface RelationshipInfoDTO {
  id: string; // The ID of the UserRelationship record
  name: string;
  email: string;
  remoteAddress: string;
  status: RelationshipStatus;
  direction: RelationshipDirection;
  comment: string | null;
}

/**
 * DTO for querying a user's relationships.
 */
export interface GetRelationshipsRequestDTO {
  name?: string;
  email?: string;
  status?: RelationshipStatus;
  direction?: RelationshipDirection;
  skip: number;
  take: number;
}

// --- Handshake and Session DTOs (Inter-instance API contract) ---

export interface SharedUserExchangeKeyRequest {
  requestToUserInfo: { id: string; }
  requestFromUserInfo: { id: string; }
  encryptedPublicKey: string;
  timestamp: number;
}

export interface SharedUserExchangeKeyRespond {
  requestFromUserInfo: { id: string; }
  requestToUserInfo: { id: string; }
  encryptedPublicKey: string;
  signature: string;
  timestamp: number;
}

export interface SharedUserValidateRequest {
  requestFromUserInfo: { id: string; }
  requestToUserInfo: { id: string; }
  signature: string;
  timestamp: number;
}

export interface SessionResponseDTO extends TokenResponseDTO {
  session: string;
}

export interface SessionRequestDTO {
  requestFromUserInfo: { id: string; };
  requestToUserInfo: { id: string; };
  signature: string;
  timestamp: number;
}

export interface refreshTokenRequestDTO {
  requestFromUserInfo: { id: string; };
  requestToUserInfo: { id: string; };
  refreshToken: string;
}

export interface SharedUserContextRequestDTO {
  requestToUserInfo: { id: string; }
  requestFromUserInfo?: { id: string; }
  requestUrl: string;
  requestBody: object;
  requestMethod: string;
  requestHeaders?: HeadersInit;
}
