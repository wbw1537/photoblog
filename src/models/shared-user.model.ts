export interface SharedUserInitRequestDTO {
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
  requestFromUserInfo: {
    id: string;
  };
  requestToUserInfo: {
    id: string;
    name: string;
    email: string;
    remoteAddress?: string;
  };
  tempPublicKey: string;
  timestamp: number;
}