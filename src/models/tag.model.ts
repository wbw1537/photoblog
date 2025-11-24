export enum ResourceType {
  BLOG = 'blog',
  PHOTO = 'photo',
}

export interface CreateTagDTO {
  resourceType: ResourceType;
  resourceId: string;
  tags: string[];
}