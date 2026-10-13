import prisma from '../config/db';

export class BusinessService {
  /**
   * Public: Get Business details
   */
  async getBusinessDetails() {
    const business = await prisma.business.findFirst({
      orderBy: { id: 'asc' },
    });
    return business;
  }

  /**
   * Admin: Update or initialize business details
   */
  async updateBusinessDetails(data: {
    name?: string;
    tagline?: string;
    logo?: string;
    description?: string;
    history?: string;
    mission?: string;
    vision?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    social_links?: any;
    hero_banner?: string;
    [key: string]: any;
  }) {
    const existing = await prisma.business.findFirst();

    // Whitelist allowed fields to prevent Prisma unknown argument errors
    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.tagline !== undefined) payload.tagline = data.tagline;
    if (data.logo !== undefined) payload.logo = data.logo;
    if (data.description !== undefined) payload.description = data.description;
    if (data.history !== undefined) payload.history = data.history;
    if (data.mission !== undefined) payload.mission = data.mission;
    if (data.vision !== undefined) payload.vision = data.vision;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.email !== undefined) payload.email = data.email;
    if (data.website !== undefined) payload.website = data.website;
    if (data.address !== undefined) payload.address = data.address;
    if (data.social_links !== undefined) payload.social_links = data.social_links;
    if (data.hero_banner !== undefined) payload.hero_banner = data.hero_banner;

    if (existing) {
      return await prisma.business.update({
        where: { id: existing.id },
        data: payload as any,
      });
    } else {
      return await prisma.business.create({
        data: {
          name: payload.name || 'Orla Gym and Cafe',
          description: payload.description || '',
          ...payload,
        } as any,
      });
    }
  }
}

export const businessService = new BusinessService();
export default businessService;
