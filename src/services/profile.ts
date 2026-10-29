import type { ProfileDto } from '../dtos/profile';
import { HttpError } from '../errors/httpError';
import { findProfile, saveProfile } from '../repositories/profile';
import type { UpdateProfileInput } from '../schemas/profile';

export const profileRepository = {
  findProfile,
  saveProfile,
};

export type ProfileRepository = typeof profileRepository;

export async function getProfile(
  customerID: string,
  repo: ProfileRepository = profileRepository,
): Promise<ProfileDto> {
  const profile = await repo.findProfile(customerID);

  if (!profile) {
    throw new HttpError(404, 'Profile not found');
  }

  return profile;
}

export async function updateProfile(
  customerID: string,
  input: UpdateProfileInput,
  repo: ProfileRepository = profileRepository,
): Promise<ProfileDto> {
  const profile = await repo.saveProfile(customerID, input);

  if (!profile) {
    throw new HttpError(404, 'Profile not found');
  }

  return profile;
}
