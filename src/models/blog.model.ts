export interface CreateBlogDTO {
  title: string;
  content: string;
  blogType: string;
  blogMedia: {
    mediaType: string;
    mediaId: string;
    mediaPosition: number;
  }[];
}
