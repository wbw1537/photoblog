import {
  PrismaClient,
  RelationshipStatus,
  RelationshipType,
} from "@prisma/client";

/**
 * Repository for managing user relationships (sharing connections between users)
 * Handles both local-to-local and local-to-remote user relationships
 */
export class UserRelationshipRepository {
  constructor(private prismaClient: PrismaClient) {}

  /**
   * Find all relationships for a user with filtering and pagination
   * @param userId - The user ID to find relationships for
   * @param skip - Number of records to skip for pagination
   * @param take - Number of records to take for pagination
   * @param filters - Optional filters for relationship type, status, etc.
   */
  async findUserRelationships(
    userId: string,
    skip: number = 0,
    take: number = 50,
    filters?: {
      relationshipType?: RelationshipType;
      status?: RelationshipStatus;
      searchTerm?: string; // Search by name or email
    }
  ) {
    const whereClause = {
      OR: [
        { fromUserId: userId },
        { toUserId: userId }
      ],
      AND: [
        ...(filters?.relationshipType ? [{ relationshipType: filters.relationshipType }] : []),
        ...(filters?.status ? [{ status: filters.status }] : []),
        ...(filters?.searchTerm ? [{
          OR: [
            { fromUser: { name: { contains: filters.searchTerm } } },
            { fromUser: { email: { contains: filters.searchTerm } } },
            { toUser: { name: { contains: filters.searchTerm } } },
            { toUser: { email: { contains: filters.searchTerm } } }
          ]
        }] : [])
      ]
    };

    const [relationships, total] = await this.prismaClient.$transaction([
      this.prismaClient.userRelationship.findMany({
        where: whereClause,
        skip,
        take,
        include: {
          fromUser: {
            include: {
              localUser: true,
              remoteUser: true
            }
          },
          toUser: {
            include: {
              localUser: true,
              remoteUser: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prismaClient.userRelationship.count({ where: whereClause })
    ]);

    return {
      data: relationships,
      pagination: {
        skip,
        take,
        total
      }
    };
  }

  /**
   * Find a specific relationship between two users
   * @param fromUserId - The initiator user ID
   * @param toUserId - The target user ID
   */
  async findRelationship(fromUserId: string, toUserId: string) {
    return await this.prismaClient.userRelationship.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId
        }
      },
      include: {
        fromUser: {
          include: {
            localUser: true,
            remoteUser: true
          }
        },
        toUser: {
          include: {
            localUser: true,
            remoteUser: true
          }
        }
      }
    });
  }

  /**
   * Find relationship by ID
   * @param id - The relationship ID
   */
  async findById(id: string) {
    return await this.prismaClient.userRelationship.findUnique({
      where: { id },
      include: {
        fromUser: {
          include: {
            localUser: true,
            remoteUser: true
          }
        },
        toUser: {
          include: {
            localUser: true,
            remoteUser: true
          }
        }
      }
    });
  }

  /**
   * Create a new user relationship (sharing request)
   * @param fromUserId - The user initiating the relationship
   * @param toUserId - The target user
   * @param relationshipType - Type of relationship (Share/Block)
   * @param comment - Optional comment
   * @param permissions - JSON permissions object
   */
  async createRelationship(
    fromUserId: string,
    toUserId: string,
    relationshipType: RelationshipType,
    comment?: string,
    permissions?: object
  ) {
    return await this.prismaClient.userRelationship.create({
      data: {
        fromUserId,
        toUserId,
        relationshipType,
        status: RelationshipStatus.Pending,
        comment,
        permissions
      },
      include: {
        fromUser: {
          include: {
            localUser: true,
            remoteUser: true
          }
        },
        toUser: {
          include: {
            localUser: true,
            remoteUser: true
          }
        }
      }
    });
  }

  /**
   * Update relationship status (activate, block, etc.)
   * @param id - Relationship ID
   * @param status - New status
   * @param permissions - Optional updated permissions
   */
  async updateRelationshipStatus(
    id: string,
    status: RelationshipStatus,
    permissions?: object
  ) {
    return await this.prismaClient.userRelationship.update({
      where: { id },
      data: {
        status,
        ...(permissions && { permissions })
      },
      include: {
        fromUser: {
          include: {
            localUser: true,
            remoteUser: true
          }
        },
        toUser: {
          include: {
            localUser: true,
            remoteUser: true
          }
        }
      }
    });
  }

  /**
   * Delete a relationship
   * @param id - Relationship ID
   */
  async deleteRelationship(id: string) {
    return await this.prismaClient.userRelationship.delete({
      where: { id }
    });
  }

  /**
   * Get all active sharing relationships for a user
   * Used to determine what users can access each other's resources
   * @param userId - The user ID
   */
  async getActiveShareRelationships(userId: string) {
    return await this.prismaClient.userRelationship.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId }
        ],
        relationshipType: RelationshipType.Share,
        status: RelationshipStatus.Active
      },
      include: {
        fromUser: {
          include: {
            localUser: true,
            remoteUser: true
          }
        },
        toUser: {
          include: {
            localUser: true,
            remoteUser: true
          }
        }
      }
    });
  }

  /**
   * Check if two users have an active sharing relationship
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   */
  async hasActiveShareRelationship(userId1: string, userId2: string): Promise<boolean> {
    const relationship = await this.prismaClient.userRelationship.findFirst({
      where: {
        OR: [
          { fromUserId: userId1, toUserId: userId2 },
          { fromUserId: userId2, toUserId: userId1 }
        ],
        relationshipType: RelationshipType.Share,
        status: RelationshipStatus.Active
      }
    });

    return !!relationship;
  }
}