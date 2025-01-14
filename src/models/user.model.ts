import { Photo } from "./photo.model";

export class User {
  id?: string;
  name: string;
  password: string;
  email: string;
  admin: boolean;
  basePath?: string;
  createdAt?: Date;
  updatedAt?: Date;
  photos: Photo[];

  private constructor(
    name: string,
    password: string,
    email: string,
    admin: boolean,
    photos: Photo[],
    id?: string,
    basePath?: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.id = id;
    this.name = name;
    this.password = password;
    this.email = email;
    this.admin = admin;
    this.basePath = basePath;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.photos = photos;
  }

  /**
   * Factory method to create a new user (e.g., before persisting in the database)
   */
  static create(
    name: string, 
    password: string, 
    email: string, 
    admin: boolean = false, 
    photos: Photo[] = []): User {
    return new User(name, password, email, admin, photos);
  }

  /**
   * Factory method to instantiate a user from the database
   */
  static fromDatabase(data: {
    id: string;
    name: string;
    password: string;
    email: string;
    admin: boolean;
    basePath: string;
    createdAt: Date;
    updatedAt: Date;
    photos: Photo[];
  }): User {
    return new User(
      data.name,
      data.password,
      data.email,
      data.admin,
      data.photos,
      data.id,
      data.basePath,
      data.createdAt,
      data.updatedAt
    );
  }
}
