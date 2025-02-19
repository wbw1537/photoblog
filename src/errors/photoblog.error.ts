
export class PhotoBlogError extends Error {
  constructor(
    public readonly message: string, 
    public readonly statusCode: number
  ) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'PhotoBlogError';
  }
}