import prisma from '../config/db';

export class OwnerService {
  /**
   * Public: Get Owner details
   */
  async getOwnerDetails() {
    const owner = await prisma.owner.findFirst({
      orderBy: { id: 'asc' },
    });
    return owner;
  }

  /**
   * Admin: Update or initialize owner details
   */
  async updateOwnerDetails(data: {
    name?: string;
    photo?: string;
    position?: string;
    title?: string;
    biography?: string;
    bio?: string;
    experience?: string;
    contact?: string;
    phone?: string;
    email?: string;
    social_links?: any;
    [key: string]: any;
  }) {
    const existing = await prisma.owner.findFirst();

    // Whitelist and normalize fields to prevent Prisma unknown argument errors
    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.photo !== undefined) payload.photo = data.photo;
    if (data.position !== undefined || data.title !== undefined) {
      payload.position = data.position || data.title;
    }
    if (data.biography !== undefined || data.bio !== undefined) {
      payload.biography = data.biography || data.bio;
    }
    if (data.experience !== undefined) payload.experience = data.experience;
    if (data.contact !== undefined || data.phone !== undefined) {
      payload.contact = data.contact || data.phone;
    }
    if (data.email !== undefined) payload.email = data.email;
    if (data.social_links !== undefined) payload.social_links = data.social_links;

    if (existing) {
      return await prisma.owner.update({
        where: { id: existing.id },
        data: payload as any,
      });
    } else {
      return await prisma.owner.create({
        data: {
          name: payload.name || 'Owner',
          position: payload.position || 'Founder & Head Coach',
          biography: payload.biography || '',
          ...payload,
        } as any,
      });
    }
  }
}

export const ownerService = new OwnerService();
export default ownerService;
